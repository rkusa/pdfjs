# pdfjs
A Portable Document Format (PDF) generation library targeting both the server- and client-side.

```json
{ "name": "pdfjs",
  "version": "0.2.1" }
```

### Status

Early development stage, i.e., not well tested.

**Implemented:** Text, Tables, Header, Footer, Automatic page breaks  
**Missing:** AFM Fonts, Graphics

### Contents
1. [API](#api)
2. [License](#license)

## API

### Document

```js
var Document = require('pdfjs')
```

#### new Document(font)

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

#### .text(text, opts)

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

#### .text(fn)

This text method can be used to render more advanced/complex text fragments. It allows to combine multiple text styles.

**Arguments:**

* **fn** - a function describing the text to be rendered; it gets the `text` function described below as an argument

**text(text, opts)**  

* **.br()** - line break
* **.pageNumber()** - current page number

**Example:**

```js
this.text(function(text) {
  text.opts.size = 12
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

![Result](https://dl.dropboxusercontent.com/u/6699613/Github/pdfjs-example1.png)

#### .table([opts, ] definition)

**Example:**

```js
doc.table({ header: true, size: 14 }, function() {
  this.tr({ bold: true, borderWidth: { bottom: 1.5 } }, function() {
    this.td('#')
    this.td('Unit')
    this.td('Subject')
    this.td('Price')
    this.td('Total')
  })
  this.tr({ borderWidth: { horizontal: 0.1 } }, function() {
    this.td('2')
    this.td('pc.')
    this.td(function() {
      this.text('Article A', { size: 14, bold: true })
      this.text('Lorem ipsum ...', { size: 12, align: 'justify' })
    })
    this.td('500.00€', { align: 'right' })
    this.td('1,000.00€', { align: 'right' })
  })
  this.tr({ borderWidth: { horizontal: 0.1 } }, function() {
    this.td('1')
    this.td('pc.')
    this.td(function() {
      this.text('Article B', { size: 14, bold: true })
      this.text('Lorem ipsum ...', { size: 12, align: 'justify' })
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

#### .toDataURL()

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

#### .toString()

Returns the document as plain text.

**Example:**

```js
var fs = require('fs')
fs.writeFile(__dirname + '/test.pdf', doc.toString(), 'ascii')
```

### Font

#### new Font(path)
#### new Font(opts)

**Options:**

* **normal** - 
* **italic** - 
* **bold** - 
* **boldItalic** - 
* **light** - 
* **lightItalic** - 

## MIT License
Copyright (c) 2013 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.