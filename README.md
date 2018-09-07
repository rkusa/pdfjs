![pdfjs](https://cdn.rawgit.com/rkusa/pdfjs/2.x/logo.svg)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][travis]](https://travis-ci.org/rkusa/pdfjs)

[Documentation](docs) | [Playground](http://pdfjs.rkusa.st/)

```bash
npm install pdfjs
```

----------------

### Features

- Text (with common formatting options)
- Images (JPEGs, other **PDFs** ¹)
- Tables (fixed layout, header row)
- Header & Footer
- AFM fonts && OTF font embedding (as CID fonts, i.e., support for fonts with large character sets)
- Add existing PDFs (merge them or add them as page templates) ¹
- Document outline

A lot of examples can be found in the [test folder](https://github.com/rkusa/pdfjs/tree/master/test/pdfs).

If you are missing a feature, feel free to submit a PR or to ask for it.

> ¹ Adding other PDFs as images or merging them together is still being considered a beta - proper error handling is adviced

### History

See [CHANGELOG](https://github.com/rkusa/pdfjs/blob/master/CHANGELOG.md).

## MIT License

[MIT](LICENSE)

[npm]: https://img.shields.io/npm/v/pdfjs.svg?style=flat-square
[deps]: https://img.shields.io/david/rkusa/pdfjs.svg?style=flat-square
[travis]: https://img.shields.io/travis/rkusa/pdfjs/master.svg?style=flat-square
