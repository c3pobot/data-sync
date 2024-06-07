'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const enumOmicron = require(`src/enums/omicrons`)

const indexUnitSkills = (unit = {}, lang = {})=>{
  let res = { baseId: unit.baseId, nameKey: lang[unit.nameKey], skills: [], ultimate: [] }
  if(unit.skillReference?.length > 0) res.skills = unit.skillReference.reduce((a,v)=>({...a, [v.skillId]:{skillId: v.skillId}}), {})
  if(unit.crew?.length > 0){
    for(let i in unit.crew) res.skills = unit.crew[i].skillReference.reduce((a,v)=>({...res.skills, [v.skillId]:{skillId: v.skillId}}), {})
  }
  let ultimateArray = unit.limitBreakRef.filter(x=>x.powerAdditiveTag === 'ultimate')
  ultimateArray = ultimateArray.concat(unit.uniqueAbilityRef.filter(x=>x.powerAdditiveTag === 'ultimate'))
  res.ultimate = ultimateArray.reduce((a,v)=>({...a, [v.abilityId]:{abilityId: v.abilityId}}), {})
  return res;
}
const updateSkills = (unit = {}, lang = {}, skillList = [], abilityList = [], effectList = [])=>{

  for(let i in unit.skills) unit.skills[i] = updateSkill(unit.skills[i], lang, skillList, abilityList, effectList)
  for(let i in unit.ultimate) unit.ultimate[i] = updateUlitmate(unit.ultimate[i], lang, skillList, abilityList, effectList)

}
const mapEffectReference = (effectReference = [], abilityDamage = [], effectList = [])=>{
  for(let i in effectReference){
    let effect = effectList.find(x=>x.id === effectReference[i].id)
    if(!effect) continue
    if(effect.multiplierAmountDecimal == 0 && !effect.summonId) continue
    abilityDamage.push({ id: effect.id, param: effect.param, damageType: effect.damageType, multiplierAmountDecimal: effect.multiplierAmountDecimal, resultVarianceDecimal: effect.resultVarianceDecimal, summonId: effect.summonId, summonEffectList: effect.summonEffect })
  }
}
const mapTier = (tier = {}, abilityDamage = [], effectList = [])=>{
  if(!tier.effectReference || tier.effectReference?.length == 0) return
  mapEffectReference(tier.effectReference, abilityDamage, effectList)
}
const updateSkill = (unitSkill, lang = {}, skillList = [], abilityList = [], effectList = [])=>{
  if(!unitSkill) return
  let skill = skillList.find(x=>x.id === unitSkill.skillId)
  let ability = abilityList.find(x=>x.id === skill.abilityReference)

  let tempObj = {
    abilityId: ability.id,
    nameKey: lang[ability.nameKey] || ability.nameKey,
    descKey: lang[ability?.tier[+ability?.tier?.length - 1]?.descKey] || ability.descKey,
    isZeta: skill.isZeta,
    type: ability.abilityType,
    tiers: ability.tier,
    omicronMode: skill.omicronMode,
    omicronType: (enumOmicron[skill.omicronMode] ? enumOmicron[skill.omicronMode].nameKey:''),
    abilityDamage: []
  }
  if(tempObj.tiers?.length > 0){
    for(let i in tempObj.tiers) mapTier(tempObj.tiers[i], tempObj.abilityDamage, effectList)
  }
  return {...unitSkill,...tempObj}
}
const updateUlitmate = (unitSkill, lang = {}, skillList = [], abilityList = [], effectList = [])=>{
  if(!unitSkill) return
  let ability = abilityList.find(x=>x.id === unitSkill.abilityId)
  let tempObj = {
    nameKey: lang[ability.nameKey] || ability.nameKey,
    descKey: lang[ability.descKey] || ability.descKey,
    type: ability.abilityType,
    abilityDamage: []
  }
  if(ability.effectReference?.length > 0) mapEffectReference(ability.effectReference, tempObj.abilityDamage, effectList)
  return {...unitSkill,...tempObj}
}
const mapUnitSkill = async(unit = {}, lang = {}, skillList = [], abilityList = [], effectList = [])=>{
  updateSkills(unit, lang, skillList, abilityList, effectList)
  if(unit.ultimate) unit.ultimate = Object.values(unit.ultimate)
  if(unit.skills) unit.skills = Object.values(unit.skills)

  if(unit.skills.length > 0) await mongo.set('skills', { _id: unit.baseId }, unit)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ unitList, abilityList, skillList, effectList, lang ] = await Promise.all([
    getFile('units', gameVersion),
    getFile('ability', gameVersion),
    getFile('skill', gameVersion),
    getFile('effect', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])

  if(!unitList || !abilityList || !skillList || !effectList || !lang) return
  let units = unitList.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)?.map(x=> { return indexUnitSkills(x, lang)})
  if(!units) return

  for(let i in units) await mapUnitSkill(units[i], lang, skillList, abilityList, effectList)
  /*
  let i = units.length, array = []

  while(i--) array.push(mapUnitSkill(units[i], lang, skillList, abilityList, effectList))
  await Promise.all(array)
  */
  return true
}
