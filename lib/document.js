'use strict'

const Cursor = require('./cursor')
const Fragment = require('./fragment')
const ops = require('./ops')
const PDF = require('./object')
const Readable = require('stream').Readable
const uuid = require('node-uuid')
const version = require('../package.json').version
const util = require('./util')
const ContentChunk = require('./content')

// constants
const RESOLVE = Promise.resolve()

class Document extends Readable {
  constructor(opts) {
    if (!opts) {
      opts = {}
    }

    // readable stream options
    super({
      highWaterMark: opts.highWaterMark || 16384, // 16kB
    })

    this.version = '1.3'
    this.info = {
      id: uuid.v4(),
      producer: `pdfjs v${version} (github.com/rkusa/pdfjs)`,
      creationDate: new Date(),
    }
    this.width = opts.width || 595.296
    this.height = opts.height || 841.896

    this._nextObjectId = 1
    this._xref = new PDF.Xref()
    this._reading = false // wheater someone is reading data from the underlying Readable
    this._length = 0 // keeps track of the total document length (in byte)

    // header
    const header = `%PDF-${this.version}\n`
      // The PDF format mandates that we add at least 4 commented binary characters
      // (ASCII value >= 128), so that generic tools have a chance to detect
      // that it's a binary file
      + '%\xFF\xFF\xFF\xFF\n\n'

    // a backlog of pending operations
    this._pending = [
      () => this._write(header)
    ]
    // this is the current operation that is executed (operations are executed sequentially)
    this._pending.current = null

    // init default styling opts
    this.defaultFont = opts.font
    this.defaultFontSize = opts.fontSize || 11
    this.defaultColor = opts.color && util.colorToRgb(opts.color) || [0, 0, 0]

    // create document and page font dict
    this._fonts = {}
    this._xobjects = {}
    this._pageFonts = {}

    this._nextFontId = 1
    this._nextXObjectId = 1
    this._mapping = new WeakMap()

    // init cursor
    this.padding = opts.padding || 20
    this._cursor = new Cursor(
      this.width - this.padding*2, this.height - this.padding*2, // width, height
      this.padding, this.height - this.padding // x, y
    )

    // init pages catalog
    this._pages = new PDF.Pages(this.width, this.height)
    this._registerObject(this._pages)

    // init color space
    this._colorSpace = new PDF.Object()
    const iccProfile = require('./sRGB_IEC61966-2-1_black_scaled')
    this._colorSpace.content = 'stream\n' + iccProfile + '\nendstream\n'
    this._colorSpace.prop('Length', iccProfile.length)
    this._colorSpace.prop('N', 3)
    this._colorSpace.prop('Alternate', 'DeviceRGB')
    // this._colorSpace.prop('Filter', new PDF.Array([
    //   new PDF.Name('ASCII85Decode'), new PDF.Name('FlateDecode')
    // ]))
    this._colorSpace.prop('Filter', new PDF.Name('ASCII85Decode'))
    this._registerObject(this._colorSpace)

    this._current_content = null
    this._contents = []

    this._nextPageOffset = 0

    // start to work the _pending queue
    this._next()
  }

  /// private API

  _next() {
    // return if there is already an operation worked on
    if (this._pending.current) {
      return this._pending.current
    }

    // variables used to traverse the nested queue
    let parent = this._pending
    let next = parent[0]

    // if there is nothing in the queue, we are done here
    if (!next) {
      return RESOLVE
    }

    // the operation queue is a nested array, e.g.: [op1, [op2, op3, [ op4 ]], op5]
    // it is therefore necessary traverse the first element until the first non array element
    // is encountered
    while (Array.isArray(next)) {
      // if the first element is an empty array, remove it and start over
      if (next.length === 0) {
        parent.shift()
        return this._next()
      }

      parent = next
      next = next[0]
    }

    // remove next from the queue
    parent.shift()

    // TODO: still necessary?
    // if (!next) {
    //   return this._next()
    // }

    // return and set the current operation that is being executed
    return this._pending.current = next().then(() => {
      // once the execution finished, continue in the queue
      this._pending.current = null
      return this._next()
    })
  }

  // This is method is used by Node.js stream.Readable class, which we inherit from.
  // The method is called, if data is available from the resource, which means that we should
  // start pushing data into the read queue (using `this.push(dataChunk)`). It should continue
  // reading from the resoruce and pushing data until `this.push()` return `false`. Only when it
  // is called again aft it has stopped should it resume pushing additional data onto the
  // read queue.
  _read(/* size */) {
    this._reading = true
    this.emit('read')
  }

  // This method is used to push data onto the read queue. If the Readable stream is currently
  // not read from, the writing is postponed.
  _write(chunk) {
    if (this._reading) {
      if (!this.push(chunk, 'binary')) {
        this._reading = false
      }
      this._length += chunk.length
      return RESOLVE
    } else {
      return new Promise(resolve => {
        this.once('read', () => {
          resolve(this._write(chunk))
        })
      })
    }
  }

