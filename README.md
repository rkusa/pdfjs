![pdfjs](https://cdn.rawgit.com/rkusa/pdfjs/2.x/logo.svg)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][travis]](https://travis-ci.org/rkusa/pdfjs)

[Documentation](docs)

```bash
npm install rkusa/pdfjs@2.0.0-alpha.1
```

## 2.0.0 Breaking Changes

Version `2.0.0` is a re-write. I tried completely different approaches of the last years. Finally, this version has streaming layouting with smart content chunking, which allows for having a small memory footprint even when creating a PDF document with thousands of pages. I highly expect to settle with this implementation.

----------------

### Features

- Text (with common formatting options)
- Images (JPEGs, other **PDFs**)
- Tables (fixed layout, header row)
- Header & Footer
- AFM fonts && OTF font embedding (as CID fonts, i.e., support for fonts with large character sets)
- Add existing PDFs (merge them or add them as page templates)

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
