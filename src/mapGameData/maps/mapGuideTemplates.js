'use strict'
const mongo = require('mongoclient')

module.exports = async(journey = {})=>{
  if(!journey?.requirement || !journey?.requirement?.unit) return

  let units = Object.values(journey.requirement.unit)
  if(!units || units?.length == 0) return

  let guide = { name: journey.unitNameKey, descKey: journey?.nameKey, id: journey.baseId, units: [], factions: [], groups: [] }

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
    guide.units.push(unit)
  }
  if(guide.units.length > 0) await mongo.set('guideTemplates', {_id: guide.id }, guide)
}
