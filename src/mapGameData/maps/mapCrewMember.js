'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const mapCrew = (unit = {}, crewUnits = {})=>{
  if(unit.categoryId?.filter(x=>x === 'role_capital')?.length > 0) return
  if(!unit.crew || unit.crew?.length === 0) return

  for(let i in unit.crew){
    if(!unit.crew[i]?.unitId || crewUnits[unit.crew[i]?.unitId]) continue
    crewUnits[unit.crew[i].unitId] = unit.crew[i].unitId
  }
}
module.exports = async(gameVerion, localeVersion, assetVersion)=>{
  let unitList = await getFile('units', gameVerion)
  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0 && x.combatType === 2)
  if(!unitList || unitList?.length === 0) return

  let crewUnits = {}
  for(let i in unitList) mapCrew(unitList[i], crewUnits)
  let tempObj = { baseId: 'crew_member_manual', nameKey: 'Crew Member', uiFilter: true, units: Object.values(crewUnits) }
  await mongo.set('factions', { _id: 'crew_member_manual' }, tempObj)
  return true
}
