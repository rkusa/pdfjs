'use strict'

const PDF = require('./object')
const Parser = require('./parser/parser')

module.exports = class ExternalDocument {
  constructor(src) {
    const parser = new Parser(src)
    parser.parse()

    const catalog  = parser.trailer.get('Root').object.properties
    const pages    = catalog.get('Pages').object.properties

    this.pages = pages
    const kids = pages.get('Kids')
    this.pageCount = kids.length

    this.objects = []
    for (const kid of kids) {
      const page = kid.object

      // delete parent property to prevent endless loops when traversing the objects recursively
      page.properties.del('Parent')

      const objects = []
      Parser.addObjectsRecursive(objects, page)

      this.objects.push(objects)
    }
  }

  // TODO: add mutex to not write concurrently (because of document specific _registerObject)
  async write(doc, page) {
    await doc._endPage()

    const kids = this.pages.get('Kids')
    const pages = page ? [kids[page - 1]] : kids

    for (let i = page ? page - 1 : 0, len = page ? page : kids.length; i < len; ++i) {
      const page = kids[i].object
      const objects = this.objects[i]

      doc._registerObject(page, true)

      // first, register objects to assign IDs (for references)
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

  async setAsTemplate(doc) {
    await doc._endPage()

    const kids = this.pages.get('Kids')
    if (!kids[0]) {
      throw new TypeError('External document is invalid')
    }
    const first = kids[0].object.properties
    const objects = this.objects[0]

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
      contents: contents.map(c => c.toString()),
      colorSpaces: {},
      fonts: {},
      xobjects: {},
    }

    const colorSpaces = resources.get('ColorSpace')
    if (colorSpaces) {
      for (const alias in colorSpaces.dictionary) {
        doc._template.colorSpaces[alias] = colorSpaces.dictionary[alias].toString()
        doc._aliases.block(alias)
      }
    }

    const fonts = resources.get('Font')
    if (fonts) {
      for (const alias in fonts.dictionary) {
        doc._template.fonts[alias] = fonts.dictionary[alias].toString()
        doc._aliases.block(alias)
      }
    }

    const xobjects = resources.get('XObject')
    if (xobjects) {
      for (const alias in xobjects.dictionary) {
        doc._template.xobjects[alias] = xobjects.dictionary[alias].toString()
        doc._aliases.block(alias)
      }
    }
  }
}

