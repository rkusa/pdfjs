var PDFObject = require('./objects/object')
  , Pages     = require('./pages')
  , TTFFont   = require('./fonts/ttf')
  , PDFName   = require('./objects/name')

var Document = module.exports = function(fontPath) {
  this.version = 1.7
  
  // document metrics
  this.width   = 612
  this.height  = 792
  this.padding = { top: 20, right: 40, bottom: 20, left: 40 }
  
  // list of all objects in this document
  this.objects   = []
  this.nextObjId = 1
  
  // list of all fonts in this document
  this.fonts      = {}
  this.nextFontId = 1
  
  // the catalog and pages tree
  this.catalog = this.createObject('Catalog')
  this.pages   = new Pages(this)
  this.catalog.addProperty('Pages', this.pages.toReference())
  
  this.defaultFont = this.font(fontPath)
  
  this.contents = []
}

// <------- width ---------->
// __________________________     
// | ______________________ |     ^
// | |                 ^  | |     |
// | |<-- innerWidth --|->| |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     | height
// | |                 |  | |     |
// | |        innerHeight | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |_________________v__| |     |
// |________________________|     v

Object.defineProperties(Document.prototype, {
  innerWidth: {
    enumerable: true,
    get: function() {
      return this.width - this.padding.right - this.padding.left
    }
  },
  innerHeight: {
    enumerable: true,
    get: function() {
      return this.height - this.padding.top - this.padding.bottom
    }
  }
})

Document.prototype.addPage = function() {
  return this.pages.addPage()
}

Document.prototype.font = function(path) {
  var font = new TTFFont(path), subset = font.subset()
  subset.id = new PDFName('F' + this.nextFontId++)
  // if (name in this.fonts) return this.fonts[name]
  // return this.fonts[name] = new AFMFont(this, 'F' + this.nextFontId++, name)
  return subset
}

Document.prototype.createObject = function(type) {
  var object = new PDFObject(this.nextObjId++, 0)
  if (type) object.addProperty('Type', type)
  this.objects.push(object)
  return object
}

var PDFString = require('./objects/string')
  , Operation = require('./content/operation')

// Text objects

Document.prototype.BT = function() {
  this.contents.push(new Operation('BT'))
  return this
}

Document.prototype.Tj = function(str) {
  this.defaultFont.use(str)
  str = this.defaultFont.encode(str)
  this.contents.push(new Operation((new PDFString(str)).toLiteralString() + ' Tj'))
  return this
}

Document.prototype.Td = function(x, y) {
  this.contents.push(new Operation([x, y, 'Td'].join(' ')))
  return this
}

Document.prototype.Tf = function(font, size) {
  this.contents.push(new Operation([font.id, size, 'Tf'].join(' ')))
  return this
}

Document.prototype.ET = function() {
  this.contents.push(new Operation('ET'))
  return this
}

// Rendering

Document.prototype.createPages = function() {
  var page = this.pages.addPage()
  page.addFont(this.defaultFont)
  this.contents.forEach(function(content) {
    content.embed(page)
  })
}

Document.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + Base64.encode(this.toString())
}

Document.prototype.toString = function() {
  this.defaultFont.embed(this)
  this.createPages()
  
  var buf = '', xref = [], startxref
  
  // header
  buf += '%PDF-' + this.version.toString() + '\n'
  
  // The PDF format mandates that we add at least 4 commented binary characters
  // (ASCII value >= 128), so that generic tools have a chance to detect
  // that it's a binary file
  buf += '%\xFF\xFF\xFF\xFF\n'

  buf += '\n'
  
  // body
  this.objects.forEach(function(object) {
    xref.push(buf.length)
    buf += object.toString() + '\n\n'
  })
  
  // to support random access to individual objects, a PDF file
  // contains a cross-reference table that can be used to locate
  // and directly access pages and other important objects within the file
  startxref = buf.length
  buf += 'xref\n'
  buf += '0 ' + (this.objects.length + 1) + '\n'
  buf += '0000000000 65535 f \n'
  xref.forEach(function(ref) {
    buf += '0000000000'.substr(ref.toString().length) + ref + ' 00000 n \n' 
  })
  
  // trailer
  buf += 'trailer\n'
  buf += '<<\n'
  buf +=   '\t/Size ' + (this.objects.length + 1) + '\n'
  buf +=   '\t/Root ' + this.catalog.toReference().toString() + '\n'
  buf += '>>\n'
  buf += 'startxref\n'
  buf += startxref + '\n'
  buf += '%%EOF'
  
  return buf
}

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // public method for encoding
  encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
          enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
          enc4 = 64;
      }

      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }

    return output;
  },

  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  }
}