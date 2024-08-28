'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const getPhase = (zoneId)=>{
  if(zoneId.includes('phase01_')) return 'P1'
  if(zoneId.includes('phase02_')) return 'P2'
  if(zoneId.includes('phase03_')) return 'P3'
  if(zoneId.includes('phase04_')) return 'P4'
  if(zoneId.includes('phase05_')) return 'P5'
  if(zoneId.includes('phase06_')) return 'P6'
}
const getConflict = (zoneId)=>{
  if(zoneId.includes('_conflict01')) return 'C1'
  if(zoneId.includes('_conflict02')) return 'C2'
  if(zoneId.includes('_conflict03')) return 'C3'
  if(zoneId.includes('_conflict04')) return 'C4'
  if(zoneId.includes('_conflict05')) return 'C5'
  if(zoneId.includes('_conflict06')) return 'C6'
}
const getType = (combatType, alignment)=>{
  if(combatType === 1) return 'Char'
  if(combatType === 2) return 'Ship'
  if(alignment === 1) return 'Mixed'
  if(alignment === 2) return 'LS'
  if(alignment === 3) return 'DS'
}
const getSort = (type, conflict)=>{
  if(type === 'DS') return 1
  if(type === 'Mixed') return 2
  if(type === 'LS') return 3
  return +(conflict?.replace('C', ''))
}
const mapZoneDefinition = (zoneDefinition = {}, territoryBattleZoneUnitType, forceAlignment, lang = {})=>{
  zoneDefinition.nameKey = lang[zoneDefinition?.nameKey] || zoneDefinition.nameKey
  zoneDefinition.phase = getPhase(zoneDefinition.zoneId)
  zoneDefinition.conflict = getConflict(zoneDefinition.zoneId)
  zoneDefinition.type = getType(territoryBattleZoneUnitType, forceAlignment)
  zoneDefinition.sort = getSort(zoneDefinition.type, zoneDefinition.conflict)
}
const mapTBDef = async(tbDef = {}, lang = {}, autoComplete = [])=>{
  if(!tbDef.id) return
  tbDef.nameKey = lang[tbDef.nameKey] || tbDef.nameKey
  if(tbDef.conflictZoneDefinition?.length > 0){
    let i = tbDef.conflictZoneDefinition.length
    while(i--) mapZoneDefinition(tbDef.conflictZoneDefinition[i].zoneDefinition, tbDef.conflictZoneDefinition[i].territoryBattleZoneUnitType, tbDef.conflictZoneDefinition[i].forceAlignment, lang)
  }
  let tbHistory = { id: tbDef.id, nameKey: tbDef.nameKey, stats: {}}
  tbDef.statCategory?.map(x=>{ tbHistory.stats[x.id] = { id: x.id, nameKey: lang[x.nameKey] || x.nameKey } })
  await mongo.set('tbHistoryDef', { _id: tbDef.id }, tbHistory)
  await mongo.set('tbDefinition', {_id: tbDef.id}, tbDef)
  autoComplete.push({ name: tbDef.nameKey, value: tbDef.id })
}
module.exports = async(gameVersion, localeVersion)=>{
  try{
    let [ territoryBattleDefinitionList, lang ] = await Promise.all([
      getFile('territoryBattleDefinition', gameVersion),
      getFile('Loc_ENG_US.txt', localeVersion)
    ])
    if(!territoryBattleDefinitionList || !lang) return

    let autoComplete = [], i = territoryBattleDefinitionList.length, array = []
    while(i--) array.push(mapTBDef(territoryBattleDefinitionList[i], lang, autoComplete))
    await Promise.all(array)
    if(autoComplete.length > 0) await mongo.set('autoComplete', {_id: 'tb-name'}, {data: autoComplete, include: true})
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.tb-name': 'tb-name', 'data.ga-date': 'ga-date' })
    return true
  }catch(e){
    throw(e)
  }

}
