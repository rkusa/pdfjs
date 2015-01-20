'use strict'

var BaseNode = module.exports = function() {
  this.type = 'BaseNode'
  this.allowBreak = false
  this.pageBreakType = require('./pagebreak')
  this.direction = 'topDown'
  this.page = 0
  this.computed = false
  this.arranged = false
}

BaseNode.prototype.mustUpdate = function(/* cursor */) {
  return false
}

BaseNode.prototype.beforeContent = function(cursor) {
  return cursor
}

BaseNode.prototype.afterContent = function(cursor) {
  return cursor
}

BaseNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  this.width  = 0
  this.height = 0
}

BaseNode.prototype.compute = function(cursor) {
  cursor.setPage(this.page)

  var must = this.mustUpdate(cursor) || !this.computed || cursor.force

  if (must) {
    this._compute(cursor)
    this.computed = true
    this.arranged = false
    cursor.force = true
  }

  cursor = this.beforeContent(cursor)

  if ('children' in this) {
    this.children.forEach(function(child) {
      child.compute(cursor)
    })
  }

  this.afterContent(cursor)
}

BaseNode.prototype.arrange = function(cursor) {
  var must = !this.arranged || cursor.force


  this.page = cursor.currentPage

  if (must) {
    this.arranged = true
    cursor.force = true
  }

  cursor = cursor.beforeContent(this)

  if ('children' in this) {

    if (this.direction === 'leftRight') {
      var rowPage = cursor.currentPage
      var endPage = cursor.currentPage
      var rowOffset = cursor.offset
      var endOffset = cursor.offset
      var rowY = cursor.y
      var endY = cursor.y
    }

    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i]

      if (child.type === 'PageBreakNode') {
        if (cursor.pageBreak(child, this) === null) {
          console.log('INVALIDATE', child.id)
          this.children.splice(i, 1)
          --i
        } else {
          console.log('VALID')
          if (child.height && cursor.y - child.height < cursor.bottom - cursor.offset) {
            console.log('PBR must break', child.height)
            debugger

            child.arranged = false
            child.computed = false

            if (i === 0) {
              child.children.length = 0
            } else {
              this.children[i - 1].arranged = false
              this.children[i - 1].computed = false

              this.children.splice(i, 1)
              this.children.splice(i - 1, 0, child)
            }

            return false
          }

          cursor.applyBreak(child)
        }

        continue
      }

      if (cursor.mustBreak(child)) {
        console.log('BREAK', cursor.currentPage, child.type, child.y, cursor.offset, child.height)

        child.arranged = false

        // page break
        this.children.splice(i, 0, cursor.pageBreak(null, this))
        child.page = cursor.currentPage

        return false
      }

      if (!child.arrange(cursor)) {
        return false
      }

      if (this.direction === 'leftRight') {
        endPage = Math.max(endPage, cursor.currentPage)
        endOffset = Math.max(endOffset, cursor.offset)
        endY = Math.min(endY, cursor.y)
        cursor.currentPage = rowPage
        cursor.offset = rowOffset
        cursor.y = rowY
      }
    }

    if (this.direction === 'leftRight') {
      cursor.currentPage = endPage
      cursor.offset = endOffset
      cursor.y = endY
    }
  }

  cursor.afterContent(this)

  return true
}