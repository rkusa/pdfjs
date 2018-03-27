# Changelog

## 2.0.0-alpha.6

- fix kerning for OTF fonts #84

## 2.0.0-alpha.5

- implement font kerning (with a [minor limitation](https://github.com/rkusa/pdfjs/issues/82#issuecomment-376072547))
- fixed PDF text not being printed when using macOS print dialog #83 (as a consequence, set PDF version of documents to 1.6)

## 2.0.0-alpha.4

- fix combination of multiple TTF/OTF fonts in one line #81

## 2.0.0-alpha.3

- implement text decoration underline and strikethrough
- fix font re-use to not include glyphs from other documents
