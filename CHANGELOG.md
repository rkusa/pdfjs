# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2018-06-19
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
