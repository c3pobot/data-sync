'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getSkillList = require('./getSkillList')
const getFactionList = require('./getFactionList')
const checkImages = require('src/helpers/checkImages')
const getOffenseStatId = require('src/helpers/getOffenseStatId')

const addOmi = async(baseId, nameKey, skill)=>{
  let tempObj = JSON.parse(JSON.stringify(skill))
  tempObj.unitBaseId = baseId
  tempObj.unitNameKey = nameKey
  await mongo.set('omicronList', { _id: tempObj.id }, tempObj)
}

const mapSkillReference = (skillReference = [], unit = {}, lang = {}, skillList = {}, updateOmi = [])=>{
  if(!skillReference || skillReference?.length == 0) return
  for(let i in skillReference){
    unit.skills[skillReference[i].skillId] = skillList[skillReference[i].skillId]
    if(skillList[skillReference[i].skillId]?.omiTier) updateOmi.push(addOmi(unit.baseId, lang[unit.nameKey], skillList[skillReference[i].skillId]))
  }
}
const mapUnits = async(unit = {}, lang = {}, skillList = {}, abilityList = [], factionList = {}, effectList = [], images = [], unitsAutoComplete = [], updateOmi = [])=>{
  let offenseStatId = getOffenseStatId(unit.basicAttackRef?.abilityId, abilityList, effectList)
  let isGl = unit.categoryId.find(x=>x === 'galactic_legend') ? true:false
  let alignment = unit.categoryId.find(x=>x?.startsWith('alignment_'))
  images.push(unit.thumbnailName)
  unitsAutoComplete.push({ name: lang[unit.nameKey], value: unit.baseId, baseId: unit.baseId, combatType: unit.combatType, thumbnailName: unit.thumbnailName, alignment: alignment, isGL: isGl, offenseStatId: offenseStatId })
  let tempObj = { baseId: unit.baseId, nameKey: lang[unit.nameKey], combatType: unit.combatType, thumbnailName: unit.thumbnailName, categoryId: unit.categoryId, alignment: alignment, skills:{}, ultimate:{}, faction:{}, isGL: isGl, offenseStatId: offenseStatId }

  if(unit.combatType == 2 && unit.crew && unit.crew.length > 0) tempObj.crew = unit.crew.map(x=>x.unitId)
  mapSkillReference(unit.skillReference, tempObj, lang, skillList, updateOmi)
  if(+unit.combatType == 2 && unit.crew?.length > 0) {
    for(let i in unit.crew) mapSkillReference(unit.crew[i].skillReference, tempObj, lang, skillList, updateOmi)
  }
  for(let i in unit.categoryId){
    if(factionList[unit.categoryId[i]]?.units?.filter(x=>x === unit.baseId).length == 0) factionList[unit.categoryId[i]].units.push(unit.baseId)
    tempObj.faction[unit.categoryId[i]] = 1
  }
  if(unit.limitBreakRef.filter(x=>x.powerAdditiveTag === 'ultimate').length > 0 && unit.legend){
    for(let i in unit.limitBreakRef){
      if(unit.limitBreakRef[i].powerAdditiveTag !== 'ultimate') continue
      let ultAbility = abilityList.find(x=>x.id == unit.limitBreakRef[i].abilityId)
      if(!ultAbility) continue
      tempObj.ultimate[ultAbility.id] = { id: ultAbility.id, nameKey: lang[ultAbility.nameKey], descKey: (lang[ultAbility.id.toUpperCase()+'_DESC'] ? lang[ultAbility.id.toUpperCase()+'_DESC']:null) }
    }
  }
  await mongo.set('units', { _id: unit.baseId }, tempObj)
}
const mapFactions = async(faction, factionAutoComplete = [])=>{
  if(!faction?.nameKey) return
  await mongo.set('factions', {_id: faction.baseId }, faction)
  factionAutoComplete.push({ name: faction.nameKey, value: faction.baseId })
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let [ skillList, factionList, unitList, abilityList, effectList, lang ] = await Promise.all([
    getSkillList(gameVersion, localeVersion, assetVersion),
    getFactionList(gameVersion, localeVersion, assetVersion),
    getFile('units', gameVersion),
    getFile('ability', gameVersion),
    getFile('effect', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)
  if(!skillList || !factionList || !unitList || unitList?.length == 0 || !abilityList || !effectList || !lang) return

  let unitsAutoComplete = [], images = [], updateOmi = [], i = unitList.length, array = []
  while(i--) array.push(mapUnits(unitList[i], lang, skillList, abilityList, factionList, effectList, images, unitsAutoComplete, updateOmi))
  await Promise.all(array)
  await Promise.all(updateOmi)

  let factionArray = [], factionAutoComplete = []
  for(let i in factionList){
    if(factionList[i].baseId.startsWith('special') || !factionList[i].nameKey || factionList[i].nameKey == 'Placeholder' || !factionList[i].uiFilter) continue
    factionArray.push(mapFactions(factionList[i], factionAutoComplete))
  }
  await Promise.all(factionArray)

  if(unitsAutoComplete?.length > 0) await mongo.set('autoComplete', { _id: 'unit' }, { include: true, data: unitsAutoComplete })
  if(factionArray?.length > 0) await mongo.set('autoComplete', { _id: 'faction' }, { include: true, data: factionAutoComplete })

  await mongo.set('autoComplete', {_id: 'nameKeys'}, { include: false, 'data.unit': 'unit', 'data.leader': 'unit', 'data.unit1': 'unit', 'data.unit2': 'unit', 'data.unit3': 'unit', 'data.unit4': 'unit', 'data.faction': 'faction' })

  if(images?.length){
    checkImages(images, assetVersion, 'thumbnail', 'unitList-thumbnail')
    checkImages(images, assetVersion, 'portrait', 'unitList-portrait')
  }
  return true
}
