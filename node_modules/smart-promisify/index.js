/**
 * Promisify the original function.
 * @param {original} original - Function that gets promisified.
 * @param {?Object} self - Object that gets applied as this-object when the original function is called.
 * @returns {wrapper}
 */
function promisify(original, self = null) {
  if (typeof original !== 'function') {
    throw new TypeError('original must be a function')
  }

  /**
   * Wrapped original function.
   * @typedef {function} wrapper
   * @param {...*} args - Arguments to apply to the original function.
   * @returns {Promise.<*>} - Promise that gets resolved when the original function calls the callback.
   */
  function wrapper(...args) {
    let thisArg = self
    if (this !== global) {
      // called with bound this object
      thisArg = this
    }

    if (typeof args[args.length - 1] === 'function') {
      // called with callback
      return original.call(thisArg, ...args)
    }

    // promisified
    return new Promise((resolve, reject) => {
      /**
       * Callback for the original function.
       * @typedef {function} cb
       * @param {?Error} error - Error if one occured.
       * @param {*} result - Result of the original function.
       */
      function cb(error, result) {
        if (error) {
          return reject(error)
        }
        resolve(result)
      }

      args.push(cb)

      original.call(thisArg, ...args)
    })
  }

  return wrapper
}

module.exports = promisify

/**
 * Function to promisify.
 * @typedef {function} original
 * @param {...*} arguments - Arguments of the original function.
 * @param {cb} cb - Callback for the original function.
 */
