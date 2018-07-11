export function parse(xref, lexer) {
  // TODO
  // return import('./').then(objs => {
  //   const Objects = [
  //     objs.PDFBoolean.default,
  //     objs.PDFNull.default,
  //     objs.PDFName.default,
  //     objs.PDFDictionary.default, // must be tried before string!
  //     objs.PDFString.default,
  //     objs.PDFArray.default,
  //     objs.PDFReference.default, // must be tried before number!
  //     objs.PDFNumber,
  //   ]
  // })

  const Objects = []

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
