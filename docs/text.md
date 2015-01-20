## Text

### .add(text, [opts])

Adds text to the text fragment.

**Arguments:**

- **str** - the string
- **opts** - styling options

**Options:**

Same as [doc.text([text], [opts])](document.md#texttext-opts)

### .line(text, [opts])

Same as [text.add(text, [opts])](#addtext-opts), but adds an additional line break add the end of the provided text.

### .append(text, [opts])

Same as [text.add(text, [opts])](#addtext-opts), but directly appends the text, i.e., adds the text without a space.

### .br()

Adds a line break.

### .pageNumber([opts])

Adds the current page number to the text fragment.

**Arguments:**

- **opts** - styling options

**Options:**

Same as [doc.text([text], [opts])](document.md#texttext-opts)

### .pageCount([opts])

Adds the documents total page count to the text fragment.

**Arguments:**

- **opts** - styling options

**Options:**

Same as [doc.text([text], [opts])](document.md#texttext-opts)
