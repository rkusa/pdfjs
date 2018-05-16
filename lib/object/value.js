import * as PDFBoolean from './boolean'
import * as PDFNull from './null'
import PDFName from './name'
import PDFDictionary from './dictionary'
import PDFString from './string'
import PDFArray from './array'
import PDFReference from './reference'
import * as PDFNumber from './number'

const Objects = [
  PDFBoolean,
  PDFNull,
  PDFName,
  PDFDictionary, // must be tried before string!
  PDFString,
  PDFArray,
  PDFReference, // must be tried before number!
  PDFNumber,
]

export function parse(xref, lexer) {
  // try
  for (let i = 0; i < Objects.length; ++i) {
    const value = Objects[i].parse(xref, lexer, true)
    if (value !== undefined) {
      return value
    }
  }

  lexer._error('Invalid value')
  return undefined
}
