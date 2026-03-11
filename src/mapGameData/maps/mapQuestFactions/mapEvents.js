'use strict'
const eventTypeSet = new Set(['JOURNEY', 'LEGENDARY', 'EPIC', 'GALACTIC', 'MODS'])

const combineBattles = (battles = [])=>{
  if(!battles || battles?.length == 0) return []
  let data = {}
  for(let i in battles){
    let key = `${battles[i].eventKey}-${battles[i].count}`
    if(!data[key]) data[key] = { units: battles[i].units, count: battles[i].count, tiers: [], nameKey: battles[i].unitNameKey }
    if(data[key]?.tiers) data[key].tiers.push(battles[i].eventTier)
  }
  return Object.values(data)
}

const checkCampaignNodeDifficultyGroup = (units = [], campaignInfo = {}, campaignNodeDifficultyGroup = [], unitMap = {}, unitGuideList = [])=>{
  let battles = {}
  for(let i in campaignNodeDifficultyGroup) checkCampaignNode(units, battles, {...campaignInfo,...{ nodeDifficulty: campaignNodeDifficultyGroup[i].campaignNodeDifficulty }}, campaignNodeDifficultyGroup[i].campaignNode, unitMap, unitGuideList)
  return combineBattles(Object.values(battles))
}
const checkCampaignNode = (units = [], battles = {}, campaignInfo = {}, campaignNode = [], unitMap = {}, unitGuideList = [])=>{
  for(let i in campaignNode) checkCampaignNodeMission(units, battles, {...campaignInfo,...{ campaignNodeId: campaignNode[i].id }},  campaignNode[i].campaignNodeMission, unitMap, unitGuideList)
}
const checkCampaignNodeMission = (units = [], battles = {}, campaignInfo = {}, campaignNodeMission = [], unitMap = {}, unitGuideList = [])=>{
  for(let i in campaignNodeMission) checkEnemyUnitPreview(units, battles, {...campaignInfo,...{ campaignNodeNissionId: campaignNodeMission[i].id }}, campaignNodeMission[i].enemyUnitPreview, unitMap, unitGuideList)
}
const checkEnemyUnitPreview = (units = [], battles = {}, campaignInfo = {}, enemyUnitPreview = [], unitMap = {}, unitGuideList = [])=>{
  for(let i in enemyUnitPreview){
    let unit = units.find(x=>x.id == enemyUnitPreview[i]?.baseEnemyItem?.id)
    if(!unit?.id) continue

    let unitGuide = unitGuideList.find(x=>x?.campaignElementIdentifier?.campaignId == 'EVENTS' && x?.campaignElementIdentifier?.campaignNodeId == campaignInfo.campaignNodeId)
    if(!unitGuide?.unitBaseId) continue

    let eventKey = `${campaignInfo.mapId}-${campaignInfo.nodeDifficulty}-${campaignInfo.campaignNodeId}`
    let key = `${campaignInfo.campaignId}-${campaignInfo.mapId}-${campaignInfo.nodeDifficulty}-${campaignInfo.campaignNodeId}-${campaignInfo.campaignNodeNissionId}`
    if(!battles[key]) battles[key] = { id: key, eventKey: eventKey, units: [], count: 0, eventTier:  campaignInfo.campaignNodeNissionId?.replace('TIER0', ''), unitNameKey: unitMap[unitGuide.unitBaseId]?.nameKey }

    if(battles[key]?.unitNameKey){
      battles[key].units.push(unit)
      battles[key].count++
    }
  }
}
module.exports = (units = [], campaignMap = [], unitGuideList = [], unitMap = {})=>{
  let data = []
  for(let i in campaignMap){
    if(!eventTypeSet.has(campaignMap[i].id)) continue
    let battles = checkCampaignNodeDifficultyGroup(units, { campaignId: campaignMap[i].id, mapId: campaignMap[i].id }, campaignMap[i].campaignNodeDifficultyGroup, unitMap, unitGuideList)
    if(battles?.length == 0) continue

    for(let b in battles){
      if(!battles[b].count) continue
      let battle = { nameKey: `${campaignMap[i].id} ${battles[b].nameKey}`, count: battles[b].count, nodes: '', tiers: battles[b].tiers, units: battles[b].units }
      if(battle?.tiers?.length > 0) battle.nodes += `\nTier(s) ${battle.tiers?.join(', ')}`
      data.push(battle)
    }
  }
  return data
}
