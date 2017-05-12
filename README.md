![pdfjs](https://cdn.rawgit.com/rkusa/pdfjs/2.x/logo.svg)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][travis]](https://travis-ci.org/rkusa/pdfjs)

[Documentation](docs) | [Playground](http://pdfjs.rkusa.st/)

```bash
npm install pdfjs@2.0.0-alpha.3
```

## 2.0.0 Breaking Changes

Version `2.0.0` is a re-write. The implementation is expected to settle with the current approach of streaming layouting with smart content chunking, which allows for having a small memory footprint even when creating a PDF document with thousands of pages.

`2.0.0` requires Node >= 7. If you get an error on `require('pdfjs')` you are probably using an older Node.js version, which can be fixed by updating Node.js or by running pdfjs through a transpiler like babel.

----------------

### Features

- Text (with common formatting options)
- Images (JPEGs, other **PDFs**)
- Tables (fixed layout, header row)
- Header & Footer
- AFM fonts && OTF font embedding (as CID fonts, i.e., support for fonts with large character sets)
- Add existing PDFs (merge them or add them as page templates)

A lot of examples can be found in the [test folder](https://github.com/rkusa/pdfjs/tree/master/test/pdfs).

If you are missing a feature, feel free to submit a PR or to ask for it.

### History

- *v2.x* - streaming layouting with smart content chunking
- *v1.x* - calculate whole document layout upfront
- *v0.x* - in-memory layouting with rollbacks

## MIT License

[MIT](LICENSE)

[npm]: https://img.shields.io/npm/v/pdfjs.svg?style=flat-square
[deps]: https://img.shields.io/david/rkusa/pdfjs.svg?style=flat-square
[travis]: https://img.shields.io/travis/rkusa/pdfjs/master.svg?style=flat-square
