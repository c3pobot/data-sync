'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const getCampainBattles = require('./get_campain_battles')
const getEventBattles = require('./get_event_battles')
const mapFactions = require('./map_factions')
const mapQuestUnits = require('./map_quest_units')

const getUnits = (unitList = [], lang = {})=>{
  let units = {}
  for(let i of unitList){
    if(units[i.id]) continue
    units[i.id] = { 
        id: i.id, baseId: i.baseId, nameKey: lang[i.nameKey] || i.nameKey, categoryId: i.categoryId.filter(x=>!x.startsWith('selftag_')),
        5: { 4: [], 5: [] }, 6: { 4: [], 5: [] }, 7: { 4: [], 5: [] }, 8: { 4: [], 5: [] }, 9: { 4: [], 5: [] }, events: {}
    }
  }
  return Object.values(units)
}
const mapUnits = (unitList = [], lang = {})=>{
  let data = {}
  for(let i in unitList){
    if(data[unitList[i].baseId]) continue
    if(!lang[unitList[i].nameKey]) continue
    data[unitList[i].baseId] = { baseId: unitList[i].baseId, nameKey: lang[unitList[i].nameKey] }
  }
  return data
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ unitList, pveList, campaignList, categoryList, unitGuideList, lang ] = await Promise.all([
    getFile('units', gameVersion),
    getFile('units_pve', gameVersion),
    getFile('campaign', gameVersion),
    getFile('category', gameVersion),
    getFile('unitGuideDefinition', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  let unitMap = mapUnits(unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0), lang)
  let units = getUnits(pveList, lang)
  let campaignBattles = getCampainBattles(campaignList, lang)
  let eventBattles = getEventBattles(unitGuideList, campaignList?.find(x=>x.id == 'EVENTS')?.campaignMap, unitMap)
  let pve_battles = {}, faction_battles = {}
  for(let u of units){
    
    if(!pve_battles[u.baseId]){
        pve_battles[u.baseId] = JSON.parse(JSON.stringify(u))
        delete pve_battles[u.baseId].id
        delete pve_battles[u.baseId].categoryId
        pve_battles[u.baseId].count = 0
    }
    for(let c of campaignBattles){
        if(!c.campaignType || !c.campaignNodeDifficulty || !pve_battles[u.baseId][c.campaignType] || !pve_battles[u.baseId][c.campaignType][c.campaignNodeDifficulty]) continue
        
        let unit = c.pve_units?.find(x=>x.id == u.id)
        if(!unit || !unit.count) continue
        let data = { name: c.nodeNameKey, count: unit.count }
        pve_battles[u.baseId].count += unit.count
        pve_battles[u.baseId][c.campaignType][c.campaignNodeDifficulty].push(data)
        
    }
    for(let i of eventBattles){
      let unit = i.pve_units.find(x=>x.id == u.id)
      if(!unit || !unit.count) continue
      if(!pve_battles[u.baseId].events[i.unitBaseId]) pve_battles[u.baseId].events[i.unitBaseId] = { baseId: i.unitBaseId, nameKey: i.unitNameKey, tiers: [] }
      if(pve_battles[u.baseId].events[i.unitBaseId]?.tiers) pve_battles[u.baseId].events[i.unitBaseId].tiers.push({ id: i.tier, count: unit.count })
      pve_battles[u.baseId].count += unit.count
    }
    if(pve_battles[u.baseId].count){
      for(let c of u.categoryId){
        if(c == 'alignment_light' || c == 'alignment_dark') continue
        if(!faction_battles[c]) faction_battles[c] = { id: c, units: [] }
        if(faction_battles[c]?.units) faction_battles[c].units.push(u.baseId)
      }
    }
  }

  let questFactions = mapFactions(pve_battles, Object.values(faction_battles || {}))
  if(!questFactions || questFactions?.length == 0) return
  for(let i of questFactions) await mongo.set('questFactionList', { _id: i.id }, i)
    
  let questUnits = mapQuestUnits(Object.values(pve_battles || {}))
  if(!questUnits || questUnits?.length == 0) return
  for(let i of questUnits) await mongo.set('questUnitList', { _id: i.id }, i)
  return true
}