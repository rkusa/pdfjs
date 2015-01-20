var glob = require('glob')
var path = require('path')
var fs   = require('fs')
var test = require('tap').test
var fixtures = require('./fixtures')
var pdfjs    = require('../')

glob(__dirname + '/pdfs/**/*.js', function (err, files) {
  if (err) throw err

  files.forEach(function(scriptPath) {
    var dirname  = path.dirname(scriptPath)
    var basename = path.basename(scriptPath, '.js')

    var expectationPath = path.join(dirname, basename + '.pdf')
    var resultPath      = path.join(dirname, basename + '.result.pdf')

    var script = require(scriptPath)

    var doc = pdfjs.createDocument({
      font:    fixtures.font.opensans.regular,
      padding: 10,
    })

    script(doc, fixtures)

    var pdf = doc.render()
    pdf.info.id = '42'
    pdf.info.creationDate = new Date(2015, 01, 19, 22, 33, 26)
    pdf.info.producer = 'pdfjs tests (github.com/rkusa/pdfjs)'

    var result = pdf.toString()
    fs.writeFileSync(resultPath, result, 'ascii')

    var expectation  = fs.readFileSync(expectationPath, 'binary')
    var relativePath = path.relative(path.join(__dirname, 'pdfs'), dirname)
    test(path.join(relativePath, basename), function (t) {
      t.equal(result, expectation)
      t.end()
    })
  })
})