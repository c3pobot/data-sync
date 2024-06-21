'use strict'
const fs = require('fs')
const log = require('logger')
const getSubCommands = require('./getSubCommands')
const readFile = require('./readFile')
module.exports = (dir)=>{
  return new Promise((resolve) => {
    fs.readdir(dir, async(err, filenames)=>{
      if(err) log.error(err)
      resolve(filenames)
    })
  })
}
