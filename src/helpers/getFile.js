'use strict'
const readFile = require('./readFile')
module.exports = async(fileName, version)=>{
  if(!fileName || !version) return
  let file = await readFile(fileName)
  if(file?.version === version && file.data) return file.data
}
