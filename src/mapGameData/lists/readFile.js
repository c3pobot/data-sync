'use strict'
const log = require('logger')
const fs = require('fs')

module.exports = (file)=>{
  try{
    let obj = fs.readFileSync(file)
    if(obj) obj = JSON.parse(obj)
    return(obj?.data)
  }catch(e){
    log.error('error reading '+file)
  }
};
