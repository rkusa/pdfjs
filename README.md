![pdfjs](https://raw.githubusercontent.com/rkusa/pdfjs/master/logo/pdfjs.png)

A Portable Document Format (PDF) generation library targeting both the server- and client-side.

[![NPM][npm]](https://npmjs.org/package/pdfjs)
[![Dependency Status][deps]](https://david-dm.org/rkusa/pdfjs)
[![Build Status][drone]](https://ci.rkusa.st/github.com/rkusa/pdfjs)

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

Copyright (c) 2013-2015 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm]: http://img.shields.io/npm/v/pdfjs.svg?style=flat-square
[deps]: http://img.shields.io/david/rkusa/pdfjs.svg?style=flat-square
[drone]: http://ci.rkusa.st/api/badge/github.com/rkusa/pdfjs/status.svg?branch=master&style=flat-square