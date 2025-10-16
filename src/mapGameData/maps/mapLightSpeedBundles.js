'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getSkillList = require('./getSkillList')
const mapSkills = (skills = [], res = {}, skillList = {})=>{
  for(let i in skills){
    let skill = skillList[skills[i].skillId]
    if(!skill) continue
    res[skill.id] = { id: skill.id, maxTier: skill.maxTier }
  }
}
const mapUnits = (units = [], res = [], unitList = [], skillList = {})=>{
  if(!units || units?.length == 0) return

  for(let i in units){
    let unit = unitList.find(x=>x.baseId == units[i].id)
    if(!unit.skillReference) continue
    let skills = {}
    mapSkills(unit.skillReference, skills, skillList)
    if(unit.crew?.length > 0 && unit.combatType == 2){
      for(let c in unit.crew) mapSkills(unit.crew[c].skillReference, skills, skillList)
    }

    res.push({ baseId: units[i].id, level: units[i].level, rarity: units[i].rarity, gear: units[i].tier, relicTier: units[i].relicTier, skillTier: units[i].skillTier, skills: skills })
  }
}
const mapBundle = async(bundle = {}, lang = {}, unitList = [], skillList = {})=>{
  if(!bundle?.unitUpgrade || bundle?.unitUpgrade?.length == 0) return
  let nameKey = bundle.tabs[0]?.mainElement?.title || bundle.tabs[1]?.mainElement?.title
  if(!nameKey || !lang[nameKey]) return
  let data = { id: bundle.id, nameKey: lang[nameKey], units: [] }
  mapUnits(bundle.unitUpgrade, data.units, unitList, skillList)
  if(data?.units?.length > 0) await mongo.set('lightSpeedBundles', { _id: bundle.id }, data)
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let [ galacticBundleList, lang, skillList, unitList ] = await Promise.all([
    getFile('galacticBundle', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getSkillList(gameVersion, localeVersion, assetVersion),
    getFile('units', gameVersion)
  ])

  if(!galacticBundleList || !lang || !skillList || !unitList) return
  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)

  let array = [], i = galacticBundleList?.length
  while(i--) array.push(mapBundle(galacticBundleList[i], lang, unitList, skillList))

  await Promise.all(array)
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.bundle': 'bundle' })
  return true
}
