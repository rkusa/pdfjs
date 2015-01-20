#### Contents

1. [Document](#document)
2. [Text](#text)
3. [Image](#image)
4. [Table](#table)
5. [Font](#font)
6. [License](#license)

### pdfjs.createDocument([opts])

Creates a new PDF document.

**Arguments:**

- **opts** - document styling options

**Options:**

- **width** (default: 612) - the page width
- **height** (default: 792) - the page height
- **padding**, **paddingTop**, **paddingRight**, **paddingBottom**, **paddingLeft** (default: 0) - the page padding
- + [Text Options](document.md#texttext-opts)

**Example:**

```js
var doc = pdfjs.createDocument({
  font:    pdfjs.createTTFFont(buffer),
  padding: 10
})
```

### pdfjs.createTTFFont(buffer)

Creates a new TTF Font object that can be used with PDF documents. The created TTF Font object can be used multiple times.

**Arguments:**

- **buffer** - the font data, as either Buffer or ArrayBuffer

### pdfjs.createImage(buffer)

Creates a new Image object that [can be used with PDF documents](document.md#imageimg-opts). The created image object can be used multiple times. Supported images are: JPEG, PDF

**Arguments:**

- **buffer** - the font data, as either Buffer or ArrayBuffer


