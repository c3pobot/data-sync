'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('factions', {}, { baseId: 1, nameKey: 1, hidden: 1 })
  let autoComplete = obj?.filter(x=>!x.hidden)?.map(x=>{
    if(x.baseId?.startsWith('raid_')) console.log(x.baseId)
    return { name: x.nameKey, value: x.baseId }
  })
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'faction' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
