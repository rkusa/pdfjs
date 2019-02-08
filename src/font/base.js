'use strict'

export default class Font {
  static isFont(font) {
    return font && font instanceof Font
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
