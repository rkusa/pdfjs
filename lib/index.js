'use strict'

import Document from './document'
import Font from './font/otf'
import Image from './image/index'
import ExternalDocument from './external'

const mm = 0.0393700787 * 72
const cm = mm * 10

export {
  Image,
  Document,
  Font,
  ExternalDocument,
  mm,
  cm,
}
