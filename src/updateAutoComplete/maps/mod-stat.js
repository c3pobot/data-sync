'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion, gameConfig = [])=>{

  if(gameConfig.length === 0) return

  let statsDef = (await mongo.find('configMaps', { _id: 'statDefMap' }))[0]?.data
  let modDef = (await mongo.find('configMaps', { _id: 'modDefMap' }))[0]?.data
  if(!statsDef || !modDef) return

  statsDef = Object.values(statsDef)
  if(!statsDef || statsDef.length == 0) return

  let statSet = new Set(), slotSet = new Set(), autoComplete = [], allowed = [], modSlots = []
  for(let i in modDef){
    if(!modDef[i].slotNameKey) continue
    if(slotSet.has(!modDef[i].slot)) continue
    modSlots.push(+modDef[i].slot)
    slotSet.add(modDef[i].slot)
  }
  if(!modSlots || modSlots?.length === 0) return

  for(let i in modSlots){
    let modConfig = gameConfig.find(x=>x.key == `stat-mod-slot0${+modSlots[i] - 1}-primary-stats-allowed`)
    if(!modConfig?.value) continue
    allowed = allowed.concat(modConfig.value.split(','))
  }
  if(!allowed || allowed.length == 0) return

  for(let i in allowed){
    let statDef = statsDef.find(x=>x.enum == `UNITSTAT${allowed[i].replace(/_/g, '')}`)
    if(!statDef?.nameKey) continue
    if(statSet.has(statDef.statId)) continue
    autoComplete.push({ name: statDef.nameKey, value: statDef.statId?.toString() })
    statSet.add(statDef.statId)
  }
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'mod-stat' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
