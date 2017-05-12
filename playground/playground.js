const pdf = require('../')
require('whatwg-fetch')

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

function render(doc) {
  return doc.asBuffer()
    .then(buf => {
      const blob = new Blob([buf], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    })
}

function init(logo) {
  var container = document.getElementById('editor')
  var initialValue = container.textContent
  container.textContent = ''
  container.classList.remove('hidden')
  var editor = monaco.editor.create(container, {
    value: initialValue,
    language: 'javascript',
    theme: 'vs-dark'
  })

  var debounce
  var previewEl = document.getElementById('preview')
  var errorEl = document.getElementById('error')
  var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cum id fugiunt, re eadem quae Peripatetici, verba. Tenesne igitur, inquam, Hieronymus Rhodius quid dicat esse summum bonum, quo putet omnia referri oportere? Quia nec honesto quic quam honestius nec turpi turpius.'

  function rerender() {
    debounce = undefined
    var body = editor.getValue() + '\nreturn doc'

    try {
      var fn = new Function("pdf", "fonts", "logo", "lorem", body)
      var doc = fn(pdf, fonts, logo, lorem)

      render(doc)
        .then(function(url) {
          errorEl.classList.remove('open')
          previewEl.data = url
        })
        .catch(err => {
          console.error(err)
          errorEl.textContent = err.message
          errorEl.classList.add('open')
        })
    } catch(err) {
      console.error(err)
      errorEl.textContent = err.message
      errorEl.classList.add('open')
    }
  }

  editor.onDidChangeModelContent(function() {
    if (debounce) {
      clearTimeout(debounce)
    }
    debounce = setTimeout(rerender, 1000)
  })
  rerender()
}

window.main = function() {
  fetch('/logo.pdf')
    .then(res => res.arrayBuffer())
    .then(ab => init(new pdf.Image(ab)))
}