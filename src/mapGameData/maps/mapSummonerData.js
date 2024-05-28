'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapUnitTiers = (skill = {}, unit = {}, summonedList = {})=>{
  for(let i in skill.tiers) summonedList[skill.tiers[i].summonId] = { id: skill.tiers[i].summonId, baseId: unit.baseId }
}
const mapUnitSkill = (unit = {}, summonedList = {})=>{
  for(let i in unit.skills) mapUnitTiers(unit.skills[i], unit, summonedList)
}
const mapTier = (stat = [], tier, unit = {})=>{
  if(!unit.gearLvl[tier]) unit.gearLvl[tier] = {}
  for(let i in stat) unit.gearLvl[tier][stat[i].unitStatId] = +stat[i].unscaledDecimalValue
}
const mapStatTable = (statTable = [], rarity, unit = {})=>{
  unit.growthModifiers[rarity] = {}
  for(let i in statTable) unit.growthModifiers[rarity][statTable[i].unitStatId] = +statTable[i].unscaledDecimalValue
}
const mapUnit = async(unit = {}, statProgressionList = [], lang = {}, unitList = [])=>{
  if(!unit.nameKey) return
  let tempObj = { id: unit.id, summoner: unit.summoner, nameKey: lang[unit.nameKey] || 'Placeholder', combatType: unit.combatType, primaryStat: unit.primaryUnitStat, growthModifiers: {}, gearLvl: {}, scaler: {} }
  for(let i in unit.summonStatTable){
    if(!unit.summonStatTable[i]) continue
    let statProgressionTable = statProgressionList.find(x=>x.id === unit.summonStatTable[i].statTable)
    if(!statProgressionTable?.stat?.stat) continue
    mapStatTable(statProgressionTable.stat.stat, unit.summonStatTable[i].rarity, tempObj)
  }
  for(let i in unit.unitTier){
    if(!unit.unitTier[i]?.baseStat?.stat) continue
    mapTier(unit.unitTier[i]?.baseStat?.stat, unit.unitTier[i]?.tier, tempObj)
  }

  for(let i in unit.baseStat.stat){
    tempObj.scaler[unit.baseStat.stat[i].unitStatId] = +unit.baseStat.stat[i].scalar
  }
  await mongo.set('summonerData', { _id: tempObj.id }, tempObj)
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let summonerList = await mongo.find('summonerList', {})
  if(!summonerList || summonerList?.length === 0) return

  let summonedList = {}
  for(let i in summonerList) mapUnitSkill(summonerList[i], summonedList)

  summonedList = Object.values(summonedList || {})

  if(!summonedList || summonedList?.length === 0) return

  let [ statProgressionList, lang, unitList ] = await Promise.all([
    getFile('statProgression', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('units_pve', gameVersion)
  ])
  if(!statProgressionList || !lang || !unitList) return
  let array = []
  for(let i in summonedList){
    let unit = unitList.find(x=>x.id === summonedList[i].id)
    if(!unit) continue
    unit.summoner = summonedList[i].baseId
    array.push(mapUnit(unit, statProgressionList, lang))
  }
  await Promise.all(array)
  return true
}
