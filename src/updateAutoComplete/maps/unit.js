'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('units', {}, { baseId: 1, nameKey: 1, combatType: 1, thumbnailName: 1, alignment: 1, isGL: 1, offenseStatId: 1})
  let autoComplete = obj?.map(x=>{
    return { name: x.nameKey, value: x.baseId, baseId: x.baseId, combatType: x.combatType, thumbnailName: x.thumbnailName, alignment: x.alignment, isGL: x.isGL, offenseStatId: x.offenseStatId }
  })
  if(autoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'unit' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
