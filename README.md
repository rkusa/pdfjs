# pdfjs

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)

#### Features

- Text (+ formatting)
- Tables
- Header & Footer
- Automatic page breaks
- Font embedding (as CID font, i.e., does supports many characters)

#### Missing Features

AFM fonts and graphics are currently not implemented. If you are missing a feature, feel free to ask or to submit a PR.

#### Contents

1. [Document](#document)
2. [Text](#text)
3. [Table](#table)
4. [Font](#font)
5. [License](#license)

## Document

```js
var Document = require('pdfjs')
```

### new Document(font)

**Arguments:**

* **font** - a font; will be used as default font

**Example:**

```js
var Document = require('pdfjs')
fs.readFile('OpenSans-Regular.ttf', function(err, b) {
  if (err) throw err
  var doc = new Document(new Document.Font(b))
})
```

### .text(text[, opts])

**Arguments:**

* **text** - the text that should be rendered
* **opts** - text options

**Options:**

* **bold** - whether the text should be rendered bold (default: false)
* **italic** - whether the text should be rendered italic  (default: false)
* **light** - whether the text should be rendered light (default: false)
* **align** - the text alignment (default: left, available: left, right, center or justify)
* **lineSpacing** - this is a factor that could be used to increase or decrease the line spacing (default: 1)
* **font** - the font that should be used
* **size** - the font size

**Example:**

```js
doc.text('Lorem ipsum dolor sit amet ...', {
  size: 12,
  align: 'justify',
  lineSpacing: 1.2
})
```

### .text([definition])

This text method can be used to render more advanced/complex text fragments. It allows to combine multiple text styles. **Returns** a [Text](#text) function.

**Arguments:**

* **definition** - a function describing the text to be rendered; it gets the `text` object described in [Text](#text)

**Example:**

```js
doc.text(function(text) {
  // this === text
  this.opts.size = 12
  this.opts.lineSpacing = 1.35
  text('This is a header', { bold: true, size: 18 }).br()
  text('Content can be')('bold', { bold: true })
  text(',')('italic', { italic: true })
  text('or')('both', { italic: true, bold: true })('.')
  text('You`re also able to use')('light', { light: true })
  text(', which could be')('italic', { italic: true, light: true })(', too.').br()
  text('If you want, you can also')('mixup different fonts', { font: sourceCodeProp })
  text('or different')('font', { size: 10 })('sizes', { size: 16 })('.')
})
```

**Result:**

![Result](https://raw.github.com/rkusa/pdfjs/gh-pages/images/text-example.png)

### .table([opts, ] [definition])

This method can be used to define tables. **Returns** a [Table](#table) object.

**Arguments:**

* **opts** - table options
* **definition** - a function that contains the table definition

**Options:**

* **borderWidth** -
* **width** - total width (absolute or relative) or an array of column widths
* + [Text Options](#texttext-opts)

**Example:**

```js
doc.table({ header: true, size: 11 }, function() {
  this.tr({ bold: true, borderWidth: { bottom: 1.5 } }, function() {
    this.td('#')
    this.td('Unit')
    this.td('Subject')
    this.td('Price', { align: 'right' })
    this.td('Total', { align: 'right' })
  })
  this.tr({ borderWidth: { horizontal: 0.1 } }, function() {
    this.td('2')
    this.td('pc.')
    this.td(function() {
      this.text('Article A', { size: 11, bold: true })
      this.text('Lorem ipsum ...', { size: 9, align: 'justify' })
    })
    this.td('500.00€', { align: 'right' })
    this.td('1,000.00€', { align: 'right' })
  })
  this.tr({ borderWidth: { horizontal: 0.1 } }, function() {
    this.td('1')
    this.td('pc.')
    this.td(function() {
      this.text('Article B', { size: 11, bold: true })
      this.text('Cum id fugiunt ...', { size: 9, align: 'justify' })
    })
    this.td('250.00€', { align: 'right' })
    this.td('250.00€', { align: 'right' })
  })
  this.tr({ bold: true, align: 'right' }, function() {
    this.td('Total', { colspan: 4 })
    this.td('1,250.00€')
  })
})
```

**Result:**

![Result](https://raw.github.com/rkusa/pdfjs/gh-pages/images/table-example.png)

### .toDataURL()

Returns the document as [data URL](https://developer.mozilla.org/en-US/docs/data_URIs).

**Example:**

```html
<iframe id="preview" width="100%" height="650" frameborder="0">
</iframe>
```

```js
document.querySelector('#preview')
        .setAttribute('src', doc.toDataURL())
```

### .toString()

Returns the document as plain text.

**Example:**

```js
var fs = require('fs')
fs.writeFile(__dirname + '/test.pdf', doc.toString(), 'ascii')
```

## Text

This is a function itself and an alias for `.text()`. It is used to define more complex/advanced text fragments. **Returns** itself.

### .text()

Same as [doc.text(text[, opts])](#texttext-opts)

### .br()

Line Break. Returns the [Text](#text) function.

### .pageNumber()

Print the page number the text fragment is rendered on. Returns the [Text](#text) function.

**Example:**

```js
doc.text(function(text) {
  text('Page').pageNumber()
})
```

## Table

This table object is used to define its rows and its behaviour on page breaks.

### .tr([opts,] definition)

This method is used to define a table row. **Returns** a [Table Row](#table-row) object.

**Arguments:**

* **opts** - row options
* **definition** - a function that contains the row definition

**Options:**

* **borderWidth** -
* + [Text Options](#texttext-opts)

### .beforeBreak([opts,] definition)

Same as [.tr([opts,] definition)](#tropts-definition), but only rendered if the table is broken among two pages. This row is then rendered directly before the page break.

```js
table.beforeBreak(function() {
  this.td('Subtotal:', { colspan: 4, align: 'right' })
  this.td(function() {
    this.text(function(text) {
      this.opts.align = 'right'
      this.opts.size  = 11
      text(function() {
        if (!this.table) return ''
        return items.subtotalUntil(this.table.row)
      })
    })
  })
})
```

### .afterBreak([opts,] definition)

Same as [.tr([opts,] definition)](#tropts-definition), but only rendered if the table is broken among two pages. This row is then rendered directly after the header on the new page.

**Example:**

```js
table.afterBreak(function() {
  this.td('Carryover:', { colspan: 4, align: 'right' })
  this.td(function() {
    this.text(function(text) {
      this.opts.align = 'right'
      this.opts.size  = 11
      text(function() {
        if (!this.table) return ''
        return items.subtotalUntil(this.table.row)
      })
    })
  })
})
```

**Result:**

![Result](https://raw.github.com/rkusa/pdfjs/gh-pages/images/table-pagebreak-example.png)

## Table Row

This table row object is used to define its cells.

### .td(text[, opts])

This method is used to define a cell of the row.

**Arguments:**

* **text** - the text contained in the cell
* **opts** - cell options

**Options:**

* **borderWidth** -
* **colspan** -
* + [Text Options](#texttext-opts)

### .td([opts,] definition)

This method is used to define a cell of the row.

**Arguments:**

* **opts** - cell options
* **definition** - a function that contains the cell definition

**Options:**

* **borderWidth** -
* **colspan** -
* + [Text Options](#texttext-opts)

## Font

### new Font(path)
### new Font(opts)

**Options:**

* **normal** -
* **italic** -
* **bold** -
* **boldItalic** -
* **light** -
* **lightItalic** -

## MIT License
Copyright (c) 2013-2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm]: http://img.shields.io/npm/v/pdfjs.svg?style=flat
[deps]: http://img.shields.io/gemnasium/rkusa/pdfjs.svg?style=flat