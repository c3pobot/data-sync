'use strict'
const { getSkillMap, readFile, getOffenseStatId, getSkill, getCrewSkill, getUltimate } = require('./helpers')
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  try{
    let lang = await readFile('Loc_ENG_US.txt.json', localeVersion)

    let abilityList = await readFile('ability.json', gameVersion)
    let effectList = await readFile('effect.json', gameVersion)
    let skillList = await readFile('skill.json', gameVersion)
    let unitList = await readFile('units.json', gameVersion)
    let units = unitList?.filter(x=>+x.rarity === 7 && x.obtainable === true && +x.obtainableTime === 0)
    if(!lang || !abilityList || !effectList || !skillList || !unitList || !units || units?.length === 0) return
    let skillMap = await getSkillMap(skillList, abilityList, lang, true)
    let data = {}, gameData = {lang: lang, abilityList: abilityList, effectList: effectList, skillMap: skillMap}
    for(let i in units){
      let u = units[i]
      if(!lang[u.nameKey]) continue
      let alignment = u.categoryId.find(x=>x.startsWith('alignment_'))
      let unit = {
        baseId: u.baseId,
        nameKey: lang[u.nameKey],
        combatType: u.combatType,
        icon: u.thumbnailName,
        alignment: alignment,
        skill: {},
        isGL: u.legend
      }
      let offenseStatId = await getOffenseStatId(u.basicAttackRef?.abilityId, gameData)
      if(offenseStatId) unit.offenseStatId = offenseStatId
      if(u.crew?.length > 0) unit.crew = u.crew?.map(x=>x.unitId)
      let skill = await getSkill(u.skillReference, gameData)
      if(skill) unit.skill = { ...unit.skill,...skill }
      let crewSkill = await getCrewSkill(u.crew, gameData)
      if(crewSkill) unit.skill = { ...unit.skill, ...crewSkill }
      let ultimate = await getUltimate(u.limitBreakRef.filter(x=>x.powerAdditiveTag === 'ultimate'), gameData, true)
      if(ultimate) unit.ultimate = ultimate
      data[unit.baseId] = unit
    }
    await mongo.set('configMaps', {_id: 'unitDefMap'}, {gameVersion: gameVersion, localeVersion: localeVersion, data: data})
    return true
  }catch(e){
    throw(e)
  }
}
