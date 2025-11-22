'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let modDef = (await mongo.find('configMaps', { _id: 'modDefMap' }))[0]?.data
  if(!modDef) return

  let modSet = new Set(), autoComplete = []
  for(let i in modDef){
    if(!modDef[i].nameKey || !modDef[i].setId) continue
    if(modSet.has(modDef[i].setId)) continue
    autoComplete.push({ name: modDef[i].nameKey, value: modDef[i].setId.toString() })
    modSet.add(modDef[i].setId)
  }
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'mod-set' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.mod-set': 'mod-set' })
    return true
  }
}
