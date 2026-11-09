'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('questUnitList', {}, { id: 1, nameKey: 1})
  if(!obj || obj.length == 0) return
  let nameSet = new Set(), autoComplete = []
  for(let i of obj){
    if(nameSet.has(i.nameKey)) continue
    autoComplete.push({ name: i.nameKey, value: i.id })
    nameSet.add(i.nameKey)
  }
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'unit_pve' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.unit_pve': 'unit_pve' })
    return true
  }
}
