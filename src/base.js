'use strict'

const ALREADY_ENDED_ERROR = new Error('already ended')

export default class Base {
  constructor(doc, parent) {
    this._init(doc, parent)
  }

  /// private API

  _init(doc, parent) {
    this._doc = doc
    this._parent = parent
    this._cursor = parent._cursor
    this._ended = false
    this._current = null

    this._pending = parent._pending
  }

  async _pageBreak(level) {
    if (this._parent) {
       await this._parent._pageBreak(level + 1)
    }
  }

  async _end() {
    // abstract
  }

  _begin(ctx) {
    if (this._ended) {
      throw ALREADY_ENDED_ERROR
    }

    if (this._current) {
      this._current.end()
    }

    this._current = ctx
  }

  _opts(opts) {
    if (this.opts) {
      // inherit font options
      return Object.assign({
        font: this.opts.font,
        fontSize: this.opts.fontSize,
        color: this.opts.color,
        lineHeight: this.opts.lineHeight,
      }, opts)
    } else {
      return opts
    }
  }

  /// public API

  end() {
    if (this._ended) {
      throw ALREADY_ENDED_ERROR
    }

    if (this._current) {
      this._current.end()
      this._current = null
    }

    this._ended = true
    this._pending.push(() => this._end())
  }
}
