'use strict'
const log = require('logger')
const fs = require('fs')
const DATA_DIR = process.env.DATA_DIR || '/app/data/files'

module.exports = async(fileName)=>{
  try{
    if(!fileName) return
    let file = await fs.readFileSync(`${DATA_DIR}/${fileName}.json`)
    if(file) return JSON.parse(file)
  }catch(e){
    log.error(`error reading ${DATA_DIR}/${fileName}.json`)
  }
}
