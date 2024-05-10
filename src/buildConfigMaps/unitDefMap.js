'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const getUltimate = require('src/helpers/getUltimate')
const getCrewSkill = require('src/helpers/getCrewSkill')
const getSkill = require('src/helpers/getSkill')
const getOffenseStatId = require('src/helpers/getOffenseStatId')
const getSkillMap = require('src/helpers/getSkillMap')
module.exports = async(gameVersion, localeVersion)=>{
  let [ lang, abilityList, effectList, skillList, unitList ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('ability', gameVersion),
    getFile('effect', gameVersion),
    getFile('skill', gameVersion),
    getFile('units', gameVersion)
  ])
  let units = unitList?.filter(x=>+x.rarity === 7 && x.obtainable === true && +x.obtainableTime === 0)
  if(!lang || !abilityList || !effectList || !skillList || !unitList || !units || units?.length === 0) return

  let skillMap = getSkillMap(skillList, abilityList, lang, true)
  let data = {}
  for(let i in units){
    let u = units[i]
    if(!lang[u.nameKey]) continue
    let alignment = u.categoryId.find(x=>x.startsWith('alignment_'))
    let unit = { baseId: u.baseId, nameKey: lang[u.nameKey], combatType: u.combatType, icon: u.thumbnailName, alignment: alignment, skill: {}, isGL: u.legend }
    unit.offenseStatId = getOffenseStatId(u.basicAttackRef?.abilityId, abilityList, effectList)
    if(u.crew?.length > 0) unit.crew = u.crew?.map(x=>x.unitId)
    let skill = getSkill(u.skillReference, skillMap, abilityList, effectList)
    if(skill) unit.skill = { ...unit.skill,...skill }
    let crewSkill = getCrewSkill(u.crew, skillMap, abilityList, effectList)
    if(crewSkill) unit.skill = { ...unit.skill, ...crewSkill }
    let ultimate = getUltimate(u.limitBreakRef.filter(x=>x.powerAdditiveTag === 'ultimate'), lang, abilityList, effectList, true)
    if(ultimate) unit.ultimate = ultimate
    data[unit.baseId] = unit
  }
  await mongo.set('configMaps', {_id: 'unitDefMap'}, {gameVersion: gameVersion, localeVersion: localeVersion, data: data})
  return true
}
