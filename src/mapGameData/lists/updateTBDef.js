'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
const GetPhase = (zoneId)=>{
  try{
    if(zoneId.includes('phase01_')) return 'P1'
    if(zoneId.includes('phase02_')) return 'P2'
    if(zoneId.includes('phase03_')) return 'P3'
    if(zoneId.includes('phase04_')) return 'P4'
    if(zoneId.includes('phase05_')) return 'P5'
    if(zoneId.includes('phase06_')) return 'P6'
  }catch(e){
    throw(e);
  }
}
const GetConflict = (zoneId)=>{
  try{
    if(zoneId.includes('_conflict01')) return 'C1'
    if(zoneId.includes('_conflict02')) return 'C2'
    if(zoneId.includes('_conflict03')) return 'C3'
    if(zoneId.includes('_conflict04')) return 'C4'
    if(zoneId.includes('_conflict05')) return 'C5'
    if(zoneId.includes('_conflict06')) return 'C6'
  }catch(e){
    throw(e);
  }
}
const GetType = (combatType, alignment)=>{
  try{
    if(combatType === 1) return 'Char'
    if(combatType === 2) return 'Ship'
    if(alignment === 1) return 'Mixed'
    if(alignment === 2) return 'LS'
    if(alignment === 3) return 'DS'
  }catch(e){
    throw(e);
  }
}
const GetSort = (type, conflict)=>{
  try{
    if(type === 'DS') return 1
    if(type === 'Mixed') return 2
    if(type === 'LS') return 3
    return +(conflict?.replace('C', ''))
  }catch(e){
    throw(e);
  }
}
module.exports = async(errObj)=>{
  try{

    let tbDef = await ReadFile(`${baseDir}/data/files/territoryBattleDefinition.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    let autocomplete = []
    for(let i in tbDef){
      tbDef[i].nameKey = lang[tbDef[i].nameKey] || tbDef[i].nameKey
      autocomplete.push({name: tbDef[i].nameKey, value: tbDef[i].id})
      for(let c in tbDef[i].conflictZoneDefinition){
        tbDef[i].conflictZoneDefinition[c].zoneDefinition.nameKey = lang[tbDef[i].conflictZoneDefinition[c].zoneDefinition?.nameKey] || tbDef[i].conflictZoneDefinition[c].zoneDefinition.nameKey
        tbDef[i].conflictZoneDefinition[c].zoneDefinition.phase = GetPhase(tbDef[i].conflictZoneDefinition[c].zoneDefinition.zoneId)
        tbDef[i].conflictZoneDefinition[c].zoneDefinition.conflict = GetConflict(tbDef[i].conflictZoneDefinition[c].zoneDefinition.zoneId)
        tbDef[i].conflictZoneDefinition[c].zoneDefinition.type = GetType(tbDef[i].conflictZoneDefinition[c].territoryBattleZoneUnitType, tbDef[i].conflictZoneDefinition[c].forceAlignment)
        tbDef[i].conflictZoneDefinition[c].zoneDefinition.sort = GetSort(tbDef[i].conflictZoneDefinition[c].zoneDefinition.type, tbDef[i].conflictZoneDefinition[c].zoneDefinition.conflict)
      }
      await mongo.set('tbDefinition', {_id: tbDef[i].id}, tbDef[i])
    }
    await mongo.set('autoComplete', {_id: 'tb-name'}, {data: autocomplete, include: true})
    errObj.complete++
  }catch(e){
    throw(e)
  }

}
