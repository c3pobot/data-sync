'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('effects', {}, { id: 1, nameKey: 1})
  if(!obj || obj.length == 0) return
  let effectSet = new Set(), autoComplete = []
  for(let i in obj){
    if(effectSet.has(obj[i].nameKey)) continue
    autoComplete.push({ name: obj[i].nameKey, value: obj[i].id })
    effectSet.add(obj[i].nameKey)
  }
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'effect' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.effect': 'effect' })
    return true
  }
}
