## Table

### .tr([opts])

This method can be used place tables. Returns a [Row](table.md#row) object.

**Arguments:**

- **opts** - styling options

**Options:**

- **height**
- + [Table options](document.md#tableopts)

### .beforeBreak([opts])

Same as [table.tr([opts])](#beforebreakopts), but the created row is only rendered before table page breaks.

### .beforeBreak(fn)

Create a dynamic before pagebreak row.

**Arguments:**

- **fn** - function called, when creating the before pagebreak row

**Example:**

```js
table.beforeBreak(function(row, i) {
    row.td('BEFORE idx: ' + i)
})
```


## Row

Table row.

### .td([text], [opts])

This method can be used place tables. Returns a [Row](table.md#row) object.

**Arguments:**

- **text** - the cell's text content
- **opts** - styling options

**Options:**

- **colspan** (default: 1) - through how many columns the cell should span
- **height**
- + [Table options](document.md#tableopts)

## Cell

Table cell.

**Example:**

```js
var td = tr.td()
td.text('Foo')
td.text('Bar')
td.image(img)
```

### .text([text], [opts])

Same as [doc.text([text], [opts])](document.md#texttext-opts)

### .table([opts])

Same as [doc.table([opts])](document.md#tableopts)

### .image(img, [opts])

Same as [doc.image(img, [opts])](document.md#imageimg-opts)
