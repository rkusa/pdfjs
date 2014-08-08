exports.extend = function(destination, source) {
  for (var prop in source) {
    if (prop in destination) continue
    destination[prop] = source[prop]
  }
  return destination
}

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, enumerable: false }
  })
}

exports.round = function(num) {
  return Math.round(num * 100) / 100
}

exports.resolveWidth = function(width, maxWidth) {
  var isRelative = !!~width.toString().indexOf('%')
  width = parseFloat(width)
  if (isRelative) {
    if (width >= 100) return maxWidth
    return (width / 100) * maxWidth
  } else {
    if (width > maxWidth) return maxWidth
    else return width
  }
}

exports.toHex = function(n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

exports.asHex = function(ab) {
  var view = new Uint8Array(ab), hex = ''
  for (var i = 0, len = ab.byteLength; i < len; ++i) {
    hex += exports.toHex(view[i])
  }
  return hex
}

exports.toArrayBuffer = function(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
  }
  return ab;
}
