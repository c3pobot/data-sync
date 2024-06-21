'use strict'
const mongo = require('mongoclient')
const mapFactionUnits = (unitList = [], reqFactions = []) =>{
  let res = {}
  for(let i in reqFactions){
    let units = unitList?.filter(x=>x.categoryId.includes(reqFactions[i].baseId))?.map(x=>x.baseId)
    if(!units || units?.length === 0) continue
    if(!res[reqFactions[i].baseId]) res[reqFactions[i].baseId] = { baseId: reqFactions[i].baseId, nameKey: reqFactions[i].nameKey, hidden: false, uiFilter: false, units: [], raidId: reqFactions[i].raidId }
    res[reqFactions[i].baseId].units = res[reqFactions[i].baseId].units.concat(units)
  }
  return Object.values(res)
}
const mapRaidFactions = (requirements = {}, raidDef = {}, reqFactions = {})=>{
  if(!requirements?.faction || requirements?.faction.length === 0) return
  for(let i in requirements?.faction){

    if(!reqFactions[requirements.faction[i]]) reqFactions[requirements.faction[i]] = { baseId: requirements.faction[i], nameKey: raidDef.nameKey, raidId: raidDef.baseId }
    if(!raidDef?.faction[requirements.faction[i]]) raidDef.faction[requirements.faction[i]] = {}
    raidDef.faction[requirements.faction[i]].baseId = requirements.faction[i]
    raidDef.faction[requirements.faction[i]].rarity = requirements.rarity
    raidDef.faction[requirements.faction[i]].tier = requirements.gear
    raidDef.faction[requirements.faction[i]].relic = requirements.relic
  }
}
const mapRaidMissions = (missions = [], raidDef = {}, reqFactions = {})=>{
  for(let i in missions) mapRaidFactions(missions[i].requirements, raidDef, reqFactions)
}
const mapGuideTemplate = async(raid = {})=>{
  let tempObj = { baseId: raid.baseId, name: raid.nameKey, descKey: raid.nameKey, factions: [], groups: [], units: [] }
  for(let i in raid.faction){
    let tempFaction = { baseId: i, rarity: raid.faction[i].rarity, gp: 0, numUnits: 0 }
    if(raid.faction[i].tier > 1){
      tempFaction.gear = { nameKey: `G${raid.faction[i]?.tier}`, name: 'gear', value: raid.faction[i]?.tier }
    }
    if(raid.faction[i]?.relic > 2){
      tempFaction.rarity = 7
      tempFaction.gear = { nameKey: `R${raid.faction[i]?.relic - 2}`, name: 'relic', value: raid.faction[i]?.relic }
    }
    tempObj.factions.push(tempFaction)
  }
  await mongo.set('guideTemplates', { _id: tempObj.baseId }, tempObj)
}
module.exports = async(raids = [], unitList = [])=>{
  let raidDef = {}, reqFactions = {}
  for(let i in raids){
    if(!raids[i].mission || raids[i]?.mission?.length === 0) continue
    if(!raidDef[raids[i].id]) raidDef[raids[i].id] = { baseId: raids[i].id, nameKey: raids[i].nameKey, unitNameKey: raids[i].nameKey, faction: {} }
    mapRaidMissions(raids[i].mission, raidDef[raids[i].id], reqFactions)
  }
  let factions = mapFactionUnits(unitList, Object.values(reqFactions))
  if(factions?.length > 0){
    for(let i in factions){
      await mongo.set('factions', { _id: factions[i].baseId }, factions[i])
      await mongo.set('raidFactions', { _id: factions[i].baseId }, factions[i])
    }
  }
  for(let i in raidDef){
    if(!raidDef[i].faction || Object.values(raidDef[i].faction).length == 0) continue
    raidDef[i].requirement = { faction: raidDef[i].faction }
    await mapGuideTemplate(raidDef[i])
    await mongo.set('journeyGuide', { _id: raidDef[i].baseId }, raidDef[i])
  }
}
