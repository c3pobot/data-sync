'use strict'
const mongo = require('mongoclient')

module.exports = async(journey = {})=>{
  if(!journey?.requirement || !journey?.requirement?.unit) return

  let units = Object.values(journey.requirement.unit)
  if(!units || units?.length == 0) return

  let guide = { name: journey.unitNameKey, descKey: journey?.nameKey, id: journey.baseId, units: [], factions: [], groups: [] }
  for(let i in units){
    let unit = { baseId: units[i].baseId, combatType: units[i].combatType, nameKey: units[i].nameKey, thumbnailName: units[i].thumbnailName, rarity: units[i].rarity || 0 }
    if(units[i].relic >= 1){
      unit.rarity = 7
      unit.gear = { nameKey: `R${units[i].relic}`, name: 'relic', value: units[i].relic + 2 }
    }
    guide.units.push(unit)
  }
  if(guide.units.length > 0) await mongo.set('guideTemplates', {_id: guide.id }, guide)
}
