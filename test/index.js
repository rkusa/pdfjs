const glob = require('glob')
const path = require('path')
const fs   = require('fs')
const test = require('tape')
const fixtures = require('./fixtures')
const pdf    = require('../lib')

process.env.TZ = 'Europe/Berlin'

const args = process.argv.slice(2)
if (args.length) {
  if (args[0] == 'asBuffer') {
    require('./asBuffer')
  } else {
    run(args.map((a) => path.join(__dirname, '../', a)), true)
  }
} else {
  glob(path.join(__dirname, 'pdfs/**/*.js'), function (err, files) {
    if (err) throw err
    run(files)
  })
}

// mock current time
const _Date = Date
Date = class extends _Date {
  constructor(year, month, day, hour, minute, second) {
    if (arguments.length === 0) {
      return new _Date(2015, 1, 19, 22, 33, 26)
    } else {
      return new _Date(year, month, day, hour, minute, second)
    }
  }
}

function run(files, force) {
  const f = fixtures.create()

  files.forEach(function(scriptPath) {
    const dirname  = path.dirname(scriptPath)
    const basename = path.basename(scriptPath, '.js')

    // ignore tests starting with _ and named `test`
    if (!force && (basename[0] === '_' || basename === 'test')) {
      return
    }

    const expectationPath = path.join(dirname, basename + '.pdf')
    const resultPath      = path.join(dirname, basename + '.result.pdf')

    const script = require(scriptPath)

    let doc = new pdf.Document({
      font:       f.font.afm.regular,
      padding:    script.padding >= 0 ? script.padding : 10,
      lineHeight: 1,
    })

    const newDoc = script(doc, f)
    if (newDoc) {
      doc = newDoc
    }

    const relativePath = path.relative(path.join(__dirname, 'pdfs'), dirname)
    test(path.join(relativePath, basename), function (t) {
      doc.info.id = '42'
      doc.info.creationDate = new Date(2015, 1, 19, 22, 33, 26)
      doc.info.producer = 'pdfjs tests (github.com/rkusa/pdfjs)'

      const w = fs.createWriteStream(resultPath)
      doc.pipe(w)

      doc.end().catch(err => {
        t.error(err)
      })

      w.on('close', () => {
        try {
          var result = fs.readFileSync(resultPath, 'binary')
          var expectation = fs.readFileSync(expectationPath, 'binary')
        } catch (err) {
          t.error(err)
        }

        t.ok(result.replace(/\r/g,"") === expectation.replace(/\r/g,""), basename)
        t.end()
      })
    })
  })
}
