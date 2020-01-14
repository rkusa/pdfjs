'use strict'

const PDF = require('./object')
const Parser = require('./parser/parser')

const PROPERTIES_TO_COPY = {
  colorSpaces: 'ColorSpace',
  fonts: 'Font',
  xobjects: 'XObject',
  extGStates: 'ExtGState',
  shadings: 'Shading',
}

module.exports = class ExternalDocument {
  constructor(src) {
    const parser = new Parser(src)
    parser.parse()

    const catalog  = parser.trailer.get('Root').object.properties
    const pages    = catalog.get('Pages').object.properties

    this.pages = pages
    this.mediaBox = pages.get('MediaBox')

    const kids = pages.get('Kids')
    this.pageCount = this._countPagesRecursively(kids, 0)
  }

  _countPagesRecursively(kids, i) {
    for (const kid of kids) {
      const page = kid.object
      if (page.properties.get('Type').toString() === '/Pages') {
        // encountered nested pages
        i = this._countPagesRecursively(page.properties.get('Kids'), i)
      } else {
        i++
      }
    }

    return i
  }

  // TODO: add mutex to not write concurrently (because of document specific _registerObject)
  async write(doc, page) {
    await doc._endPage()

    const kids = this.pages.get('Kids')
    const filter = page ? ((i) => i === (page - 1)) : undefined

    for (const page of this._iterPagesRecursively(doc, kids, filter)) {
      // if the page object does not define its MediaBox, explicitly set its MediaBox to the
      // value defined by its parent Pages object
      if (!page.properties.has('MediaBox') && this.mediaBox) {
        page.properties.set('MediaBox', this.mediaBox)
      }

      // add single page
      doc._registerObject(page, true)

      // first, register objects to assign IDs (for references)
      const objects = []
      Parser.addObjectsRecursive(objects, page, 0)
      for (const obj of objects) {
        doc._registerObject(obj, true)
      }

      // write objects
      for (const obj of objects) {
        await doc._writeObject(obj)
      }

      page.prop('Parent', doc._pagesObj.toReference())
      await doc._writeObject(page)

      doc._pages.push(page.toReference())
    }
  }

  * _iterPagesRecursively(doc, kids, filter, cursor) {
    if (!cursor) {
      cursor = { i: 0 }
    }

    for (const kid of kids) {
      const page = kid.object

      if (page.properties.get('Type').toString() === '/Pages') {
        // encountered nested pages
        yield* this._iterPagesRecursively(doc, page.properties.get('Kids'), filter, cursor)
        continue
      } else if (!filter || filter(cursor.i)) {
        yield page
      }

      cursor.i++
    }
  }

  async setAsTemplate(doc, firstPageOnly) {
    await doc._endPage()

    // take the first page only
    const filter = i => i === 0
    const kids = this.pages.get('Kids')
    if (!kids[0]) {
      throw new TypeError('External document is invalid')
    }

    for (const page of this._iterPagesRecursively(doc, kids, filter)) {
      // if the page object does not define its MediaBox, explicitly set its MediaBox to the
      // value defined by its parent Pages object
      if (!page.properties.has('MediaBox') && this.mediaBox) {
        page.properties.set('MediaBox', this.mediaBox)
      }
      const first = page.properties
      const objects = []
      Parser.addObjectsRecursive(objects, page, 0)

      // first, register objects to assign IDs (for references)
      for (const obj of objects) {
        doc._registerObject(obj, true)
      }

      // write objects
      for (const obj of objects) {
        await doc._writeObject(obj)
      }

      let contents = first.get('Contents')
      if (!Array.isArray(contents)) {
        contents = [contents]
      }

      let resources = first.get('Resources')
      if (resources instanceof PDF.Reference) {
      resources = resources.object.properties
      }

      doc._template = {
        contents: contents.map(c => ((c && c.toString()) || '')),
        colorSpaces: {},
        fonts: {},
        xobjects: {},
        extGStates: {},
        shadings: {},
      }

      for (const prop in PROPERTIES_TO_COPY) {
        const dict = resources && resources.get(PROPERTIES_TO_COPY[prop])
        if (dict) {
          for (const alias in dict.dictionary) {
            doc._template[prop][alias] = dict.dictionary[alias].toString()
            doc._aliases.block(alias)
          }
        }
      }

      doc._template.firstPageOnly = firstPageOnly
    }
  }

  async _getPagesRecursively(doc, kids, i, filter) {
    for (const kid of kids) {
      const page = kid.object

      if (page.properties.get('Type').toString() === '/Pages') {
        // encountered nested pages
        i = await this._addPagesRecursively(doc, page.properties.get('Kids'), i, filter)
        continue
      } else if (!filter || filter(i)) {
        // if the page object does not define its MediaBox, explicitly set its MediaBox to the
        // value defined by its parent Pages object
        if (!page.properties.has('MediaBox') && this.mediaBox) {
          page.properties.set('MediaBox', this.mediaBox)
        }

        // add single page
        doc._registerObject(page, true)

        // first, register objects to assign IDs (for references)
        const objects = []
        Parser.addObjectsRecursive(objects, page, 0)
        for (const obj of objects) {
          doc._registerObject(obj, true)
        }

        // write objects
        for (const obj of objects) {
          await doc._writeObject(obj)
        }

        page.prop('Parent', doc._pagesObj.toReference())
        await doc._writeObject(page)

        doc._pages.push(page.toReference())
      }

      i++
    }

    return i
  }
}


