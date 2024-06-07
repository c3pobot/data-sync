'use strict'
const getFile = require('src/helpers/getFile')

module.exports = async(gameVersion, localeVersion)=>{
  let obj = await getFile(`ability`, gameVersion)
  if(!obj) return
  let list = {}
  for(let i in obj){
    if(!obj[i].id) continue
    list[obj[i].id] = { id: obj[i].id, nameKey: obj[i].nameKey, descKey: obj[i].descKey, tier: obj[i].tier.map(m=>{ return { descKey: m.descKey, upgradeDescKey: m.upgradeDescKey, cooldownMaxOverride: m.cooldownMaxOverride  } }) }
  }
  return list
}
