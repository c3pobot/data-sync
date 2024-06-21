'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('raidFactions', {}, { baseId: 1, nameKey: 1, hidden: 1 })
  let autoComplete = obj?.filter(x=>!x.hidden)?.map(x=>{
    return { name: x.nameKey, value: x.baseId }
  })
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'raid-faction' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
