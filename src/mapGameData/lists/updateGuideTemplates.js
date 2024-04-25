'use strict'
const mongo = require('mongoclient')
const updateGuide = async(id)=>{
  if(!id) return
  let journey = (await mongo.find('journeyGuide', {_id: id}))[0]
  if(!journey?.requirement || !journey?.requirement?.unit) return

  let units = Object.values(journey.requirement.unit)
  if(!units || units?.length == 0) return
  let guide = { name: journey.unitNameKey, descKey: journey?.nameKey, id: id, units: [], factions: [], groups: [] }
  for(let i in units){
    let uInfo = (await mongo.find('units', { _id: units[i].baseId }, { thumbnailName: 1 }))[0]
    if(!uInfo?.thumbnailName) return
    let unit = {
      baseId: units[i].baseId,
      combatType: units[i].combatType,
      nameKey: units[i].nameKey,
      thumbnailName: uInfo.thumbnailName,
      rarity: units[i].rarity || 0
    }
    if(units[i].relic >= 1){
      unit.rarity = 7
      unit.gear = {
        nameKey: `R${units[i].relic}`,
        name: 'relic',
        value: units[i].relic + 2
      }
    }
    guide.units.push(unit)
  }
  await mongo.set('guideTemplates', {_id: id }, guide)
}
module.exports = async(errObj = {})=>{
  let journey = await mongo.find('journeyGuide', {}, {_id: 1})
  if(journey?.length == 0){
    errObj.complete++
    return
  }

  for(let i in journey){
    if(journey[i]?._id) await updateGuide(journey[i]._id)
  }
  errObj.complete++
}
