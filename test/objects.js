var should = require('should')

var PDFString = require('../lib/objects/string')
describe('PDF Strings', function() {
  describe('as literal', function() {
    it('should be enclosed in parentheses', function() {
      var str = new PDFString('pdfjs')
      str.toLiteralString().should.eql('(pdfjs)')
    })
    it('should get its backslashs escaped', function() {
      var str = new PDFString('pdfjs\\')
      str.toLiteralString().should.eql('(pdfjs\\\\)')
    })
    it('should get its containing parentheses escaped', function() {
      var str = new PDFString('pdfjs (https://github.com/rkusa/pdfjs)')
      str.toLiteralString().should.eql('(pdfjs \\(https://github.com/rkusa/pdfjs\\))')
    })
    it('should get its non printable ASCII characters escaped') // page 55
  })
  describe('as hexadecimal', function() {
    it('should be enclosed in angle brackets', function() {
      var str = new PDFString('pdfjs')
      str.toHexString().should.match(/^<.*>$/)
    })
    it('should be written in hexadecimal form', function() {
      var str = new PDFString('pdfjs')
      str.toHexString().should.eql('<7064666a73>')
    })
  })
})

var PDFName = require('../lib/objects/name')
describe('PDF Names', function() {
  it('should be introduced by a slash character', function() {
    var name = new PDFName('pdfjs')
    name.toString().should.match(/^\/.*$/)
  })
  it('should not allow white-space characters', function() {
    '\x00\x09\x0A\x0C\x0D\x20'.split('').forEach(function(character) {
      (function(){
        var name = new PDFName(character)
      }).should.throw()
    })
  })
  it('should not allow delimiter characters', function() {
    '()<>[]{}/%'.split('').forEach(function(character) {
      (function(){
        var name = new PDFName(character)
      }).should.throw()
    })
  })
  it('should just return if already being a PDFName', function() {
    var name = new PDFName('pdfjs')
    should.strictEqual(name, new PDFName(name))
  })
})

var PDFArray = require('../lib/objects/array')
describe('PDF Arrays', function() {
  var arr = new PDFArray([42, true, new PDFName('pdfjs'), new PDFString('pdfjs')])
  it('should be enclosed in square brackets', function() {
    arr.toString().should.match(/^\[.*\]$/)
  })
  it('should be rendered properly', function() {
    arr.toString().should.equal('[42 true /pdfjs <7064666a73>]')
  })
})

var PDFDictionary = require('../lib/objects/dictionary')
describe('PDF Dictionary', function() {
  var dic = new PDFDictionary({ Type: 'Example', Version: 0.01 })
  dic.add(new PDFName('StringItem'), new PDFString('pdfjs'))
  it('should be enclosed in double angle brackets', function() {
    dic.toString().should.match(/^\<<[\s\S]*\>>$/)
  })
  it('should be rendered properly', function() {
    var lines = dic.toString().split('\n')
    lines[1].should.equal('\t/Type /Example')
    lines[2].should.equal('\t/Version 0.01')
	  lines[3].should.equal('\t/StringItem <7064666a73>')
  })
  it('should be nestable', function() {
    dic.add('Subdictionary', new PDFDictionary({ Item1: 0.4, Item2: true }))
    var lines = dic.toString().split('\n')
    lines[4].should.equal('\t/Subdictionary <<')
    lines[5].should.equal('\t\t/Item1 0.4')
	  lines[6].should.equal('\t\t/Item2 true')
    lines[7].should.equal('\t>>')
  })
})

describe('PDF Streams', function() {
})

describe('PDF Indirect Object', function() {
})