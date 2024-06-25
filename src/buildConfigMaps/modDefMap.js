'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

module.exports = async(gameVersion, localeVersion)=>{
  let [ statModList, statModSetList, lang ] = await Promise.all([
    getFile('statMod', gameVersion),
    getFile('statModSet', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!statModList || !statModSetList || !lang) return
  let data = {}, setList = {}
  for(let i in statModList){
    let modSet = setList[statModList[i].setId]
    if(!modSet){
      modSet = statModSetList.find(x=>x.id === statModList[i].setId)
      if(modSet) setList[statModList[i].setId] = modSet
    }
    if(!modSet) continue
    data[statModList[i].id] = { defId: statModList[i].id, rarity: statModList[i].rarity, slot: +statModList[i].slot, setId: +statModList[i].setId, nameKey: lang[modSet.name] || modSet.name, setCount: modSet.setCount, icon: modSet.icon }
  }
  await mongo.set('configMaps', { _id: 'modDefMap' }, { gameVersion: gameVersion, localeVersion: localeVersion, data: data })
  return true
}
