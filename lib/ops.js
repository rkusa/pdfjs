'use strict'

const PDFString = require('./object/string')

const precision = 3

// low level PDF operations
module.exports = {
  BT() {
    return write('BT')
  },

  ET() {
    return write('ET')
  },

  Tf(font, size) {
    return write(font, size, 'Tf')
  },

  // use SC instead
  // rg(r, g, b) {
  //   return write(r, g, b, 'rg')
  // },

  Tm(a, b, c, d, e, f) {
    return write(a, b, c, d, e, f, 'Tm')
  },

  Tj(str, asHex) {
    return write(str, 'Tj')
  },

  TJ(arr) {
    return write('[' + arr.map((v, i) => {
      if (i % 2 === 0) {
        return v
      } else {
        return toFixed(v, precision)
      }
    }).join(' ') + ']', 'TJ')
  },

  Td(x, y) {
    return write(x, y, 'Td')
  },

  // set the current color space to use for stroking operations
  CS(name) {
    return write(name, 'CS')
  },

  // same as CS but used for nonstroking operations.
  cs(name) {
    return write(name, 'cs')
  },

  // set the color to use for stroking operations
  SC(c1, c2, c3) {
    return write(c1, c2, c3, 'SC')
  },

  // same as SC but used for nonstroking operations.
  sc(c1, c2, c3) {
    return write(c1, c2, c3, 'sc')
  },

  // modify the current transformation matrix
  // translate: [ 1 0 0 1 x y ]
  // scale:     [ x 0 0 y 0 0 ]
  // rotate:    [ cosθ sinθ −sinθ cosθ 0 0 ]
  cm(a, b, c, d, e, f) {
    return write(a, b, c, d, e, f, 'cm')
  },

  // save the current graphics state on the graphics state stack
  q() {
    return write('q')
  },

  // restore the graphics state by removing the most recently saved state from the stack
  Q() {
    return write('Q')
  },

  // append a rectangle to the current path as a complete subpath
  re(x, y, width, height) {
    return write(x, y, width, height, 're')
  },

  // fill the path
  f() {
    return write('f')
  },
}

function write() {
  const line = Array.prototype.map.call(arguments, arg => {
    // TODO: use precision option
    return typeof arg === 'number' ? toFixed(arg, precision) : arg
  })
  return line.join(' ') + '\n'
}

function toFixed(num, precision) {
  return (+(Math.floor(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision)
}
