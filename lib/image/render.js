'use strict'

const ops = require('../ops')
const PDFImage = require('./pdf')

module.exports = async function(img, doc, parent, opts) {
  if (!img) {
    throw TypeError('No image provided')
  }

  if (!doc._currentContent) {
    await doc._startPage()
  }

  const aliases = doc._useXObject(img)

  const _cursor = parent._cursor

  let renderWidth, renderHeight
  if (opts.width && opts.height) {
    renderWidth  = opts.width
    renderHeight = opts.height
  } else if(opts.width) {
    renderWidth  = opts.width
    renderHeight = img.height * (opts.width / img.width)
  } else if (opts.height) {
    renderHeight = opts.height
    renderWidth  = img.width * (opts.height / img.height)
  } else {
    renderWidth  = Math.min(img.width, _cursor.width)
    renderHeight = img.height * (renderWidth / img.width)

    if (renderHeight > _cursor.height) {
      renderHeight = _cursor.height
      renderWidth  = img.width * (renderHeight / img.height)
    }
  }

  let x = _cursor.x
  let y = _cursor.y

  if (opts.wrap === false) {
    if (opts.x !== undefined && opts.x !== null) {
      x = opts.x
    }

    if (opts.y !== undefined && opts.y !== null) {
      y = opts.y
    }
  } else {
    _cursor.y -= renderHeight
  }

  y -= renderHeight

  switch (opts.align) {
    case 'right':
      x += _cursor.width - renderWidth
      break
    case 'center':
      x += (_cursor.width - renderWidth) / 2
      break
    case 'left':
    default:
      break
  }

  if (img instanceof PDFImage) {
    // in percent
    renderWidth /= img.width
    renderHeight /= img.height
  }

  let chunk = ops.q()
            + ops.cm(renderWidth, 0, 0, renderHeight, x, y)

  for (const alias of aliases) {
    chunk += ops.Do(alias)
  }

  chunk +=  ops.Q()

  await doc._write(chunk)
}
