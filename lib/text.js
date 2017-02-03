'use strict'

const LineBreaker = require('linebreak')
const unorm = require('unorm')
const ops = require('./ops')

module.exports = async function renderText(text, parent) {
  if (!this._doc._currentPage) {
    await this._doc._startPage()
  }

  const font = this._doc.defaultFont

  // enforce string
  text = String(text)

  const fontSize = 20
  const lineHeight = 1//.15

  let beginText = ops.BT()
    // set current font and color
    + ops.Tf(font.alias, fontSize)
    + ops.SC(0, 0, 0)
  let endText = ops.ET()
  let isFirstLine = true

  const breaker = new LineBreaker(text)
  const line = []
  const scaleFactor = 1000 / fontSize
  let spaceLeft = this._cursor.width
  let last = 0, bk

  while ((bk = breaker.nextBreak()) || line.length > 0) {
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
      if (line.length > 0) {
        wordWidth += font.stringWidth(' ', fontSize)
      }
    }

    // render line if there is a line break, if we hit the last word of the text, if we
    // have manual page breaks, or if there is not enough space on the line left
    const isLastWord = !bk // || bk.position === text.length
    if ((bk && bk.required) || isLastWord || linebreaks > 0 || (spaceLeft - wordWidth) < 0) {
      // if there is enough space, add word to the current line
      if ((spaceLeft - wordWidth) >= 0) {
        line.push({ l: wordWidth, w: word })
        spaceLeft -= wordWidth
        word = null
      }

      // render line
      let left = this._cursor.x

      // calc max line height
      // const height = Math.max.apply(Math,
      //   line.map(w => font.lineHeight(fontSize, true))
      // ) * lineHeight
      const height = font.lineHeight(fontSize, true) * lineHeight

      // break page if necessary
      if (!this._cursor.doesFit(height)) {
        if (!isFirstLine) {
          await this._doc._write(endText)
        }

        // execute page break
        // add remaining text as new text to the queue of pending
        // operations
        const remainingText = line.map(w => w.w).join(' ') + ' ' + text.substring(bk.position)
        parent._pending.unshift(() => renderText.call(this, remainingText, parent))
        await parent._pageBreak(1)

        break
        // isFirstLine = true
      }

      // shift cursor; since rendering is done above the y coordinate,
      // we have to update the cursor before rendering the line
      this._cursor.y -= height // shift y cursor

      // calculate remaining space
      // TODO use word specific font
      const freeSpace = spaceLeft
      // const freeSpace = this._cursor.width - line.map(w => w.l).reduce((l, r) => l + r, 0)

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
        spacing = freeSpace / (line.length - 1)
        break
      }

      // render words
      let chunk = isFirstLine ? beginText : ''
      chunk += ops.Tm(1, 0, 0, 1, left, this._cursor.y, this._cursor.x, height) // set pos
      if (spacing === 0) {
        chunk += ops.Tj(font.encode(line.map(w => w.w).join(' ')))
      } else {
        const arr = []
        line.forEach(w => {
          arr.push(
            font.encode(w.w),
            -(spacing + font.stringWidth(' ', fontSize)) * scaleFactor
          )
        })
        chunk += ops.TJ(arr)
      }
      await this._doc._write(chunk)

      const descent = font.lineDescent(fontSize)
      this._cursor.y += descent // add, because descent is negative

      // reset / update variables
      spaceLeft = this._cursor.width
      line.length = 0 // empty line array
      isFirstLine = false
    }

    // consider word for next line
    if (word !== null) {
      line.push({ l: wordWidth, w: word })
      spaceLeft -= wordWidth
    }

    // add trailing line breaks
    linebreaks-- // there is one line break anyway, so reduce by one
    if (linebreaks > 0) {
      this._cursor.y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
    }
  }

  await this._doc._write(endText)
}
