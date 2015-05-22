## Document

### .text([text], [opts])

Add some text to the document. Returns a [Text object](text.md) that can be used to extend the created text fragment.

**Arguments:**

- **text** - the text that should be rendered
- **opts** - text styling options (document styling is inherited)

**Options:**

- **font** - the font that should be used
- **color** (default: 0x000000) - the font color
- **fontSize** (default: 11) - the font size
- **textAlign** (default: 'left') - the text alignment (available options: left, right, center, justify)
- **lineHeight** (default: 1) - the line height
- **whiteSpace** (default: normal) - remove trailing whitespaces when set to normal

**Example:**

```js
doc.text('Lorem ipsum dolor sit amet ...', {
  size:       12,
  textAlign:  'justify',
  lineHeight: 1.2
})
```

**What about italic, bold and other font weights?**

Load and use the the corresponding font, e.g.:

```js
var regular = pdfjs.createTTFFont(read('YourFontRegular.ttf'))
var bold    = pdfjs.createTTFFont(read('YourFontBold.ttf'))

var doc = pdfjs.createDocument({
  font:    regular,
  padding: 10
})

doc.text('Some text ...', { font: bold })
```

### .image(img, [opts])

Place an [Image object](README.md#pdfjscreateImagebuffer) into the document.

**Arguments:**

- **img** - the [Image object](README.md#pdfjscreateImagebuffer)
- **opts** - styling options

**Options:**

- **width**, **height** - The size the image should be rendered in. If neither `width` nor `height` are provided, the image is fitted into the current context (e.g. page size). When there is only `width` or only `height` provided, the images is scaled proportionally; if both are provided, the image is stretched.
- **wrap** (default: true) - whether the image should wrap surrounding text, i.e. should be rendered into the current content flow
- **align** (default: left) - when `wrap` is set to `true`, `align` can be used to set the horizontal positon (left, right, or center)
- **x**, **y** - when `wrap` is set to `false`, `x` and `y` can be used to explicitly position the image

**Example:**

```js
var img = pdfjs.createImage(fs.readFileSync('picture.jpg'))
doc.image(img, { align: 'center' })
```

### .table([opts])

This method can be used place tables. Returns a [Table](table.md#table) object.

**Arguments:**

- **opts** - styling options

**Options:**

- **width** (default: 612) - the table width
- **height** (default: 792) - the table height
- **padding**, **paddingTop**, **paddingRight**, **paddingBottom**, **paddingLeft** (default: 0) - the table padding (inherited to the table's cells)
- **tableLayout** (default: 'fixed') - currently only fixed supported
- **widths** - an array containing the width for each column (can be either absolut or relative)
- **headerRows** (default: 0) - treats the first *x* rows as header rows, i.e., repeats them on page breaks
- **backgroundColor** - the background color (inherited to the table's cells)
- **borderWidth**, **borderVerticalWidth**, **borderHorizontalWidth**, **borderTopWidth**, **borderRightWidth**, **borderBottomWidth**, **borderLeftWidth** (default: 0) - the border's width (inherited to the table's cells)
- **borderColor**, **borderVerticalColor**, **borderHorizontalColor**, **borderTopColor**, **borderRightColor**, **borderBottomColor**, **borderLeftColor** (default: 0x000000) - the border's color (inherited to the table's cells)
- + [Text Options](document.md#texttext-opts)

**Example:**

```js
var table = doc.createTable({
  padding: 5,
  borderWidth: 20,
  borderColor: 0xdddddd,
  backgroundColor: 0xeeeeee,
  widths: ['50%', '30%']
})

var tr = table.tr({})
tr.td('Foo')
tr.td('Bar')
```

### .header([opts])

This method can be used to define a header that will be rendered on every page of the document.

**Arguments:**

- **opts** - styling options

**Options:**

- **padding**, **paddingTop**, **paddingRight**, **paddingBottom**, **paddingLeft** (default: 0) - the header padding
- + [Text Options](document.md#texttext-opts)

**Example:**

```js
var header = doc.header()
header.text('Foobar', { textAlign: 'right' })
```

### .footer([opts])

This method can be used to define a footer that will be rendered on every page of the document.

**Arguments:**

- **opts** - styling options

**Options:**

- **padding**, **paddingTop**, **paddingRight**, **paddingBottom**, **paddingLeft** (default: 0) - the footer padding
- + [Text Options](document.md#texttext-opts)

**Example:**

```js
var footer = doc.footer()
footer.text('Foobar', { textAlign: 'right' })
```

### .ops(args...)
### .ops(fn)

Allows adding PDF operations directly.

**Example:**

```js
var ops = doc.ops()
ops.op(0, 0, 0, 'rg')
ops.op(0, 830, 297.6648, 11.896, 're')
ops.op('f')
```

Or, providing a function that gets the current x/y (y goes bottom-up) coords when being rendered.

```js
ops = doc.ops()
ops.op(function(x, y) {
  var height = 40
  return [x, y - height, x + 60, height, 're']
})
ops.op('f')
```

### .render()

Creates an PDF object using the document's structure. Returns a [PDF object](pdf.md).

[How to persist a PDF object](pdf.md)
