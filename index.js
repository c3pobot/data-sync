'use strict'
process.on('unhandledRejection', (error) => {
  console.error(error)
});
require('app-module-path').addPath(__dirname);
global.baseDir = __dirname;
require('./src')
