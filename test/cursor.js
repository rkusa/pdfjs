const test = require('tape')
const Cursor = require('../lib/cursor')

const width = 595.296
const height = 841.896
const padding = 20

function createCursor() {
  return new Cursor(
    width - padding*2, height - padding*2, // width, height
    padding, height - padding // x, y
  )
}

test('initialization', function(t) {
  const cursor = createCursor()

  t.equal(cursor.width, width - padding*2)
  t.equal(cursor.height, height - padding*2)
  t.equal(cursor.x, padding)
  t.equal(cursor.y, height - padding)
  t.equal(cursor.startX, padding)
  t.equal(cursor.startY, height - padding)
  t.equal(cursor.bottom, padding)

  const before = () => {}
  cursor.beforeBreak(before)
  t.deepEqual(cursor._beforeBreakHandler, [before])

  const after = () => {}
  cursor.afterBreak(after)
  t.deepEqual(cursor._afterBreakHandler, [after])

  t.end()
})

test('reset', function(t) {
  const cursor = createCursor()

  cursor.x = cursor.y = cursor.bottom = 42
  cursor.reset()

  t.equal(cursor.x, padding)
  t.equal(cursor.y, height - padding)
  t.equal(cursor.bottom, padding)

  t.end()
})

test('reset', function(t) {
  const cursor = createCursor()

  cursor.enter()
  cursor.x = cursor.y = cursor.startX = cursor.startY = cursor.bottom = cursor.width = -1
  const fn1 = () => {}
  cursor.beforeBreak(fn1)
  cursor.afterBreak(fn1)
  t.equal(cursor.x, -1)
  t.equal(cursor.y, -1)
  t.equal(cursor.startX, -1)
  t.equal(cursor.startY, -1)
  t.equal(cursor.bottom, -1)
  t.equal(cursor.width, -1)
  t.deepEqual(cursor._beforeBreakHandler, [fn1])
  t.deepEqual(cursor._afterBreakHandler, [fn1])

  cursor.enter()
  cursor.x = cursor.y = cursor.startX = cursor.startY = cursor.bottom = cursor.width = -2
  const fn2 = () => {}
  cursor.beforeBreak(fn2)
  cursor.afterBreak(fn2)
  t.equal(cursor.x, -2)
  t.equal(cursor.y, -2)
  t.equal(cursor.startX, -2)
  t.equal(cursor.startY, -2)
  t.equal(cursor.bottom, -2)
  t.equal(cursor.width, -2)
  t.deepEqual(cursor._beforeBreakHandler, [fn2, fn1])
  t.deepEqual(cursor._afterBreakHandler, [fn2, fn1])

  cursor.leave()
  t.equal(cursor.x, -1)
  t.equal(cursor.y, -2)
  t.equal(cursor.startX, -1)
  t.equal(cursor.startY, -1)
  t.equal(cursor.bottom, -1)
  t.equal(cursor.width, -1)
  t.deepEqual(cursor._beforeBreakHandler, [fn1])
  t.deepEqual(cursor._afterBreakHandler, [fn1])

  const cursorBefore = createCursor()
  cursor.leave()
  t.equal(cursor.x, cursorBefore.x)
  t.equal(cursor.y, -2)
  t.equal(cursor.startX, cursorBefore.startX)
  t.equal(cursor.startY, cursorBefore.startY)
  t.equal(cursor.bottom, cursorBefore.bottom)
  t.equal(cursor.width, cursorBefore.width)
  t.deepEqual(cursor._beforeBreakHandler, [])
  t.deepEqual(cursor._afterBreakHandler, [])

  t.end()
})