'use strict'
const getFile = require('src/helpers/getFile')
const getAbilityList = require('./getAbilityList')
const enumOmicron = require(`src/enums/omicrons`)
module.exports = async(gameVersion, localeVersion)=>{
  let [ abilityList, obj, lang ] = await Promise.all([
    getAbilityList(gameVersion, localeVersion),
    getFile('skill', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!abilityList || !obj || !lang) return
  
  let list = {}
  for(let i in obj){
    if(!lang[abilityList[obj[i].abilityReference].nameKey]) continue
    let descKey = abilityList[obj[i].abilityReference].descKey
    if(abilityList[obj[i].abilityReference]?.tier?.length > 0 && abilityList[obj[i].abilityReference].tier[obj[i].tier.length - 1]) descKey = abilityList[obj[i].abilityReference].tier[obj[i].tier.length - 1].descKey;
    list[obj[i].id] = {
      id: obj[i].id,
      abilityId: abilityList[obj[i].abilityReference].id,
      maxTier: +(obj[i].tier.length) + 1,
      nameKey: lang[abilityList[obj[i].abilityReference].nameKey],
      descKey: (descKey && lang[descKey] ? lang[descKey]:descKey),
      omicronMode: obj[i].omicronMode,
      omicronType: (enumOmicron[obj[i].omicronMode] ? enumOmicron[obj[i].omicronMode].nameKey:''),
      type: (enumOmicron[obj[i].omicronMode] ? enumOmicron[obj[i].omicronMode].type:'')
    }
    for(let x in obj[i].tier){
      if(!(list[obj[i].id].zetaTier >= 0) && obj[i].tier[x].isZetaTier) list[obj[i].id].zetaTier = +x + 2;
      if(obj[i].tier[x].isOmicronTier) list[obj[i].id].omiTier = +x + 2;
    }
  }
  return list
}