  _useFont(font) {
    let alias
    if (this._mapping.has(font)) {
      alias = this._mapping.get(font)
    } else {
      alias = new PDF.Name('F' + this._nextFontId++)
      this._mapping.set(font, alias)

      const fontObj = new PDF.Object('Font')
      this._fonts[alias] = { f: font, o: fontObj }
      this._registerObject(fontObj)
    }

    if (this._current_content && !(alias in this._current_content._fonts)) {
      this._current_content._fonts[alias] = this._fonts[alias].o.toReference()
    }

    return alias
  }

  _useXObject(xobj) {
    let alias
    if (this._mapping.has(xobj)) {
      alias = this._mapping.get(xobj)
    } else {
      alias = new PDF.Name('X' + this._nextXObjectId++)
      this._mapping.set(xobj, alias)

      const xobjObj = new PDF.Object('XObject')
      this._xobjects[alias] = { x: xobj, o: xobjObj }
      this._registerObject(xobjObj)
    }

    if (this._current_content && !(alias in this._current_content._xobjects)) {
      this._current_content._xobjects[alias] = this._xobjects[alias].o.toReference()
    }

    return alias
  }

  async _startPage() {
    const page = this._currentPage = new PDF.Page(this._pages, this._colorSpace)
    this._pages.add(this._currentPage)

    await this._startContentObject()
  }

  async _endPage() {
    if (!this._currentPage) {
      await this._startPage()
    }

    await this._endContentObject()

    const pageContents = new PDF.Object()
    pageContents.content = new PDF.Array([])

    this._registerObject(pageContents)
    this._currentPage.prop('Contents', pageContents.toReference())

    for (const content of this._contents) {
      const ref = content._object.toReference()
      pageContents.content.push(ref)

      for (const alias in content._fonts) {
        this._currentPage.fonts.add(alias, content._fonts[alias])
      }

      for (const alias in content._xobjects) {
        this._currentPage.xobjects.add(alias, content._xobjects[alias])
      }
    }

    this._current_content = null
    this._contents.length = 0

    await this._writeObject(pageContents)
    await this._writeObject(this._currentPage)
  }

  async _pageBreak(/* level */) {
    if (!this._currentPage) {
      await this._startPage()
    }

    await this._cursor.reset()

    await this._endPage()
    await this._startPage()
  }

  async _startContentObject() {
    // do not create new content object, if current content object is still empty
    if (this._length == this._contentStart) {
      return this._current_content
    }

    if (this._current_content) {
      await this._endContentObject()
    }

    const content = this._current_content = new ContentChunk(this)
    this._contents.push(content)

    this._xref.add(content._object.id, this._length, content._object)

    let chunk = content._object.id + ' ' + content._object.rev + ' obj\n'
      + content._object.properties.toString() + '\n'
      + 'stream\n'

    this._contentStart = this._length + chunk.length

    // set color space
    chunk += ops.CS('/CS1') + ops.cs('/CS1')
    await this._write(chunk)

    return content
  }

  async _endContentObject() {
    if (!this._current_content) {
      return
    }

    this._current_content._length.content = this._length - this._contentStart - 1
    if (this._current_content._length.content < 0) {
      this._current_content._length.content = 0
    }

    const chunk = 'endstream\nendobj\n\n'
    await this._write(chunk)
    await this._writeObject(this._current_content._length)
  }

  _registerObject(object) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    object.id = this._nextObjectId
    this._nextObjectId++
  }

  _writeObject(object) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    if (!object.id) {
      this._registerObject(object)
    }

    this._xref.add(object.id, this._length, object)
    return this._write(object.toString() + '\n\n')
  }

  // public API

  async sync() {
    await this._next()
  }

  async end() {
    await this.sync()
    await this._endPage()

    // for (const page of this._pages.pages) {
    //   // this._writeObject(page.contents.object)
    //   this._writeObject(page)
    // }
    await this._writeObject(this._pages)
    await this._writeObject(this._colorSpace)

    for (const alias in this._fonts) {
      const font = this._fonts[alias]
      await font.f.write(this, font.o)
    }

    for (const alias in this._xobjects) {
      const xobj = this._xobjects[alias]
      await xobj.x.write(this, xobj.o)
    }

    const catalog = new PDF.Object('Catalog')
    catalog.prop('Pages', this._pages.toReference())
    await this._writeObject(catalog)

    // to support random access to individual objects, a PDF file
    // contains a cross-reference table that can be used to locate
    // and directly access pages and other important objects within the file
    const startxref = this._length
    await this._write(this._xref.toString())

    // trailer
    const objectsCount = this._nextObjectId - 1
    const trailer = new PDF.Trailer(objectsCount + 1, catalog, this.info)
    await this._write(trailer.toString() + '\n')

    // startxref
    await this._write('startxref\n' + startxref + '\n%%EOF')

    // close readable stream
    this.push(null)
  }
}

module.exports = class extends Fragment {
  constructor(opts) {
    const doc = new Document(opts)
    super(doc, doc)
  }

  get info() {
    return this._doc.info
  }

  pipe(dest, opts) {
    return this._doc.pipe(dest, opts)
  }

  sync() {
    return this._doc.sync()
  }

  async end() {
    await Fragment.prototype.end.call(this)
    await this._doc.end()
  }
}
