'use strict'

class Font {
  static isFont(font) {
    return font && (font instanceof Font || (
      typeof font === 'object'
      && typeof font.encode === 'function'
      && typeof font.stringWidth === 'function'
      && typeof font.lineHeight === 'function'
      && typeof font.ascent === 'function'
      && typeof font.descent === 'function'
      && typeof font.underlinePosition === 'function'
      && typeof font.underlineThickness === 'function'
      && typeof font.write === 'function'
    ))
  }
}

class StringWidth {
  constructor(width, kerning) {
    this.width = width
    this.kerning = kerning
  }

  valueOf() {
    return this.width
  }
}

Font.StringWidth = StringWidth
module.exports = Font