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
    let ability = abilityList[obj[i].abilityReference]
    if(!ability) continue
    if(!lang[ability.nameKey]) continue
    let descKey = ability.descKey, maxTierIndex = 0
    if(obj[i].tier.length > 0) maxTierIndex = obj[i].tier.length - 1
    if(ability?.tier?.length > 0 && ability.tier[maxTierIndex]) descKey = ability.tier[maxTierIndex].descKey;
    list[obj[i].id] = {
      id: obj[i].id,
      abilityId: ability.id,
      maxTier: +(obj[i].tier.length) + 1,
      nameKey: lang[ability.nameKey],
      descKey: lang[descKey] || descKey,
      omicronMode: obj[i].omicronMode,
      omicronType: (enumOmicron[obj[i].omicronMode] ? enumOmicron[obj[i].omicronMode].nameKey:''),
      type: (enumOmicron[obj[i].omicronMode] ? enumOmicron[obj[i].omicronMode].type:''),
      coolDown: ability.tier[maxTierIndex]?.cooldownMaxOverride || 0
    }
    for(let x in obj[i].tier){
      if(!(list[obj[i].id].zetaTier >= 0) && obj[i].tier[x].isZetaTier) list[obj[i].id].zetaTier = +x + 2;
      if(obj[i].tier[x].isOmicronTier) list[obj[i].id].omiTier = +x + 2;
    }
  }
  return list
}
