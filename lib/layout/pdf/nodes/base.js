'use strict'

var BaseNode = module.exports = function() {
  this.type = 'BaseNode'
  this.allowBreak = false
  this.page = 0
  this.compiled = false
}

BaseNode.prototype.mustUpdate = function(/* cursor */) {
  return false
}

BaseNode.prototype.updateCursor = function(/* cursor */) {
}

BaseNode.prototype.compile = function(x, y, width) {
  this.x = x
  this.y = y

  this.width  = 0
  this.height = 0
}

BaseNode.prototype._compile = function(cursor) {
  var must = this.mustUpdate(cursor) || !this.compiled || cursor.force

  if (!must) {
    cursor.currentPage = this.page
  } else {
    this.compiled = true
    cursor.force = true

    this.page = cursor.currentPage
    this.compile(cursor.x, cursor.y, cursor.innerWidth)
  }

  this.updateCursor(cursor)

  if ('children' in this) {

    for (var i = 0; i < this.children.length; ++i) {
      var child = this.children[i]

      if (child.type === 'PageBreakNode') {
        // console.log('PageBreakNode', must, this.compiled, cursor.force)

        if (cursor.pageBreak(child) === null) {
          console.log('INVALIDATE', child.id)
          this.children.splice(i, 1)
          --i
        } else {
          console.log('VALID')
        }

        continue
      }

      if (!child._compile(cursor)) {
        return false
      }

      if ((child.y - child.height) < cursor.bottom && !child.allowBreak) {
        console.log('BREAK', child.type, child.y, child.height)
        child.compiled = false

        // page break
        this.children.splice(i, 0, cursor.pageBreak())

        return false
      }
    }
  }

  return true
}