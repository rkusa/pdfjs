## PDF

### .toString()

Returns the document as plain text.

**Example:**

```js
fs.writeFile('test.pdf', pdf.toString(), 'binary')
```

**Important** When persisting a PDF to a file, use the encoding `binary`.

### .toDataURL()

Returns the document as [data URL](https://developer.mozilla.org/en-US/docs/data_URIs).

**Example:**

```html
<iframe id="preview" width="100%" height="650" frameborder="0">
</iframe>
```

```js
document.querySelector('#preview')
        .setAttribute('src', pdf.toDataURL())
```
