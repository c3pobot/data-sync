'use strict'
const mongo = require('mongoclient')

module.exports = async(missions = [], lang = {}, unitList = [])=>{
  if(missions.length === 0) return true
  for(let i in missions){
    let nameKey = missions[i].nameKey
    if(missions[i].rewardUnit?.nameKey) nameKey = missions[i].rewardUnit.nameKey
    if(missions[i].rewardZone) nameKey = `TB ${missions[i].rewardZone} Zone Unlock`
    if(!nameKey) continue
    let guide = { baseId: missions[i]?.rewardUnit?.baseId || missions[i].id, nameKey: nameKey, unitNameKey: nameKey }
    let guideTemplate = { baseId: guide.baseId, descKey: guide.nameKey, name: guide.nameKey, factions: [], groups: [], units: [] }
    if(!missions[i].rewardUnit || !missions[i].rewardZone){
      guide.hidden = true
      guideTemplate.hidden = true
    }
    let units = [], requiredUnits = [], requiredUnitsSet = new Set()
    let gearReq = {}
    if(missions[i].requirements?.relicTier > 0){
      gearReq = { nameKey: `R${missions[i].requirements?.relicTier}`, name: 'relic', value: missions[i].requirements?.relicTier + 2 }
    }else{
      if(missions[i].requirements?.tier) gearReq = { nameKey: `G${missions[i].requirements?.tier}`, name: 'gear', value: missions[i].requirements?.tier }
    }
    if(missions[i]?.requirements?.requiredUnits?.length > 0){
      for(let u in missions[i].requirements.requiredUnits){
        let baseId = missions[i].requirements.requiredUnits[u]
        let unit = unitList.find(x=>x.baseId === baseId)
        if(!unit?.baseId) continue
        let tempUnit = { baseId: baseId, nameKey: lang[unit.nameKey] || unit.nameKey, thumbnailName: unit.thumbnailName, rarity: missions[i].requirements?.rarity || 1, gp: missions[i].requirements?.gp || 0, gear: gearReq }
        requiredUnits.push(tempUnit)
        requiredUnitsSet.add(tempUnit.baseId)
      }
    }
    let numUnits = missions[i]?.requirements?.numUnits || 0
    if(requiredUnits?.length > 0) numUnits = numUnits - requiredUnits?.length
    if(numUnits < 0) numUnits = 0
    if(missions[i]?.requirements?.units?.length > 0){
      for(let u in missions[i]?.requirements?.units){
        let baseId = missions[i].requirements.units[u]?.baseId
        if(requiredUnitsSet.has(baseId)) continue
        let unit = unitList.find(x=>x.baseId === baseId)
        if(!unit?.baseId) continue
        let tempUnit = { baseId: baseId, nameKey: lang[unit.nameKey] || unit.nameKey, thumbnailName: unit.thumbnailName, rarity: missions[i].requirements?.rarity || 1, gp: missions[i].requirements?.gp || 0, gear: gearReq }
        units.push(tempUnit)
      }
    }
    if(requiredUnits?.length > 0) guideTemplate.units = requiredUnits
    if(units?.length > 0) guideTemplate.groups.push({ id: 'tbsmunits', rarity: missions[i].requirements?.rarity || 1, gp: missions[i].requirements?.gp || 0, numUnits: numUnits, units: units})
    await mongo.set('journeyGuide', { _id: guide.baseId }, guide)
    await mongo.set('guideTemplates', { _id: guideTemplate.baseId }, guideTemplate)
  }
  return true
}
