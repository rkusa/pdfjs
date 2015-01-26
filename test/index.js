var glob = require('glob')
var path = require('path')
var fs   = require('fs')
var test = require('tap').test
var fixtures = require('./fixtures')
var pdfjs    = require('../')

process.env.TZ = 'Europe/Berlin'

var args = process.argv.slice(2)
if (args.length) {
  run(args)
} else {
  glob(path.join(__dirname, 'pdfs/**/*.js'), function (err, files) {
    if (err) throw err
    run(files)
  })
}

function run(files) {
  files.forEach(function(scriptPath) {
    var dirname  = path.dirname(scriptPath)
    var basename = path.basename(scriptPath, '.js')

    // ignore tests starting with _
    if (basename[0] === '_') {
      return
    }

    var expectationPath = path.join(dirname, basename + '.pdf')
    var resultPath      = path.join(dirname, basename + '.result.pdf')

    var script = require(scriptPath)

    var f = fixtures.create()

    var doc = pdfjs.createDocument({
      font:      f.font.opensans.regular,
      padding:   10,
      threshold: 20
    })

    script(doc, f)

    var pdf = doc.render()
    pdf.info.id = '42'
    pdf.info.creationDate = new Date(2015, 1, 19, 22, 33, 26)
    pdf.info.producer = 'pdfjs tests (github.com/rkusa/pdfjs)'

    var result = pdf.toString()
    fs.writeFileSync(resultPath, result, 'binary')

    var expectation  = fs.readFileSync(expectationPath, 'binary')
    var relativePath = path.relative(path.join(__dirname, 'pdfs'), dirname)
    test(path.join(relativePath, basename), function (t) {
      t.equal(result, expectation)
      t.end()
    })
  })
}
