'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('units', {}, { baseId: 1, nameKey: 1, combatType: 1, thumbnailName: 1, alignment: 1, isGL: 1, offenseStatId: 1})
  let autoComplete = obj?.map(x=>{
    return { name: x.nameKey, value: x.baseId, baseId: x.baseId, combatType: x.combatType, thumbnailName: x.thumbnailName, alignment: x.alignment, isGL: x.isGL, offenseStatId: x.offenseStatId }
  })
  if(autoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'unit' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', {_id: 'nameKeys'}, { include: false, 'data.unit': 'unit', 'data.leader': 'unit', 'data.unit1': 'unit', 'data.unit2': 'unit', 'data.unit3': 'unit', 'data.unit4': 'unit', 'data.exclude-attack-unit': 'unit' })
    return true
  }
}
