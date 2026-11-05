'use strict'
const mongo = require('mongoclient')

function getUnits(tier = {}, tempUnits = {}, tempFaction = {}, base_id){
  if(tier?.unit){
    for(let i in tier.unit){
      if(!tier.unit[i]?.baseId) continue
      if(!tempUnits[tier.unit[i].baseId]){
        tempUnits[tier.unit[i].baseId] = JSON.parse(JSON.stringify(tier.unit[i]))
        tempUnits[tier.unit[i].baseId].rarity = 0
        tempUnits[tier.unit[i].baseId].rTier = 0
        tempUnits[tier.unit[i].baseId].gTier = 0
        tempUnits[tier.unit[i].baseId].gp = 0
      }
      if(tier.rarity > tempUnits[tier.unit[i].baseId].rarity) tempUnits[tier.unit[i].baseId].rarity = tier.rarity
      if(tier.relic > tempUnits[tier.unit[i].baseId].rTier) tempUnits[tier.unit[i].baseId].rTier = tier.relic
      if(tier.tier > tempUnits[tier.unit[i].baseId].gTier) tempUnits[tier.unit[i].baseId].gTier = tier.tier
      if(tier.gp > tempUnits[tier.unit[i].baseId].gp) tempUnits[tier.unit[i].baseId].gp = tier.gp
    }
  }
  if(tier?.faction){
    for(let i in tier.faction){
      if(!tier.faction[i]) continue
      if(!tempFaction[tier.faction[i].baseId]){
        tempFaction[tier.faction[i].baseId] = JSON.parse(JSON.stringify(tier.faction[i]))
        tempFaction[tier.faction[i].baseId].rarity = 0
        tempFaction[tier.faction[i].baseId].rTier = 0
        tempFaction[tier.faction[i].baseId].gTier = 0
        tempFaction[tier.faction[i].baseId].gp = 0
        tempFaction[tier.faction[i].baseId].numUnits = 0
        delete tempFaction[tier.faction[i].baseId].units
      }
      if(tier.rarity > tempFaction[tier.faction[i].baseId].rarity) tempFaction[tier.faction[i].baseId].rarity = tier.rarity
      if(tier.relic > tempFaction[tier.faction[i].baseId].rTier) tempFaction[tier.faction[i].baseId].rTier = tier.relic
      if(tier.tier > tempFaction[tier.faction[i].baseId].gTier) tempFaction[tier.faction[i].baseId].gTier = tier.tier
      if(tier.gp > tempFaction[tier.faction[i].baseId].gp) tempFaction[tier.faction[i].baseId].gp = tier.gp
      if(tier.unitCount > tempFaction[tier.faction[i].baseId].numUnits) tempFaction[tier.faction[i].baseId].numUnits = tier.unitCount
    }
  }
}
function getTiers(tier = [], units = [], factions = [], base_id){
  if(!tier || tier?.length == 0) return
  let tempUnits = {}, tempFaction = {}
  for(let i of tier) getUnits(i, tempUnits, tempFaction, base_id)
  
  for(let i in tempUnits){
    if(!tempUnits[i]) continue
    let unit = tempUnits[i]
    if(unit.rTier > 2){
      unit.relic = unit.rTier - 2
    }else{
      unit.tier = unit.gTier
    }
    delete unit.rTier
    delete unit.gTier
    units.push(unit)
  }
  for(let i in tempFaction){
    if(!tempFaction[i]) continue
    let faction = tempFaction[i]
    if(faction.rTier > 2){
      let relic_level = faction.rTier - 2
      faction.gear = { nameKey: `R${relic_level}`, name: 'relic', value: relic_level + 2 }
      let tempRarity = 0
      if(relic_level >= 2) tempRarity = 4
      if(relic_level >= 3) tempRarity = 5
      if(relic_level >= 5) tempRarity = 6
      if(relic_level >= 6) tempRarity = 7
      if(tempRarity > faction.rarity) faction.rarity = tempRarity
    }else{
      if(faction.gTier > 1) faction.gear = { nameKey: `G${faction.gTier}`, name: 'gear', value: faction.gTier }
    }
    delete faction.rTier
    delete faction.gTier
    factions.push(faction)
  }
}
module.exports = async(journey = {})=>{
  let units = Object.values(journey.requirement.unit || {}), factions = []
  if(!units || units?.length == 0){
    getTiers(Object.values(journey.tier || {}), units, factions, journey.baseId )
  }
  
  let guide = { name: journey.unitNameKey, descKey: journey?.nameKey, id: journey.baseId, units: [], factions, groups: [] }

  if(units?.length > 0){
    for(let i in units){
      let unitRarity = units[i].rarity || journey?.requirement?.rarity
      let unit = { baseId: units[i].baseId, combatType: units[i].combatType, nameKey: units[i].nameKey, thumbnailName: units[i].thumbnailName, rarity: unitRarity || 0 }

      if(units[i].relic >= 1){
        unit.gear = { nameKey: `R${units[i].relic}`, name: 'relic', value: units[i].relic + 2 }
        let tempRarity = 0
        if(units[i].relic >= 2) tempRarity = 4
        if(units[i].relic >= 3) tempRarity = 5
        if(units[i].relic >= 5) tempRarity = 6
        if(units[i].relic >= 6) tempRarity = 7

        if(tempRarity > unit.rarity) unit.rarity = tempRarity
      }
      if(units[i].tier >= 0) unit.gear = { nameKey: `G${units[i].tier}`, name: 'gear', value: units[i].tier }
      if(units[i].era_level > 0) unit.era_level = units[i].era_level
      guide.units.push(unit)
    }
  }
  
  if(guide.units.length > 0 || guide.factions?.length > 0) await mongo.set('guideTemplates', {_id: guide.id }, guide)
}
