'use strict'
const log = require('logger')
const fs = require('fs')
const zlib = require('node:zlib')

const DATA_DIR = process.env.DATA_DIR || '/app/data/files'
const compressedSet = new Set([ 'units', 'campain', 'effect', 'Loc_ENG_US.txt', 'Loc_Key_Mapping.txt' ])

function decompressData(compressedData){
  let decompressedBuffer = zlib.brotliDecompressSync(compressedData);
  let jsonString = decompressedBuffer.toString('utf8');
  if(jsonString) return JSON.parse(jsonString)
}

module.exports = async(fileName)=>{
  try{
    if(!fileName) return
    let tempFileName = `${fileName}.json`
    if(compressedSet.has(fileName)) tempFileName += '.br'
    let file = await fs.readFileSync(`${DATA_DIR}/${tempFileName}`)
    if(!file) return

    if(tempFileName?.endsWith('.br')) return await decompressData(file)
    return JSON.parse(file)
  }catch(e){
    log.error(`error reading ${DATA_DIR}/${fileName}.json`)
  }
}
