'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

module.exports = async(gameVersion, localeVersion)=>{
  let statModList = await getFile('statMod', gameVersion)
  if(!statModList) return
  let data = {}
  for(let i in statModList) data[statModList[i].id] = { defId: statModList[i].id, rarity: statModList[i].rarity, slot: +statModList[i].slot, setId: +statModList[i].setId }
  await mongo.set('configMaps', { _id: 'modDefMap' }, { gameVersion: gameVersion, localeVersion: localeVersion, data: data })
  return true
}
