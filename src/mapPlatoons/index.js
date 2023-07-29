'use strict'
const getUnitList = require('./getUnitList')
let unitList = {}
const GetPhase = (zoneId)=>{
  try{
    if(zoneId.includes('phase01_')) return 'P1'
    if(zoneId.includes('phase02_')) return 'P2'
    if(zoneId.includes('phase03_')) return 'P3'
    if(zoneId.includes('phase04_')) return 'P4'
    if(zoneId.includes('phase05_')) return 'P5'
    if(zoneId.includes('phase06_')) return 'P6'
  }catch(e){
    console.error(e);
  }
}
const GetConflict = (zoneId)=>{
  try{
    if(zoneId.includes('conflict01')) return 'C1'
    if(zoneId.includes('conflict02')) return 'C2'
    if(zoneId.includes('conflict03')) return 'C3'
    if(zoneId.includes('conflict04')) return 'C4'
    if(zoneId.includes('conflict05')) return 'C5'
    if(zoneId.includes('conflict06')) return 'C6'
  }catch(e){
    console.error(e);
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
    console.error(e);
  }
}
const GetSquads = (squads = [], pDef = {}, rarity = 0, relicTier = 1)=>{
  try{
    let res = { points: +pDef.reward?.value || 0, id: pDef.id, units: []}
    for(let i in squads){
      for(let u in squads[i].unit){
        let unit = squads[i].unit[u]
        if(!unit.baseId) unit.baseId = unit.unitIdentifier?.split(':')[0]
        unit.unitIdentifier = unit.unitIdentifier?.split(':')[0]
        unit.nameKey = unitList[unit.baseId]?.name || unit.baseId
        unit.combatType = unitList[unit.baseId]?.combatType
        unit.rarity = rarity
        unit.unitRelicTier =  relicTier
        delete unit.memberId
        delete unit.tier
        delete unit.level
        res.units.push(unit)
      }
    }
    return res
  }catch(e){
    console.error(e);
  }
}
const GetSort = (type, conflict)=>{
  try{
    if(type === 'DS') return 1
    if(type === 'Mixed') return 2
    if(type === 'LS') return 3
    return +(conflict?.replace('C', ''))
  }catch(e){
    console.error(e);
  }
}
const MapPlatoons = async(tbData = {})=>{
  try{
    let platoons = {}
    const tbDef = (await mongo.find('tbDefinition', {_id: tbData.definitionId}, {nameKey: 1, reconZoneDefinition: 1, conflictZoneDefinition: 1, forceAlignment:1 }))[0]
    const locale = (await mongo.find('localeFiles', {_id: 'ENG_US'}))[0]
    //console.log('Creating Platoon Map for '+tbDef?.nameKey)
    if(tbDef?.reconZoneDefinition && tbData.reconZoneStatus){
      for(let i in tbData.reconZoneStatus){
        const pDef = tbDef?.reconZoneDefinition?.find(x=>x?.zoneDefinition?.zoneId === tbData.reconZoneStatus[i].zoneStatus?.zoneId)
        const zDef = tbDef?.conflictZoneDefinition?.find(x=>x?.zoneDefinition?.zoneId === pDef?.zoneDefinition?.linkedConflictId)
        let alignment = tbDef?.forceAlignment
        if(zDef?.forceAlignment > alignment) alignment = zDef.forceAlignment
        let phase = await GetPhase(tbData.reconZoneStatus[i].zoneStatus?.zoneId)
        let conflict = await GetConflict(tbData.reconZoneStatus[i].zoneStatus?.zoneId)
        let id = phase+'-' +conflict
        let type = await GetType(zDef?.combatType, alignment)
        let sort = await GetSort(type, conflict)
        if(!platoons[id]) platoons[id] = { id: id, phase: phase, conflict: conflict, squads: [], type: type, sort: sort, totalPoints: 0, maxUnit: pDef?.zoneDefinition?.maxUnitCountPerPlayer }
        if(!platoons[id].nameKey) platoons[id].nameKey = locale[pDef?.zoneDefinition?.nameKey] || pDef?.zoneDefinition?.nameKey
        for(let p in tbData.reconZoneStatus[i].platoon){
          const squad = await GetSquads(tbData.reconZoneStatus[i].platoon[p]?.squad, pDef?.platoonDefinition.find(x=>x?.id === tbData.reconZoneStatus[i].platoon[p]?.id), pDef?.unitRarity, pDef?.unitRelicTier)
          if(squad){
            platoons[id].totalPoints += squad.points || 0
            platoons[id].squads.push(squad)
          }
        }
      }
    }
    await mongo.set('tbPlatoons', {_id: tbData.definitionId}, {id: tbData.definitionId, nameKey: tbDef.nameKey, platoons: Object.values(platoons)})
  }catch(e){
    console.error(e);
  }
}
const SyncPlatoons = async()=>{
  try{
    unitList = await getUnitList()
    if(unitList && Object.values(unitList)?.length > 0){
      const tbs = (await mongo.find('autoComplete', {_id: 'tb-name'}))[0]
      if(tbs?.data?.length > 0){
        for(let i in tbs.data){
          const tbData = (await mongo.aggregate('tbCache', { definitionId: tbs.data[i].value }, [{ $sort: {currentRoundEndTime: -1} }, { $limit: 10 }]))[0]
          if(tbData?.definitionId && tbData.reconZoneStatus.filter(x=>x.platoon.length > 0).length === tbData.reconZoneStatus.length) await MapPlatoons(tbData)
        }
      }
    }
    unitList = {}
    setTimeout(SyncPlatoons, 30000)
  }catch(e){
    console.error(e);
    setTimeout(SyncPlatoons, 30000)
  }
}
module.exports = SyncPlatoons
