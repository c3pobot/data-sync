'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('raidDef', {}, { id: 1, nameKey: 1 })
  let autoComplete = obj?.map(x=>{
    return { name: x.nameKey, value: x.id }
  })
  if(autoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'raid' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.raid': 'raid' })
    return true
  }
}
