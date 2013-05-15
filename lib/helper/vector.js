var Vector = module.exports = function() {
}

Vector.drawLine = function(page, width, from, to) {
  page.setStrokeRGBColor(0, 0, 0)
  page.setLineWidth(width)
  page.stroke(from, to)
  page.contents.writeLine('')
}