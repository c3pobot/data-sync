'use strict'
const nodeTypeSet = new Set([5,6,7,8,9])

const combineBattles = (battles = [])=>{
  if(!battles || battles?.length == 0) return []
  let data = {}
  for(let i in battles){
    let key = `${battles[i].count}`
    if(!data[key]) data[key] = { key: key, units: battles[i].units, count: battles[i].count, hard: [], normal: [], nameKey: battles[i].nameKey, type: battles[i].type }
    if(data[key][battles[i].type]) data[key][battles[i].type].push(battles[i].missionNameKey)
  }
  return Object.values(data)
}
const checkCampaignMap = (units = [], campaignInfo = {}, campaignMap = [], lang = {})=>{
  let battles = {}
  for(let i in campaignMap) checkCampaignNodeDifficultyGroup(units, battles, {...campaignInfo,...{ mapId: campaignMap[i].id }}, campaignMap[i].campaignNodeDifficultyGroup, lang)
  return combineBattles(Object.values(battles))
}
const checkCampaignNodeDifficultyGroup = (units = [], battles = {}, campaignInfo = {}, campaignNodeDifficultyGroup = [], lang = {})=>{
  for(let i in campaignNodeDifficultyGroup) checkCampaignNode(units, battles, {...campaignInfo,...{ nodeDifficulty: campaignNodeDifficultyGroup[i].campaignNodeDifficulty }}, campaignNodeDifficultyGroup[i].campaignNode, lang)
}
const checkCampaignNode = (units = [], battles = {}, campaignInfo = {}, campaignNode = [], lang = {})=>{
  for(let i in campaignNode) checkCampaignNodeMission(units, battles, {...campaignInfo,...{ campaignNodeId: campaignNode[i].id }},  campaignNode[i].campaignNodeMission, lang)
}
const checkCampaignNodeMission = (units = [], battles = {}, campaignInfo = {}, campaignNodeMission = [], lang = {})=>{
  for(let i in campaignNodeMission) checkEnemyUnitPreview(units, battles, {...campaignInfo,...{ campaignNodeNissionId: campaignNodeMission[i].id, missionNameKey: lang[campaignNodeMission[i].shortNameKey] }}, campaignNodeMission[i].enemyUnitPreview)
}
const checkEnemyUnitPreview = (units = [], battles = {}, campaignInfo = {}, enemyUnitPreview = [])=>{
  for(let i in enemyUnitPreview){
    let unit = units.find(x=>x.id == enemyUnitPreview[i]?.baseEnemyItem?.id)
    if(!unit?.id) continue

    let eventKey = `${campaignInfo.mapId}-${campaignInfo.nodeDifficulty}`
    let key = `${campaignInfo.mapId}-${campaignInfo.nodeDifficulty}-${campaignInfo.campaignNodeId}-${campaignInfo.campaignNodeNissionId}`
    if(!battles[key]) battles[key] = { id: key, eventKey: eventKey, units: [], count: 0, type: (campaignInfo.nodeDifficulty == 4 ? 'normal':'hard'), nameKey: campaignInfo.nameKey, missionNameKey: campaignInfo.missionNameKey?.replace('Battle', '')?.replace('-', '').trim()  }

    if(battles[key]?.units){
      battles[key].units.push(unit)
      battles[key].count++
    }
  }
}
module.exports = ( units = [], campaignList = [], lang = {}) =>{
  let data = []
  for(let i in campaignList){
    if(!nodeTypeSet.has(campaignList[i].campaignType)) continue
    let nameKey = lang[campaignList[i].nameKey]?.replace(/\\n/g, ' ')
    if(!nameKey) continue

    let battles = checkCampaignMap(units, { campaignId: campaignList[i].id, nameKey: nameKey }, campaignList[i].campaignMap, lang )
    if(!battles || battles?.length == 0) continue

    for(let b in battles){
      if(!battles[b].count) continue
      let battle = { nameKey: battles[b].nameKey, count: battles[b].count, nodes: '', hard: battles[b].hard, normal: battles[b].normal, units: battles[b].units }
      if(battle?.normal?.length > 0) battle.nodes += `Normal ${battle.normal?.join(', ')}\\n`
      if(battle?.hard?.length > 0) battle.nodes += `Hard ${battle.hard?.join(', ')}\\n`
      data.push(battle)
    }
  }
  return data
}
