'use strict'

module.exports = class Font {
  static isFont(font) {
    return font && font instanceof Font
  }
}
