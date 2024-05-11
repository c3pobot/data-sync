'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('journeyGuide', {}, { baseId: 1, nameKey: 1, unitNameKey: 1})
  let autoComplete = obj?.map(x=>{
    return { name: x.unitNameKey, value: x.baseId, descKey: x.nameKey }
  })
  if(autoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'journey' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
