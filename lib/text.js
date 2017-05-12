'use strict'

const Fragment = require('./fragment')
const LineBreaker = require('linebreak')
const unorm = require('unorm')
const ops = require('./ops')
const util = require('./util')
const Font = require('./font/base')
const PDF = require('./object')

const UNDERLINE_FLAG = 1
const STRIKETHROUGH_FLAG = 2

module.exports = class Text extends Fragment {
  constructor(doc, parent, opts) {
    super(doc, parent)

    this._line = []
    this._spaceLeft = 0
    this._parts = 0
    this._isFirstLine = true
    this._isNewLine = true

    this._previousFont = null
    this._previousFontSize = null
    this._previousColor = null

    this._previousHeight = 0
    this._previousDescent = 0

    this.defaultFont = opts.font || this._doc.defaultFont
    this.defaultFontSize = opts.fontSize || this._doc.defaultFontSize
    this.defaultColor = opts.color && util.colorToRgb(opts.color) || this._doc.defaultColor
    this.defaultLineHeight = opts.lineHeight || this._doc.defaultLineHeight
    this.defaultDecoration = (opts.underline ? UNDERLINE_FLAG : 0) | (opts.strikethrough ? STRIKETHROUGH_FLAG : 0)

    this.alignment = opts.alignment || opts.textAlign || 'left'

    this.link = opts.link
  }

  /// private API

  async _start() {
    if (!this._doc._currentContent) {
      await this._doc._startPage()
    }

    this._spaceLeft = this._cursor.width
  }

  async _end() {
    // write end text
    await this._doc._write(ops.ET())
  }

  async _render(text, opts) {
    this._parts--

    if (!Font.isFont(opts.font || this.defaultFont)) {
      throw new TypeError('invalid font: ' + font)
    }

    const font = this._doc._fontInstance(opts.font || this.defaultFont)
    const fontSize = opts.fontSize || this.defaultFontSize
    const color = opts.color && util.colorToRgb(opts.color) || this.defaultColor
    const lineHeight = opts.lineHeight || this.defaultLineHeight
    const link = opts.link || this.link
    const decoration = this.defaultDecoration | (opts.underline ? UNDERLINE_FLAG : 0) | (opts.strikethrough ? STRIKETHROUGH_FLAG : 0)

    // enforce string
    text = String(text)
    text = text.replace(/\r\n/g, '\n')
               .replace(/\u2028|\u2029/g, '') // <- TODO: does this break things?

    const breaker = new LineBreaker(text)
    let last = 0, bk

    const isLastTextChunk = this._parts === 0 && this._ended
    let postponeLinebreak = false
    let nextWord = null

    while (nextWord !== null || postponeLinebreak || (bk = breaker.nextBreak()) || (isLastTextChunk && this._line.length > 0)) {
      let word = null

      if (nextWord) {
        word = nextWord
        nextWord = null
      }
      // when there is no break, there es an orphan word that just has to be rendered,
      // i.e., skip to the line rendering
      else if (bk) {
        let until = bk.position

        const lastIsSpace = text[bk.position - 1].match(/\s/)
        if (lastIsSpace) {
          until--
        }

        // get the string between the last break and this one
        word = text.slice(last, until)

        // separate words, if has whitespace, is at the end of the text or
        // ends with a whitespace
        if (bk.position === text.length || lastIsSpace) {
          last = bk.position
        } else {
          continue
        }

        word = unorm.nfc(word)
      }

      let wordWidth = 0
      let offsetWidth = 0
      let spaceWidth = 0

      if (word) {
        wordWidth = offsetWidth = font.stringWidth(word, fontSize)
        spaceWidth = font.stringWidth(' ', fontSize)

        // add whitespace length for every word, except the first on in the line
        // on the first line, during the first word the line array is empty, however, for succeeding
        // lines the line array already contains the word that did not fit into the previous line
        if (this._line.length > (this._isNewLine ? 0 : 1)) {
          offsetWidth += spaceWidth
        }
      }

      // render line if there is a line break, if we hit the last word of the text, if we
      // have manual page breaks, or if there is not enough space on the line left
      const isLastWord = (!bk || bk.position === text.length) && isLastTextChunk
      const notEnoughSpace = this._spaceLeft < offsetWidth
      if (postponeLinebreak || (bk && bk.required) || isLastWord || notEnoughSpace) {
        // if word is longer than one line
        if (this._line.length === 0 && notEnoughSpace) {
          // split word
          for (let i = word.length - 1; i >= 0; --i) {
            const w = font.stringWidth(word[i], fontSize)
            wordWidth -= w
            offsetWidth -= w

            if (this._spaceLeft >= offsetWidth) {
              this._line.push({ l: [wordWidth, spaceWidth], w: word.slice(0, i), f: font, s: fontSize, c: color, d: decoration })
              this._spaceLeft -= offsetWidth

              nextWord = word.slice(i)
              word = null

              break
            }
          }
        }

        // if there is enough space, add word to the current line
        if (!postponeLinebreak && word && (this._spaceLeft - offsetWidth) >= 0) {
          this._line.push({ l: [wordWidth, spaceWidth], w: word, f: font, s: fontSize, c: color, d: decoration })
          this._spaceLeft -= offsetWidth
          word = null
        }

        // render line
        let left = this._cursor.x

        // calc max line height
        let height = 0
        let descent = 0

        for (const w of this._line) {
          const h = w.f.lineHeight(w.s, true)
          if (h > height) {
            height = h
          }

          const d = -w.f.descent(w.s)
          if (d > descent) {
            descent = d
          }
        }

        height *= lineHeight
        descent *= lineHeight

        if (height === 0) {
          height = this._previousHeight
          descent = this._previousDescent
        }

        // break page if necessary
        if (!this._cursor.doesFit(height)) {
          if (!this._isFirstLine) {
            await this._doc._write(ops.ET())
          }

          // execute page break
          // add remaining text as new text to the queue of pending operations
          const remainingText = bk ? ((word ? (word + ' ') : '') + text.substring(bk.position)) : ''
          this._pending.unshift(() => {
            this._parts++
            return this._render(remainingText, opts)
          })

          await this._parent._pageBreak(1)

          this._isFirstLine = true
          this._isNewLine = true
          this._previousFont = null
          this._previousFontSize = null
          this._previousColor = null

          break
        }

        // shift cursor; since rendering is done above the y coordinate,
        // we have to update the cursor before rendering the line
        this._cursor.y -= height // shift y cursor

        // calculate remaining space
        const freeSpace = this._spaceLeft

        // alignment
        let spacing = 0
        switch (this.alignment) {
        case 'right':
          left += freeSpace
          break
        case 'center':
          left += this._cursor.width / 2 - (this._cursor.width - freeSpace) / 2
          break
        case 'justify':
          const isLastLine = isLastWord || (bk && bk.required)
          if (isLastLine && freeSpace / this._cursor.width > .2) {
            break
          }
          if (this._line.length > 1) {
            spacing = freeSpace / (this._line.length - 1)
          }
          break
        }

        // render words
        let chunk = ''

        if (this._isFirstLine) {
          this._previousHeight = height
          chunk += ops.BT()
                // set initial pos
                + ops.Tm(1, 0, 0, 1, left, this._cursor.y)
                // set leading
                + ops.TL(this._previousHeight)
        } else {
          const lh = height + this._previousDescent

          if (height > 0 && lh !== this._previousHeight) {
            this._previousHeight = lh
            chunk += ops.TL(lh)
          }

          if (left > this._cursor.x) {
            // set new x and y position
            chunk += ops.Tm(1, 0, 0, 1, left, this._cursor.y)
          } else {
            // move to next line
            chunk += ops.Tstar()
          }
        }

        if (height > 0) {
          this._previousDescent = descent
        }

        const out = []

        let underlineFrom = left
        let underlineWidth = 0

        const drawUnderline = (fontSize) => {
          const underlinePosition = this._cursor.y + font.underlinePosition(fontSize)
          const chunk = ops.w(font.underlineThickness(fontSize))  // line width
                      + ops.SC(this._previousColor[0], this._previousColor[1], this._previousColor[2]) // stroking color
                      + ops.S(underlineFrom, underlinePosition, 'm', underlineFrom + underlineWidth, underlinePosition, 'l') // line
          underlineFrom += underlineWidth
          underlineWidth = 0
          return chunk
        }

        let strikethroughFrom = left
        let strikethroughWidth = 0

        const drawStrikethrough = (fontSize) => {
          const strikethroughPosition = this._cursor.y + font.ascent(fontSize) * .35
          const chunk = ops.w(font.underlineThickness(fontSize))  // line width
                      + ops.SC(this._previousColor[0], this._previousColor[1], this._previousColor[2]) // stroking color
                      + ops.S(strikethroughFrom, strikethroughPosition, 'm', strikethroughFrom + strikethroughWidth, strikethroughPosition, 'l') // line
          strikethroughFrom += strikethroughWidth
          strikethroughWidth = 0
          return chunk
        }

        let shouldUnderline = false
        let shouldStrikethrough = false

        for (const i in this._line) {
          const w = this._line[i]

          const fontStyleChanged = w.f !== this._previousFont || w.s !== this._previousFontSize
          const colorChanged = !util.rgbEqual(w.c, this._previousColor)

          if ((!(w.d & UNDERLINE_FLAG) || fontStyleChanged || colorChanged) && shouldUnderline) {
            chunk += drawUnderline(this._previousFontSize)
            shouldUnderline = false
          }

          if ((w.d & UNDERLINE_FLAG) && !shouldUnderline) {
            shouldUnderline = true
            underlineFrom += underlineWidth
            underlineWidth = 0
            if (i > 0) {
              underlineFrom += font.stringWidth(' ', this._previousFontSize)
              underlineWidth = -font.stringWidth(' ', w.s)
            }
          }

          if ((!(w.d & STRIKETHROUGH_FLAG) || fontStyleChanged || colorChanged) && shouldStrikethrough) {
            chunk += drawStrikethrough(this._previousFontSize)
            shouldStrikethrough = false
          }

          if ((w.d & STRIKETHROUGH_FLAG) && !shouldStrikethrough) {
            shouldStrikethrough = true
            strikethroughFrom += strikethroughWidth
            strikethroughWidth = 0
            if (i > 0) {
              strikethroughFrom += font.stringWidth(' ', this._previousFontSize)
              strikethroughWidth = -font.stringWidth(' ', w.s)
            }
          }

          if (fontStyleChanged || colorChanged) {
            if (out.length > 0) {
              if (spacing === 0) {
                chunk += ops.Tj(font.encode(out.join(' ') + ' '))
              } else {
                chunk += ops.TJ(out)
              }
            }

            if (fontStyleChanged) {
              this._previousFont = w.f
              this._previousFontSize = w.s

              const alias = this._doc._fontAlias(w.f)

              // set font and font size
              chunk += ops.Tf(alias, w.s)
            }

            // set color if it has changed
            if (colorChanged) {
              this._previousColor = w.c
              chunk += ops.sc(...w.c)
            }

            out.length = 0
          }

          if (spacing === 0) {
            out.push(w.w)
          } else {
            out.push(font.encode(w.w), calcSpaceWidth(spacing, w.f, w.s))
          }

          let shift = w.l[0] + (i > 0 ? (spacing || w.l[1]) : 0)
          underlineWidth += shift
          strikethroughWidth += shift
        }

        if (shouldUnderline) {
          await this._doc._write(drawUnderline(this._previousFontSize))
        }

        if (shouldStrikethrough) {
          await this._doc._write(drawStrikethrough(this._previousFontSize))
        }

        if (out.length > 0) {
          if (spacing === 0) {
            chunk += ops.Tj(font.encode(out.join(' ')))
          } else {
            chunk += ops.TJ(out)
          }
        }

        await this._doc._write(chunk)

        if (link) {
          // TODO: implement annotations in a more generic way
          const rectWidth = this._cursor.width - freeSpace
          const annot = new PDF.Dictionary({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: new PDF.Array([left, this._cursor.y, left + rectWidth, this._cursor.y + height]),
            Border: new PDF.Array([0, 0, 0]),
            A: new PDF.Dictionary({
              Type: 'Action',
              S: 'URI',
              URI: new PDF.String(link),
            }),
          })
          this._doc._annotations.push(annot)
        }

        this._cursor.y -= descent

        // reset / update variables
        this._spaceLeft = this._cursor.width
        this._line.length = 0 // empty line array
        this._isFirstLine = false
        this._isNewLine = bk && bk.required

        postponeLinebreak = bk && bk.required && word !== null && word.length > 0
      }

      // consider word for next line
      if (word) {
        this._line.push({ l: [wordWidth, spaceWidth], w: word, f: font, s: fontSize, c: color, d: decoration })
        this._spaceLeft -= offsetWidth
      }

      bk = null
    }
  }

  /// public API

  add(text, opts) {
    this._begin(null) // trigger error, if text is already ended
    this._parts++
    this._pending.push(() => this._render(text, opts || {}))

    return this
  }

  append(text, opts) {
    this._begin(null) // trigger error, if text is already ended

    this._parts++
    this._pending.push(() => {
      const word = this._line.pop()
      if (word) {
        text = word.w + text
        this._spaceLeft += word.l
      }
      return this._render(text, opts || {})
    })

    return this
  }

  br() {
    this._begin(null) // trigger error, if text is already ended

    this._parts++
    this._pending.push(() => this._render('\n\n', {}))

    return this
  }
}

function calcSpaceWidth(spacing, font, fontSize) {
  if (spacing === 0 || !font) {
    return 0
  }
  const scaleFactor = 1000 / fontSize
  return -(spacing + font.stringWidth(' ', fontSize)) * scaleFactor
}