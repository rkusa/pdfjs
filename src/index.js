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

// load fonts
import CourierBold from './font/afm/Courier-Bold'
import CourierBoldOblique from './font/afm/Courier-BoldOblique'
import CourierOblique from './font/afm/Courier-Oblique'
import Courier from './font/afm/Courier'
import HelveticaBold from './font/afm/Helvetica-Bold'
import HelveticaBoldOblique from './font/afm/Helvetica-BoldOblique'
import HelveticaOblique from './font/afm/Helvetica-Oblique'
import Helvetica from './font/afm/Helvetica'
import Symbol from './font/afm/Symbol'
import TimesBold from './font/afm/Times-Bold'
import TimesBoldItalic from './font/afm/Times-BoldItalic'
import TimesItalic from './font/afm/Times-Italic'
import TimesRoman from './font/afm/Times-Roman'
import ZapfDingbats from './font/afm/ZapfDingbats'

export {
  CourierBold,
  CourierBoldOblique,
  CourierOblique,
  Courier,
  HelveticaBold,
  HelveticaBoldOblique,
  HelveticaOblique,
  Helvetica,
  Symbol,
  TimesBold,
  TimesBoldItalic,
  TimesItalic,
  TimesRoman,
  ZapfDingbats
}