'use strict'
const { readFile, getStatMap} = require('./helpers')
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  try{
    let statModList = await readFile('statMod.json', gameVersion)
    if(!statModList) return
    let data = {}
    for(let i in statModList){
      data[statModList[i].id] = {
        defId: statModList[i].id,
        rarity: statModList[i].rarity,
        slot: +statModList[i].slot,
        setId: +statModList[i].setId
      }
    }
    await mongo.set('configMaps', {_id: 'modDefMap'}, {gameVersion: gameVersion, localeVersion: localeVersion, data: data})
    return true
  }catch(e){
    throw(e)
  }
}
