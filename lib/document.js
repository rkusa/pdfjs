'use strict'

const Cursor = require('./cursor')
const Fragment = require('./fragment')
const ops = require('./ops')
const PDF = require('./object')
const Readable = require('stream').Readable
const uuid = require('uuid')
const util = require('./util')
const ContentChunk = require('./content')
const ExternalDocument = require('./external')
const Font = require('./font/base')

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

    this.version = '1.6'
    this.info = Object.assign({}, opts.properties, { id: uuid.v4() })
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
    this.defaultFont = opts.font || require('../font/Helvetica')
    this.defaultFontSize = opts.fontSize || 11
    this.defaultColor = opts.color && util.colorToRgb(opts.color) || [0, 0, 0]
    this.defaultLineHeight = opts.lineHeight || 1.15

    if (!Font.isFont(this.defaultFont)) {
      throw new TypeError('opts.font must be set to a valid default font')
    }

    // create document and page font dict
    this._fonts = {}
    this._xobjects = {}
    this._pageFonts = {}
    this._annotations = []

    // these properties are used to keep track of used Font and Image objects and assign ids to
    // them in a document-scoped way
    this._aliases = new AliasGenerator()
    this._mapping = new WeakMap()

    // a page could consist out of multiple content chunks, which are keept track of using the
    // following properties
    this._currentContent = null
    this._contents = []
    this._contentObjCreator = null

    // this array can be used to register callbacks that are executed when finalizing the document
    // e.g. rendering the total page count
    this._finalize = []

    this._header = this._footer = this._template = null

    // init cursor
    // TODO: test for valid values
    const padding = opts.padding >= 0 ? opts.padding : 20
    this.paddingTop = util.defaults(opts.paddingTop, padding)
    this.paddingBottom = util.defaults(opts.paddingBottom, padding)
    this.paddingLeft = util.defaults(opts.paddingLeft, padding)
    this.paddingRight = util.defaults(opts.paddingRight, padding)

    this._cursor = new Cursor(
      this.width - this.paddingLeft - this.paddingRight, this.height - this.paddingTop - this.paddingBottom, // width, height
      this.paddingLeft, this.height - this.paddingTop // x, y
    )

    // init pages catalog
    this._pages = new PDF.Array()
    this._pagesObj = new PDF.Object('Pages')
    this._registerObject(this._pagesObj)

    // init destinations name tree
    this._destinations = new PDF.NameTree()

    // init outlines hierarchy
    this._outlines = []

    // init color space
    this._colorSpace = new PDF.Object()
    const iccProfile = require('./sRGB_IEC61966-2-1_black_scaled') + '~>'
    this._colorSpace.content = 'stream\n' + iccProfile + '\nendstream\n'
    this._colorSpace.prop('Length', iccProfile.length)
    this._colorSpace.prop('N', 3)
    this._colorSpace.prop('Alternate', 'DeviceRGB')
    // this._colorSpace.prop('Filter', new PDF.Array([
    //   new PDF.Name('ASCII85Decode'), new PDF.Name('FlateDecode')
    // ]))
    this._colorSpace.prop('Filter', new PDF.Name('ASCII85Decode'))
    this._registerObject(this._colorSpace)
    this._currentColorSpace = '/CS1'

    // start to work the _pending queue
    this._next()

    Fragment.prototype._init.call(this, this, this);
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
      // if the alias exists but is now blocked (e.g. because of having set a new template with
      // colliding aliases), remove the mapping and unset the alias to force creation of a new one
      if (this._aliases.isBlocked(alias)) {
        this._mapping.delete(font)
        alias = undefined
      }
    }

    if (!alias) {
      alias = new PDF.Name(this._aliases.next('F'))
      this._mapping.set(font, alias)

      const fontObj = new PDF.Object('Font')
      this._fonts[alias] = { f: font.instance(), o: fontObj }
      this._registerObject(fontObj)
    }

    if (this._currentContent && !(alias in this._currentContent._fonts)) {
      this._currentContent._fonts[alias] = this._fonts[alias].o.toReference()
    }

    return alias
  }

  _fontAlias(instance) {
    return this._useFont(instance.parent)
  }

  _fontInstance(font) {
    return this._fonts[this._useFont(font)].f
  }

  _useXObject(xobj) {
    let alias
    if (this._mapping.has(xobj)) {
      alias = this._mapping.get(xobj)
      // if the alias exists but is now blocked (e.g. because of having set a new template with
      // colliding aliases), remove the mapping and unset the alias to force creation of a new one
      if (this._aliases.isBlocked(alias)) {
        this._mapping.delete(xobj)
        alias = undefined
      }
    }

    if (!alias) {
      alias = new PDF.Name(this._aliases.next('X'))
      this._mapping.set(xobj, alias)

      const xobjObjs = []
      for (let i = 0; i < xobj.xobjCount; ++i) {
        const xobjObj = new PDF.Object('XObject')
        this._registerObject(xobjObj)
        xobjObjs.push(xobjObj)
      }
      this._xobjects[alias] = { x: xobj, o: xobjObjs }
    }

    if (this._currentContent && !(alias in this._currentContent._xobjects)) {
      for (let i = 0; i < this._xobjects[alias].o.length; ++i) {
        this._currentContent._xobjects[alias + '.' + i] = this._xobjects[alias].o[i].toReference()
      }
    }

    const aliases = []
    for (let i = 0; i < this._xobjects[alias].o.length; ++i) {
      aliases.push(alias + '.' + i)
    }
    return aliases
  }

  async _startPage() {
    if (this._currentPage) {
      throw new Error('There is already a started page')
    }

    const page = this._currentPage = new PDF.Object('Page')
    this._pages.push(page.toReference())

    if (this._template) {
      const taken = {}
      for (const alias in this._template.colorSpaces) {
        taken[alias] = null
      }

      let i = 1
      for (1; ('/CS' + i) in taken; ++i) {}
      this._currentColorSpace = '/CS' + i
    } else {
      this._currentColorSpace = '/CS1'
    }

    await this._startContentObject()

    if (this._header) {
      let chunk = ''
      for (const i in this._header._objects) {
        const obj = this._header._objects[i]
        const alias = new PDF.Name(this._aliases.next('H'))
        this._currentContent._xobjects[alias] = obj.toReference()
        chunk += ops.Do(alias)
      }

      await this._write(chunk)
      await this._header._render()
    }

    if (this._footer) {
      let chunk = ''
      for (const i in this._footer._objects) {
        const obj = this._footer._objects[i]
        const alias = new PDF.Name(this._aliases.next('F'))
        this._currentContent._xobjects[alias] = obj.toReference()
        chunk += ops.Do(alias)
      }

      await this._write(chunk)
      await this._footer._render()
    }

    this._cursor.reset()

    if (this._header) {
      this._cursor.y -= this._header.height
    }

    if (this._footer) {
      this._cursor.bottomOffset = this._footer.height
    }
  }

  async _endPage() {
    if (!this._currentPage) {
      return
    }

    await this._endContentObject()

    const fonts = new PDF.Dictionary({})
    const xobjects = new PDF.Dictionary({})

    for (const content of this._contents) {
      for (const alias in content._fonts) {
        fonts.add(alias, content._fonts[alias])
      }

      for (const alias in content._xobjects) {
        xobjects.add(alias, content._xobjects[alias])
      }
    }

    const page = this._currentPage
    page.prop('Parent', this._pagesObj.toReference())

    const colorSpace = new PDF.Dictionary({
      [this._currentColorSpace]: new PDF.Array([new PDF.Name('ICCBased'), this._colorSpace.toReference()])
    })
    page.prop('Resources', new PDF.Dictionary({
      ColorSpace: colorSpace,
      ProcSet: new PDF.Array([
        new PDF.Name('PDF'),
        new PDF.Name('Text'),
        new PDF.Name('ImageB'),
        new PDF.Name('ImageC'),
        new PDF.Name('ImageI')
      ]),
      Font:    fonts,
      XObject: xobjects
    }))

    if (this._annotations.length > 0) {
      page.prop('Annots', new PDF.Array(this._annotations))
      this._annotations = []
    }

    const contents = this._contents.map(c => c._object.toReference())
    page.prop('Contents', new PDF.Array(contents))

    if (this._template) {
      contents.unshift.apply(contents, this._template.contents)

      for (const alias in this._template.colorSpaces) {
        colorSpace.dictionary[alias] = this._template.colorSpaces[alias]
      }

      for (const alias in this._template.fonts) {
        fonts.dictionary[alias] = this._template.fonts[alias]
      }

      for (const alias in this._template.xobjects) {
        xobjects.dictionary[alias] = this._template.xobjects[alias]
      }
    }

    await this._writeObject(page)

    this._currentContent = this._currentPage = null
    this._contents.length = 0
  }

  async _pageBreak(/* level */) {
    if (!this._currentPage) {
      await this._startPage()
    }

    await this._cursor.reset()

    await this._endPage()
    await this._startPage()
  }

  async _startContentObject(obj, force) {
    // do not create new content object, if current content object is still empty
    // 16 = /CS1 CS
    //      /CS1 cs
    if (!force && this._length - 16 == this._contentStart) {
      return this._currentContent
    }

    if (this._currentContent) {
      await this._endContentObject()
    }

    if (this._contentObjCreator) {
      obj = this._contentObjCreator()
    }

    const content = this._currentContent = new ContentChunk(this, obj)
    this._contents.push(content)

    this._xref.add(content._object.id, {
      offset: this._length,
      obj:    content._object,
    })

    let chunk = content._object.id + ' ' + content._object.rev + ' obj\n'
      + content._object.properties.toString() + '\n'
      + 'stream\n'

    this._contentStart = this._length + chunk.length

    // set color space
    chunk += ops.CS(this._currentColorSpace) + ops.cs(this._currentColorSpace)
    await this._write(chunk)

    return content
  }

  async _endContentObject() {
    if (!this._currentContent) {
      return
    }

    this._currentContent._length.content = this._length - this._contentStart - 1
    if (this._currentContent._length.content < 0) {
      this._currentContent._length.content = 0
    }

    const chunk = 'endstream\nendobj\n\n'
    await this._write(chunk)
    await this._writeObject(this._currentContent._length)

    this._currentContent = null
  }

  _registerObject(object, force) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    if (!force && object.id) {
      return
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

    this._xref.add(object.id, {
      offset: this._length,
      obj:    object,
    })
    return this._write(object.toString() + '\n\n')
  }

  _updateOutlinesCount(id) {
    if (this._outlines[id].data.count < 1) {
      this._outlines[id].data.count -= 1
      this._outlines[id].prop('Count', this._outlines[id].data.count)
    } else {
      this._outlines[id].data.count = -1
      this._outlines[id].prop('Count', this._outlines[id].data.count)
    }
    const nextParent = this._outlines[id].data.parentIndex
    if(nextParent !== undefined) {
      this._updateOutlinesCount(nextParent)
    }
  }

  // public API

  async end() {

    await Fragment.prototype.end.call(this);

    await this._next()
    await this._endPage()

    for (const fn of this._finalize) {
      await fn()
    }

    this._pagesObj.prop('MediaBox', new PDF.Array([0, 0, this.width, this.height]))
    this._pagesObj.prop('Kids', this._pages)
    this._pagesObj.prop('Count', this._pages.length)
    await this._writeObject(this._pagesObj)
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
    catalog.prop('Pages', this._pagesObj.toReference())
    if (this._destinations.length > 0) {
      const destsObj = new PDF.Object()
      destsObj.prop("Dests", this._destinations)
      await this._writeObject(destsObj)
      catalog.prop('Names', destsObj.toReference())
    }
    //Write outlines hierarchy if there are outlines
    if(this._outlines.length > 0) {
      for (let i = 0; i < this._outlines.length; i += 1) {
        await this._writeObject(this._outlines[i])
      }
      catalog.prop('Outlines', this._outlines[0].toReference())  
    }
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

  asBuffer(callback) {
    let p = new Promise((resolve, reject) => {
      const chunks = []
      this.on('data', chunk => chunks.push(chunk))
      this.on('end', () => resolve(Buffer.concat(chunks)))
      this.on('error', reject)
      this.end()
    })
    if (typeof callback === 'function') {
      p = p.then(data => callback(null, data)).catch(callback)
    }
    return p
  }


  header() {
    const Header = require('./header')
    const ctx = new Header(this, this)
    this._begin(ctx)

    this._pending.push(() => {
      this._header = ctx
      return ctx._start()
    })

    return ctx
  }

  footer() {
    const Footer = require('./footer')
    const ctx = new Footer(this, this)
    this._begin(ctx)

    this._pending.push(() => {
      this._footer = ctx
      return ctx._start()
    })

    return ctx
  }

  addPagesOf(external) {
    if (!(external instanceof ExternalDocument)) {
      throw new TypeError('argument must be of type ExternalDocument')
    }

    this._begin(null)
    this._pending.push(() => external.write(this))
  }

  addPageOf(page, external) {
    if (!(external instanceof ExternalDocument)) {
      throw new TypeError('argument must be of type ExternalDocument')
    }

    if (!page || page < 1 || page > external.pageCount) {
      throw new TypeError('ExternalDocument does not have page ' + page)
    }

    this._begin(null)
    this._pending.push(() => external.write(this, page))
  }

  setTemplate(external) {
    if (!(external instanceof ExternalDocument)) {
      throw new TypeError('argument must be of type ExternalDocument')
    }

    this._begin(null)
    this._pending.push(() => external.setAsTemplate(this))
  }
}

Object.assign(Document.prototype, {
    _begin: Fragment.prototype._begin,
    _end: Fragment.prototype._end,
    _opts: Fragment.prototype._opts,

    text: Fragment.prototype.text,
    cell: Fragment.prototype.cell,
    table: Fragment.prototype.table,
    image: Fragment.prototype.image,
    pageBreak: Fragment.prototype.pageBreak,
    op: Fragment.prototype.op,
    destination: Fragment.prototype.destination,
    outline: Fragment.prototype.outline,
  })

class AliasGenerator {
  constructor() {
    this.nextId = {}
    this.blocked = new Set()
  }

  next(prefix) {
    if (!(prefix in this.nextId)) {
      this.nextId[prefix] = 1
    }

    let next
    do {
      next = prefix + this.nextId[prefix]++
    } while (this.blocked.has(next))

    return next
  }

  block(alias) {
    alias = String(alias)
    if (alias[0] === '/') {
      alias = alias.slice(1)
    }

    this.blocked.add(alias)
  }

  isBlocked(alias) {
    alias = String(alias)
    if (alias[0] === '/') {
      alias = alias.slice(1)
    }

    return this.blocked.has(alias)
  }

  reset(prefix) {
    this.nextId[prefix] = 1
  }
}

module.exports = Document
