![pdfjs](https://raw.githubusercontent.com/rkusa/pdfjs/master/logo/pdfjs.png)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][drone]](https://ci.rkusa.st/rkusa/pdfjs)

[Documentation](docs)

## 1.0.0 Breaking Changes

pdfjs 1.0.0-alpha.1 (still in development; expected to be buggy) contains a rewritten layout engine (layout engine of pdfjs `<=0.5` reached its limits), i.e., both API and layout behavior has changed completely. Install with:

```bash
npm install pdfjs@1.0.0-alpha.1
```

### Features

- Text (many formatting options)
- Images (JPEGs, other **PDFs**)
- Tables (fixed layout, header row, before page break rows)
- Header & Footer
- TTF Font embedding (as CID fonts, i.e., support for fonts with large character sets)

**Missing:** AFM fonts are currently not implemented.

If you are missing a feature, feel free to submit a PR or to ask for it.

## MIT License

[MIT](LICENSE)

[npm]: http://img.shields.io/npm/v/pdfjs.svg?style=flat-square
[deps]: http://img.shields.io/david/rkusa/pdfjs.svg?style=flat-square
[drone]: http://ci.rkusa.st/api/badges/rkusa/pdfjs/status.svg?style=flat-square
