'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('datacronList', {}, { setId: 1, nameKey: 1, expirationTimeMs: 1 })
  let data = {}, timeNow = Date.now()
  for(let i in obj){
    if(obj[i].expirationTimeMs && +obj[i].expirationTimeMs > +timeNow){
      if(!data[obj[i].setId]) data[obj[i].setId] = { name: obj[i].nameKey, value: obj[i].setId?.toString() }
    }
  }
  let autoComplete = Object.values(data)
  if(autoComplete.length >= 0){
    await mongo.set('autoComplete', { _id: 'datacron-set' }, { data: autoComplete, include: true, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.datacron-set': 'datacron-set' })
    return true
  }
}
