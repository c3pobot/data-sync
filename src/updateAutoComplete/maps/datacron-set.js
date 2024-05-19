'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('datacronList', {}, { _id: 1, nameKey: 1, expirationTimeMs: 1 })
  let autoComplete = [], timeNow = Date.now()
  for(let i in obj){
    if(obj[i].expirationTimeMs && +obj[i].expirationTimeMs > +timeNow){
      autoComplete.push({ name: obj[i].nameKey, value: obj[i]._id })
    }
  }
  if(autoComplete.length >= 0){
    await mongo.set('autoComplete', { _id: 'datacron-set' }, { data: autoComplete, include: true, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
