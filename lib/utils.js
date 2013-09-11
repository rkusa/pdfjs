exports.extend = function(destination, source) {
  for (var prop in source) {
    if (prop in destination) continue
    destination[prop] = source[prop]
  }
  return destination
}

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, enumerable: false }
  })
}