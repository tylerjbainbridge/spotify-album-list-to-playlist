const assert = require('assert')

describe('smart-promisify', function () {
  const promisify = require('..')
  const value = 'exampleValue'

  function exampleFn(arg, cb) {
    setImmediate(() => {
      cb(null, {
        self: this,
        arg
      })
    })
    return this
  }

  it('should throw if the first argument is not a function', function () {
    assert.throws(() => {
      promisify('hello')
    })
  })

  it('should return a wrapper function', function () {
    const returned = promisify(() => {})
    assert.strictEqual(typeof returned, 'function')
  })

  it('should apply the self argument', async function () {
    const exampleSelf = {}
    const wrapped = promisify(exampleFn, exampleSelf)
    const result = await wrapped(value)

    assert.strictEqual(result.self, exampleSelf)
  })

  it('should prefer the applied self', async function () {
    const exampleSelf = { example: true }
    const prefferedSelf = { preffered: true }
    const wrapped = promisify(exampleFn, exampleSelf)
    const result = await wrapped.call(prefferedSelf, value)

    assert.strictEqual(result.self, prefferedSelf)
  })

  describe('with callback', function () {
    it('should not return a promise', function () {
      const wrapped = promisify(exampleFn)
      const result = wrapped(value, () => {})
      assert(!(result instanceof Promise))
    })

    it('should call the callback', function (cb) {
      const wrapped = promisify(exampleFn)
      wrapped(value, cb)
    })
  })

  describe('without callback', function () {
    it('should return a promise', function () {
      const wrapped = promisify(exampleFn)
      const result = wrapped(value)

      assert(result instanceof Promise)
    })

    describe('returned promise', function () {
      it('should resolve to the result', async function () {
        const wrapped = promisify(exampleFn)
        const result = await wrapped(value)
        assert.strictEqual(result.arg, value)
      })

      it('should catch errors', async function () {
        function damaged() {
          throw new Error('test')
        }

        const wrapped = promisify(damaged)

        try {
          await wrapped()
        } catch (err) {
          if (err.message !== 'test') {
            throw err
          }
        }
      })

      it('should handle error callbacks', async function () {
        function damaged(cb) {
          cb(new Error('test'))
        }

        const wrapped = promisify(damaged)

        try {
          await wrapped()
        } catch (err) {
          if (err.message !== 'test') {
            throw err
          }
        }
      })
    })
  })
})
