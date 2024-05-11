'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('factions', {}, { baseId: 1, nameKey: 1 })
  let autoComplete = obj.map(x=>{
    return { name: x.nameKey, value: x.baseId }
  })
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'faction' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
