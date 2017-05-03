const pdf = require('../')
const blobStream = require('blob-stream')

const fonts = {
  CourierBold: new pdf.Font(require('../font/Courier-Bold.json')),
  CourierBoldOblique: new pdf.Font(require('../font/Courier-BoldOblique.json')),
  CourierOblique: new pdf.Font(require('../font/Courier-Oblique.json')),
  Courier: new pdf.Font(require('../font/Courier.json')),
  HelveticaBold: new pdf.Font(require('../font/Helvetica-Bold.json')),
  HelveticaBoldOblique: new pdf.Font(require('../font/Helvetica-BoldOblique.json')),
  HelveticaOblique: new pdf.Font(require('../font/Helvetica-Oblique.json')),
  Helvetica: new pdf.Font(require('../font/Helvetica.json')),
  Symbol: new pdf.Font(require('../font/Symbol.json')),
  TimesBold: new pdf.Font(require('../font/Times-Bold.json')),
  TimesBoldItalic: new pdf.Font(require('../font/Times-BoldItalic.json')),
  TimesItalic: new pdf.Font(require('../font/Times-Italic.json')),
  TimesRoman: new pdf.Font(require('../font/Times-Roman.json')),
  ZapfDingbats: new pdf.Font(require('../font/ZapfDingbats.json')),
}

window.fonts = fonts
window.pdf = pdf
window.render = function render(doc) {
  return new Promise(function(resolve, reject) {
    doc
      .pipe(blobStream())
      .on('finish', function() {
          resolve(this.toBlobURL('application/pdf'))
      })
    doc.end().catch(reject)
  })
}
