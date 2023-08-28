'use strict'
const path = require('path')
const fs = require('fs')
const BASE_DIR = path.joing(baseDir, 'data', 'files')
module.exports = (file, version)=>{
  try{
    if(!file || !version) return
    let obj = fs.readFileSync(path.join(BASE_DIR, file))
    if(obj) obj = JSON.parse(obj)
    if(obj?.data && obj?.version && obj?.version === version) return obj.data
  }catch(e){
    console.log('error reading '+file)
  }
};
