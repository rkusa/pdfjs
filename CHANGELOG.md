# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Fixed error when rendering page headers close to the bottom of the page #213
- Fixed reading PDF `Filter` property when being of type array #268

## [2.5.6] - 2021-08-23
### Fixed
- Fixed images not adding page break

## [2.4.5] - 2021-07-29
### Fixed
- Fixed PDF name parsing to accept empty names (`/`) #260

## [2.4.4] - 2021-06-22
### Fixed
- Allow any whitespace in object streams (while parsing PDFs) #253
- Fix main field for jsDelivr #256

## [2.4.3] - 2021-04-22
### Fixed
- Fixed escape logic of PDF names [#252](https://github.com/rkusa/pdfjs/pull/252)

## [2.4.2] - 2020-10-23
### Fixed
- Updated PDF parser to ignore comments

## [2.4.1] - 2020-08-08
### Fixed
- Reverted the broken change made in `2.4.0` - sorry for that!

## [2.4.0] - 2020-08-08
Unpublished.

### Changed
- Corrected how text is encoded to the PDF

## [2.3.9] - 2020-06-09
### Fixed
- Fixed `Lexer is not defined` error when parsing a hex string #215
- Added an error when multiple headers are added to a table #213

## [2.3.8] - 2020-05-22
### Fixed
- Updated PDF parser to be more forgiving to out of place whitespace in PDF files

## [2.3.7] - 2020-05-15
### Fixed
- Update PDF parser to accept whitespace before `endstream` keywords
- Update PDF parser to ignore trailer prev pointers that point to the document beginning (offset = `0`)

## [2.3.6] - 2020-04-28
### Fixed
- allow any whitespace between obj version and rev numbers when parsing PDF (fixes parsing of some PDF)
- trim whitespace before starting to parse a PDF object (fixes parsing of MS print to PDF documents)
- fix color space of embedded grayscale JPEGs #210

## [2.3.5] - 2020-03-03
### Fixed
- fix possible `lexer.isWhiteSpace is not a function` errors when parsing PDFs
- fix table header position when rendered right after page header #202

## [2.3.4] - 2020-01-30
### Fixed
- include `ExtGState` and `Shading` resources from external PDFs when adding them as templates
- fix various table page break issues #191

## [2.3.3] - 2020-01-07
### Fixed
- fix `text.br()`s not being added if a page break happens right at their position #159
- fix font opts inheritance when creating a text object from a text object (`.text('...').text('...')`) #175
- fix various EOL and `undefined` props errors when parsing existing PDFs
- extend `Font.isFont` check to accept fonts that are not an instance of `Font`, but still provide the expected font methods #182

## [2.3.2] - 2019-10-09
### Fixed
- Fix using pages documents with nested /Pages objects as templates #150

## [2.3.1] - 2019-09-11
### Fixed
- add missing font type definitions #153

## [2.3.0] - 2019-05-07
### Changed
- setTemplate now accepts an second optional parameter indicating whether the templates is to used for the first page only #126

## [2.2.0] - 2019-04-02
### Fixed
- Pages from external documents should always be added with their original size #111
- Fix parsing documents with nested /Pages objects #117
- Fix parsing multi-line PDF strings #117

### Changed
- `opentype.js` has been updated to `0.11.0`, which has a minor effect on kerning distances

### Added
- `end` option for `doc.asBuffer` #118

## [2.1.0] - 2018-09-22
### Changed
- When providing less cells than a row has columns, instead of throwing, autofill the row with empty cells #101

### Fixed
- Vertical table border in combinaton with colspan #100
- Fix cyclic loop when parsing PDFs with TOCs #112
- Fix to, when adding other PDFs (either as image or whole pages), add objects only once #109
- Fix parsing of escaped characters in strings #114

## [2.0.0] - 2018-06-19

Version `2.0.0` is a re-write. The implementation is expected to settle with the current approach of streaming layouting with smart content chunking, which allows for having a small memory footprint even when creating a PDF document with thousands of pages.

`2.0.0` requires Node >= 7. If you get an error on `require('pdfjs')` you are probably using an older Node.js version, which can be fixed by updating Node.js or by running pdfjs through a transpiler like babel.

### Changed
- The outline method now accepts an outline ID (number) as a valid input for the parent parameter

### Fixed
- Fixed OTF font browser usage (`new Font(src)` now properly accepts both Node.js Buffer and ArrayBuffer as input)

## [2.0.0-alpha.8] - 2018-05-13
### Added
- Document outline support

### Removed
- creating AFM fonts from JSON (`new Font(require('pdfjs/font/Helvetica.json'))` - instead, load the font directly: `require('pdfjs/font/Helvetica')`)

## [2.0.0-alpha.7] - 2018-05-03
### Deprecated
- creating AFM fonts is deprecated `new Font(require('pdfjs/font/Helvetica.json'))`, instead load instances directly `require('pdfjs/font/Helvetica')`

### Added
- Added type definitions for TypeScript #91
- Added support for parsing Object Streams

### Changed
- Expose Document class instead an anonymous class #92
- Improved ergonomics of loading AFM fonts (`require('pdfjs/font/Helvetica')` instead of `new Font(require('pdfjs/font/Helvetica.json'))`)
- The `font` option when creating a `new Document` is now optional and defaults to Helvetica

### Fixed
- Tests should now run on windows #78

## [2.0.0-alpha.6] - 2018-03-27
### Fixed
- fix kerning for OTF fonts #84

## [2.0.0-alpha.5] - 2018-03-26
### Added
- implement font kerning (with a [minor limitation](https://github.com/rkusa/pdfjs/issues/82#issuecomment-376072547))

### Fixed
- fixed PDF text not being printed when using macOS print dialog #83 (as a consequence, set PDF version of documents to 1.6)

## [2.0.0-alpha.4] - 2018-03-21
### Fixed
- fix combination of multiple TTF/OTF fonts in one line #81

## [2.0.0-alpha.3] - 2017-05-12
### Added
- Text decoration underline and strikethrough

### Fixed
- fix font re-use to not include glyphs from other documents
