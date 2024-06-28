'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const mapTBGuides = require('./mapTBGuides')

let skipSet = new Set(['alignment_dark', 'alignment_light', 'alignment_neutral'])
const getPhase = (zoneId)=>{
  if(zoneId.includes('phase01_')) return 'P1'
  if(zoneId.includes('phase02_')) return 'P2'
  if(zoneId.includes('phase03_')) return 'P3'
  if(zoneId.includes('phase04_')) return 'P4'
  if(zoneId.includes('phase05_')) return 'P5'
  if(zoneId.includes('phase06_')) return 'P6'
}
const getConflict = (zoneId)=>{
  if(zoneId.includes('_conflict01')) return 'C1'
  if(zoneId.includes('_conflict02')) return 'C2'
  if(zoneId.includes('_conflict03')) return 'C3'
  if(zoneId.includes('_conflict04')) return 'C4'
  if(zoneId.includes('_conflict05')) return 'C5'
  if(zoneId.includes('_conflict06')) return 'C6'
}
const getCampaign = (convertCampain = {}, campaignMapList = [], reqCategory)=>{
  let campaignMap = campaignMapList.find(x=>x.id === convertCampain.campaignMapId)
  if(!campaignMap?.campaignNodeDifficultyGroup) return

  let campaignNodeDifficultyGroup = campaignMap.campaignNodeDifficultyGroup.find(x=>x.campaignNodeDifficulty === convertCampain.campaignNodeDifficulty)
  if(!campaignNodeDifficultyGroup?.campaignNode) return

  let campaignNode = campaignNodeDifficultyGroup.campaignNode.find(x=>x.id === convertCampain.campaignNodeId)
  if(!campaignNode?.campaignNodeMission) return

  let mission = campaignNode.campaignNodeMission.find(x=>x.id === convertCampain.campaignMissionId)
  if(!mission?.entryCategoryAllowed) return

  let res = {
    category: mission.entryCategoryAllowed?.categoryId || [],
    requiredUnits: mission.entryCategoryAllowed?.mandatoryRosterUnit?.map(x=>x.id) || [],
    rarity: mission.entryCategoryAllowed?.minimumUnitRarity || 1,
    relicTier: ((mission.entryCategoryAllowed?.minimumRelicTier || 2) - 2),
    tier: mission.entryCategoryAllowed?.minimumUnitTier,
    numUnits: mission.entryCategoryAllowed?.minimumRequiredUnitQuantity || 0,
    gp: mission.entryCategoryAllowed?.minimumGalacticPower || 0,
    combatType: mission.combatType,
    units: []
  }
  if(res.relicTier < 0) res.relicTier = 0
  for(let i in res.category){
    if(reqCategory.has(res.category[i])) continue
    reqCategory.add(res.category[i])
  }
  return res
}
const mapSpecialMission = (covertDef = {}, convertCampain = {}, lang = {}, conflicts = [], campaignMapList = [], reqCategory)=>{
  let conflict = conflicts.find(x=>x?.zoneDefinition?.zoneId === covertDef.linkedConflictId)?.zoneDefinition
  if(!conflict) return

  let tempObj = { id: covertDef.zoneId, phase: getPhase(conflict.zoneId), conflict: getConflict(conflict.zoneId), zoneId: conflict.zoneId, zoneName: lang[conflict.nameKey] || conflict.nameKey, nameKey: lang[covertDef.nameKey] || covertDef.nameKey }
  tempObj.phaseNum = tempObj.phase?.slice(-1) || '1'
  let rewardZone = conflicts.find(x=>x?.zoneDefinition?.unlockRequirement?.requirementItem?.filter(y=>y.id === covertDef.zoneId).length > 0)?.zoneDefinition
  if(rewardZone?.nameKey) tempObj.rewardZone = lang[rewardZone.nameKey] || rewardZone.nameKey

  let requirements = getCampaign(convertCampain, campaignMapList, reqCategory)
  if(requirements) tempObj.requirements = requirements
  return tempObj
}
const mapFactions = (reqCategory, lang = {}, categoryList = [], unitList = [])=>{
  let res = {}
  for(let id of reqCategory){
    if(skipSet.has(id) || res[id]) continue
    let category = categoryList.find(x=>x.id === id), units = unitList.filter(x=>x.categoryId?.includes(id))
    if(!category?.id) continue

    res[id] = { id: id, nameKey: lang[category.descKey] || category.descKey, units : [] }
    if(units?.length > 0) res[id].units = units.map(x=>{ return { baseId: x.baseId, nameKey: lang[x.nameKey] || x.nameKey, combatType: x.combatType }})
  }
  return res
}
const mapFactionUnits = (data = {}, category = [], factions = {})=>{
  for(let i in category){
    if(!factions[category[i]]?.units) continue
    data.units = data?.units?.concat(factions[category[i]]?.units?.filter(x=>x.combatType === data.combatType))
  }
}
const mapRequiredUnits = (data = {}, requiredUnits = [], lang = {}, units = [])=>{
  for(let i in requiredUnits){
    if(data?.units.filter(x=>x.baseId === requiredUnits[i]).length > 0) continue
    let unit = units.find(x=>x.baseId === requiredUnits[i])
    if(!unit.nameKey) continue
    data.units.push({ baseId: unit.baseId, nameKey: lang[unit.nameKey] || unit.nameKey })
  }
}
const mapUnits = async(data = [], lang = {}, factions = {}, units = [])=>{
  for(let i in data){
    if(data[i]?.requirements?.category?.length > 0) mapFactionUnits(data[i].requirements, data[i]?.requirements?.category, factions)
    if(data[i]?.requirements?.requiredUnits?.length > 0) mapRequiredUnits(data[i].requirements, data[i]?.requirements?.requiredUnits, lang, units)
    if(data[i].id) await mongo.set('tbSpecialMission', { _id: data[i].id }, data[i])
  }
}
const mapTB = async(tbDef = {}, campaignList = [], unitList = [], categoryList = [], lang = {}, journeyGuides = [])=>{
  let campaign = campaignList.find(x=>x.id === tbDef.id)
  if(!campaign?.campaignMap) return

  let data = [], reqCategory = new Set()
  for(let i in tbDef.covertZoneDefinition){
    let sm = mapSpecialMission(tbDef.covertZoneDefinition[i].zoneDefinition, tbDef.covertZoneDefinition[i].campaignElementIdentifier, lang, tbDef.conflictZoneDefinition, campaign.campaignMap, reqCategory)
    if(!sm?.id) continue
    let rewardShard = tbDef.covertZoneDefinition[i]?.victoryReward?.find(x=>x.id?.includes('unitshard_'))?.id?.replace('unitshard_', '')
    if(rewardShard){
      let rewardUnit = unitList.find(x=>x.baseId === rewardShard)
      if(rewardUnit?.baseId) sm.rewardUnit = { baseId: rewardShard, nameKey: lang[rewardUnit.nameKey] || rewardUnit.nameKey }
    }
    sm.tbId = tbDef.id
    data.push(sm)
  }
  if(data?.length === 0) return

  let factions = mapFactions(reqCategory, lang, categoryList, unitList)
  await mapUnits(data, lang, factions, unitList)
  for(let i in data) journeyGuides.push(data[i])
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ tbList, campaignList, unitList, categoryList, lang ] = await Promise.all([
    getFile('territoryBattleDefinition', gameVersion),
    getFile('campaign', gameVersion),
    getFile('units', gameVersion),
    getFile('category', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])

  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)
  if(!tbList || !campaignList || !unitList || !categoryList || !lang) return
  let journeyGuides = []
  for(let i in tbList) await mapTB(tbList[i], campaignList, unitList, categoryList, lang, journeyGuides)
  let status = true
  if(journeyGuides.length > 0) status = await mapTBGuides(journeyGuides, lang, unitList)
  return status
}
