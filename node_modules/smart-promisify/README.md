# smart-promisify
A smart implementation of promisify using native promises

[![Build Status](https://travis-ci.org/robojones/smart-promisify.svg?branch=master)](https://travis-ci.org/robojones/smart-promisify)
[![Test Coverage](https://codeclimate.com/github/robojones/smart-promisify/badges/coverage.svg)](https://codeclimate.com/github/robojones/smart-promisify/coverage)

[![bitHound Code](https://www.bithound.io/github/robojones/smart-promisify/badges/code.svg)](https://www.bithound.io/github/robojones/smart-promisify)
[![bitHound Overall Score](https://www.bithound.io/github/robojones/smart-promisify/badges/score.svg)](https://www.bithound.io/github/robojones/smart-promisify)
[![bitHound Dependencies](https://www.bithound.io/github/robojones/smart-promisify/badges/dependencies.svg)](https://www.bithound.io/github/robojones/smart-promisify/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/robojones/smart-promisify/badges/devDependencies.svg)](https://www.bithound.io/github/robojones/smart-promisify/master/dependencies/npm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm i smart-promisify
```

## Features

With smart-promisify you can obviously wrap asynchronous functions so they return a promise.

__But why smart?__

The smart thing about this promisify module is, that you can use the wrapped function just like before. If you provide a __callback__, no promise will be returned. If you don't provide a callback, you will get your __promise__.

You can also change the this object of the wrapped function. If you use .apply, .call or .bind on the wrapper, the __this object will also be applied to the wrapped function__.

## Example - Promisify fs.mkdir


```javascript
const fs = require('fs')
const promisify = require('smart-promisify')

// create an async function so we can await stuff
async function example () {

  // wrap the fs.mkdir method
  let mkdir = promisify(fs.mkdir)

  // await the promise returned by the wrapper
  await mkdir('folder1')

  // you can still provide a callback.
  // the wrapper will return the return value of the fs.mkdir instead of a promise
  mkdir('folder2', console.log)

  // changing the this of the promisified function
  mkdir.call(fs, 'folder3')
  // fs.mkdir will now have fs as its this object

  // alternatively you can call the promisify function with a second argument.
  mkdir = promisify(fs.mkdir, fs)
  // the second argument will be used as this object for the wrapped function, if it isn't changed afterwards by with call, bind or apply
}

example().catch(console.error)
```
