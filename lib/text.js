'use strict'

const Fragment = require('./fragment')
const LineBreaker = require('linebreak')
const unorm = require('unorm')
const ops = require('./ops')
const util = require('./util')

module.exports = class Text extends Fragment {
  constructor(doc, parent, opts) {
    super(doc, parent)

    this._line = []
    this._spaceLeft = 0
    this._parts = 0
    this._isFirstLine = true

    this._previousFont = null
    this._previousFontSize = null
    this._previousColor = null

    this.defaultFont = opts.font || this._doc.defaultFont
    this.defaultFontSize = opts.fontSize || this._doc.defaultFontSize
    this.defaultColor = opts.color && util.colorToRgb(opts.color) || this._doc.defaultColor
  }

  add(text, opts) {
    this._parts++
    this._pending.push(() => this._render(text, opts || {}))

    return this
  }

  append(text, opts) {
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

  async _start() {
    if (!this._doc._currentPage) {
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

    const font = opts.font || this.defaultFont
    const fontSize = opts.fontSize || this.defaultFontSize
    const color = opts.color && util.colorToRgb(opts.color) || this.defaultColor

    // enforce string
    text = String(text)

    const lineHeight = 1//.15

    const breaker = new LineBreaker(text)
    let last = 0, bk

    const isLastTextChunk = this._parts === 0 && this._ended

    while ((bk = breaker.nextBreak()) || (isLastTextChunk && this._line.length > 0)) {
      let linebreaks = 0
      let wordWidth = 0
      let word = null

      // when there is no break, there es an orphan word that just has to be rendered,
      // i.e., skip to the line rendering
      if (bk) {
        // get the string between the last break and this one
        word = text.slice(last, bk.position)

        // count linebreaks
        // TODO: not necessary
        // while (!bk.required && word.match(/(\r\n|\n|\r)$/)) {
        //   word = word.replace(/(\r\n|\n|\r)$/, '')
        //   linebreaks++
        // }

        // separate words, if has whitespace, is at the end of the text or
        // ends with a whitespace
        if (linebreaks > 0 || bk.position === text.length || text[bk.position - 1].match(/\s/)) {
          last = bk.position
        } else {
          continue
        }

        // remove trailing whitespaces if white-space style is set to normal
        // if (style.whiteSpace === 'normal') {
          word = word.replace(/^\s+/, '').replace(/\s+$/, '')
        // }

        // remove newline characters
        if (bk.required) {
          // word = word.replace(/(\r\n|\n|\r)/, '')
          linebreaks++
        }

        word = unorm.nfc(word)

        // TODO: render word
        wordWidth = font.stringWidth(word, fontSize)
        // add whitespace length for every word, except the first on in the line
        // on the first line, during the first word the line array is empty, however, for succeeding
        // lines the line array already contains the word that did not fit into the previous line
        if (this._line.length > (this._isFirstLine ? 0 : 1)) {
          wordWidth += font.stringWidth(' ', fontSize)
        }
      }

      // render line if there is a line break, if we hit the last word of the text, if we
      // have manual page breaks, or if there is not enough space on the line left
      const isLastWord = !bk && isLastTextChunk // || bk.position === text.length
      if ((bk && bk.required) || isLastWord || linebreaks > 0 || (this._spaceLeft - wordWidth) < 0) {
        // if there is enough space, add word to the current line
        if (word && (this._spaceLeft - wordWidth) >= 0) {
          this._line.push({ l: wordWidth, w: word, f: font, s: fontSize, c: color })
          this._spaceLeft -= wordWidth
          word = null
        }

        // render line
        let left = this._cursor.x

        // calc max line height
        let height = 0
        for (const w of this._line) {
          const h = w.f.lineHeight(w.s, true)
          if (h > height) {
            height = h
          }
        }

        height *= lineHeight

        // break page if necessary
        if (!this._cursor.doesFit(height)) {
          if (!this._isFirstLine) {
            await this._doc._write(ops.ET())
          }

          // execute page break
          // add remaining text as new text to the queue of pending operations
          const remainingText = word + ' ' + text.substring(bk.position)
          this._pending.unshift(() => {
            this._parts++
            return this._render(remainingText, opts)
          })

          await this._parent._pageBreak(1)

          this._isFirstLine = true
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

        let extraSpacing = 0

        // alignment
        const alignment = 'left'
        let spacing = 0
        switch (alignment) {
        case 'right':
          left += freeSpace
          break
        case 'center':
          left += this._cursor.width / 2 - (this._cursor.width - freeSpace) / 2
          break
        case 'justify':
          const isLastLine = isLastWord || linebreaks > 0
          if (isLastLine && freeSpace / this._cursor.width > .2) {
            break
          }
          if (this._line.length > 1) {
            spacing = freeSpace / (this._line.length - 1)
          }
          break
        }

        // render words
        let chunk = this._isFirstLine ? ops.BT() : ''

        // set start position
        chunk += ops.Tm(1, 0, 0, 1, left, this._cursor.y, this._cursor.x, height) // set pos

        const out = []
        let spaceWidth = calcSpaceWidth(spacing, this._previousFont, this._previousFontSize)

        for (const i in this._line) {
          const w = this._line[i]
          if (w.f !== this._previousFont || w.s !== this._previousFontSize || w.c !== this._previousColor) {
            if (out.length > 0) {
              if (spacing === 0) {
                chunk += ops.Tj(font.encode(out.join(' ') + ' '))
              } else {
                chunk += ops.TJ(out)
              }
            }

            this._previousFont = w.f
            this._previousFontSize = w.s
            this._previousColor = w.c
            this._doc._useFont(w.f)

            if (spacing > 0) {
              spaceWidth = calcSpaceWidth(spacing, w.f, w.s)
            }

            // set current font and color
            chunk += ops.Tf(w.f.alias, w.s)
                   + ops.sc(...w.c)

            out.length = 0
          }

          if (spacing === 0) {
            out.push(w.w)
          } else {
            out.push(font.encode(w.w), spaceWidth)
          }
        }

        if (out.length > 0) {
          if (spacing === 0) {
            chunk += ops.Tj(font.encode(out.join(' ')))
          } else {
            chunk += ops.TJ(out)
          }
        }

        await this._doc._write(chunk)

        const descent = font.lineDescent(fontSize)
        this._cursor.y += descent // add, because descent is negative

        // reset / update variables
        this._spaceLeft = this._cursor.width
        this._line.length = 0 // empty line array
        this._isFirstLine = false
      }

      // consider word for next line
      if (word) {
        this._line.push({ l: wordWidth, w: word, f: font, s: fontSize, c: color })
        this._spaceLeft -= wordWidth
      }

      // add trailing line breaks
      // TODO: sure linebreaks-- can be removed?
      // linebreaks-- // there is one line break anyway, so reduce by one
      if (linebreaks > 0) {
        this._cursor.y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
      }
    }
  }
}

function calcSpaceWidth(spacing, font, fontSize) {
  if (spacing === 0 || !font) {
    return 0
  }
  const scaleFactor = 1000 / fontSize
  return -(spacing + font.stringWidth(' ', fontSize)) * scaleFactor
}