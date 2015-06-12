## Documentation

### new pdfjs.Document([opts]) | pdfjs.createDocument([opts])

Creates a new [PDF document](document.md).

**Arguments:**

- **opts** - document styling options

**Options:**

- **width** (default: [595.296](#units)) - the page width
- **height** (default: [841.896](#units)) - the page height
- **padding**, **paddingTop**, **paddingRight**, **paddingBottom**, **paddingLeft** (default: 0) - the page padding
- **precision** (default: 3) - precision used when creating the PDF and writing floating point numbers
- **threshold** (default: 64) - threshold for the computation iterations done, before throwing; used to don't get caught in endless computations (should be increased for huge documents)
- + [Text Options](document.md#texttext-opts)

**Example:**

```js
var doc = new pdfjs.Document({
  font:    new pdfjs.TTFFont(buffer),
  padding: 10
})
```

For an explanation of the units and different paper sizes have a look at the [units](#units) section.

### new pdfjs.TTFFont(buffer) | pdfjs.createTTFFont(buffer)

Creates a new TTF Font object that can be used with PDF documents. The created TTF Font object can be used multiple times.

**Arguments:**

- **buffer** - the font data, as either Buffer or ArrayBuffer

### new pdfjs.Image(buffer) | pdfjs.createImage(buffer)

Creates a new Image object that [can be used with PDF documents](document.md#imageimg-opts). The created image object can be used multiple times. Supported images are: JPEG, PDF

**Arguments:**

- **buffer** - the font data, as either Buffer or ArrayBuffer

### pdfjs.load(path, callback)

Helper method to load a specific file (image or font). Works on both server and client.

**Example:**

```js
pdfjs.load('/assets/fonts/opensans.ttf', function(err, buf) {
    if (err) throw err

    var font = new pdfjs.TTFFont(buf)
    // ...
})
```

### Units

PDFs are measured in points (`1/72"`), i.e., **each point is `1/72` of an inch**. That is, the paper size of an US letter is in points `8.5 * 72 = 612` wide and `11 * 72 = 792` high.

**Paper Sizes:**

- **A4** (default) - 210mm × 297mm (8.27in × 11.7in) = 595.296 x 841.896
- **American Letter** - 215.9mm × 279.4mm (8.5in × 11in) = 612 x 792
