![pdfjs](https://cdn.rawgit.com/rkusa/pdfjs/2.x/logo.svg)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][drone]](https://ci.rkusa.st/rkusa/pdfjs)

[Documentation](docs)

```bash
npm install rkusa/pdfjs@2.x
```

## 2.0.0 Breaking Changes

Version `2.0.0` is again a re-write. I learned a lot through previous implementaitons. This version will have streaming layouting with smart content chunking, which allows for having a small memory footprint even when creating a PDF document with thousands of pages. This time, I will most certainly settle with this implementation.

- Uses `async/await`, i.e., run node with `--harmony-async-await` flag or use a transpiler like babel

----------------

### Features

_(this section is outdated and will be updated soon)_

- Text (many formatting options)
- Images (JPEGs, other **PDFs**)
- Tables (fixed layout, header row, before page break rows)
- Header & Footer
- TTF Font embedding (as CID fonts, i.e., support for fonts with large character sets)

**Missing:** AFM fonts are currently not implemented.

If you are missing a feature, feel free to submit a PR or to ask for it.

### History

- *v2.x* - streaming layouting with smart content chunking
- *v1.x* - calculate whole document layout upfront
- *v0.x* - in-memory layouting with rollbacks

## MIT License

[MIT](LICENSE)

[npm]: http://img.shields.io/npm/v/pdfjs.svg?style=flat-square
[deps]: http://img.shields.io/david/rkusa/pdfjs.svg?style=flat-square
[drone]: http://ci.rkusa.st/api/badges/rkusa/pdfjs/status.svg?style=flat-square
