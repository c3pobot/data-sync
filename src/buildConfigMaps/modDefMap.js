'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const enumSlots = { 2: 'Square', 3: 'Arrow', 4: 'Diamond', 5: 'Triangle', 6: 'Circle', 7: 'Cross' }

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
    let slotNameKey = `${lang[`StatMod_Name_Slot_${(+statModList[i].slot-1)}`]} (${enumSlots[statModList[i].slot]})`
    data[statModList[i].id] = { defId: statModList[i].id, rarity: statModList[i].rarity, slot: +statModList[i].slot, slotNameKey: slotNameKey, setId: +statModList[i].setId, nameKey: lang[modSet.name] || modSet.name, setCount: modSet.setCount, icon: modSet.icon }
  }
  await mongo.set('configMaps', { _id: 'modDefMap' }, { gameVersion: gameVersion, localeVersion: localeVersion, data: data })
  return true
}
