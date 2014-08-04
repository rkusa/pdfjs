var PDFStream     = require('../objects/stream')
  , PDFArray      = require('../objects/array')
  , PDFName       = require('../objects/name')
  
module.exports = function(data, opts) {
	  if (data instanceof Image){
		  data.opts = opts;
		  this.contents.push(data)
	  }
	  else{
		var image = new Image(this, opts)
		this.xObject.push(image)
		return image.image(data, opts, this.xObject.length)
	  }
}

var Image = module.exports.Image = function(doc, opts) {
	  this.doc = doc
	  this.opts = opts || {}
}

Image.prototype.image = function(buffer, opts, id){
	this.id = id;
	this.opts = opts;
	this.object = this.doc.createObject('XObject')
	this.object.addProperty('Subtype', "Image")
	this.buffer = buffer;
	var info = this.getJpegInfo(buffer);
	this.width = info.width;
	this.height = info.height;
	
	switch (info.colorSpace) {
	case 3:
		this.colorSpace = "DeviceRGB"; 
		break;
	case 1:
		this.colorSpace = "DeviceGRAY"; 
		break;
	default:
		break;
	}
	this.indexed = false
	this.haveParams = false
	this.format = 'jpeg';
	return this
}

Image.prototype.getJpegInfo = function(buffer){
	var view = new DataView(toArrayBuffer(buffer));
	if (!(view.getUint8(0) === 0xff &&
			view.getUint8(1) === 0xd8)) {
				throw new Error('This does not JPEG image.')
	}	
	var blockLength = view.getUint8(4)*256 + view.getUint8(5);
	var i = 4, len = view.byteLength;
	while ( i < len ) {
		i += blockLength;
		if (view.getUint8(i) !== 0xff) {
			throw new Error('getJpegSize could not find the size of the image');
		}
		
		if (view.getUint8(i+1) === 0xc0 || //(SOF) Huffman  - Baseline DCT
		    view.getUint8(i+1) === 0xc1 || //(SOF) Huffman  - Extended sequential DCT
		    view.getUint8(i+1) === 0xc2 || // Progressive DCT (SOF2)
		    view.getUint8(i+1) === 0xc3 || // Spatial (sequential) lossless (SOF3)
		    view.getUint8(i+1) === 0xc4 || // Differential sequential DCT (SOF5)
		    view.getUint8(i+1) === 0xc5 || // Differential progressive DCT (SOF6)
		    view.getUint8(i+1) === 0xc6 || // Differential spatial (SOF7)
		    view.getUint8(i+1) === 0xc7) {
			height = view.getUint8(i+5)*256 + view.getUint8(i+6);
			width = view.getUint8(i+7)*256 + view.getUint8(i+8);
            numcomponents = view.getUint8(i+9);
            
			return {width : width, height: height, colorSpace: numcomponents};
		} else {
			i += 2;
			blockLength = view.getUint8(i)*256 + view.getUint8(i+1)
		}
	}	
}
Image.prototype.render = function(page, width, context) {
	this.addTo(page);
	var renderedWidth = this.opts.isBackground? page.doc.innerWidth : this.width;
	var renderedHeight = this.opts.isBackground? page.doc.innerHeight : this.height;
	var startY = (this.opts.isBackground? page.doc.padding.top:  page.cursor.y - renderedHeight);
	page.contents.writeLine("q " + renderedWidth + " 0 0 " + renderedHeight + " " + page.cursor.x + " " + startY + " cm /I" + this.id + " Do Q ")
	if(!this.opts.isBackground){
		page.cursor.y -=  this.height; 
	}
}
Image.prototype.maxWidth = function(){
	return this.opts.isBackground? 0 : this.width;
}
Image.prototype.embed = function(doc) {
	 var image = new PDFStream(this.object);
	 this.object.prop('Subtype', 'Image')
	 this.object.prop('Width',  this.width)
	 this.object.prop('Height', this.height)
	 var csData = [];
	 csData.push(new PDFName(this.colorSpace));
	 if(this.indexed){
		 csData.push(new PDFName("Indexed"));
		 csData.push(255);
		 csData.push(this.object.reference)
	 }
     this.object.prop('ColorSpace', new PDFArray(csData));
	 this.object.prop('BitsPerComponent', 8);
	 
	 var filters = []
	 filters.push('/ASCIIHexDecode');
	 filters.push('/DCTDecode');
	 if(this.format === 'jpeg') {
		 this.object.prop('Filter', new PDFArray(filters));
		 var hex = asHex(this.buffer);
		 this.object.prop('Length', hex.length + 1)
		 this.object.prop('Length1', this.buffer.length)
		 image.content = hex + '>\n'
	 }else{
		 this.object.prop('Filter', new PDFName("FlateDecode"));
     }
	

     doc.objects.push(this.object)
}
Image.prototype.addTo = function(page) {
	page.xObjects.add("I" + this.id, this.toReference());

}
Image.prototype.toString = function() {
	  return this.toLiteralString()
}

Image.prototype.toReference = function() {
	  return this.object.toReference()
}

function toHex(n) {
	  if (n < 16) return '0' + n.toString(16);
	  return n.toString(16);
	}

function asHex(ab) {
  var hex = ''
  for (var i = 0, len = ab.length; i < len; ++i) {
    hex += toHex(ab[i])
  }
  return hex
}
function toArrayBuffer(buffer) {
	  var ab = new ArrayBuffer(buffer.length);
	  var view = new Uint8Array(ab);
	  for (var i = 0; i < buffer.length; ++i) {
	      view[i] = buffer[i];
	  }
	  return ab;
	}