'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const pct = require(`src/enums/pct`)

const getStatMap = (enums = {}, lang = {}, keyMapping = {})=>{
  const staticMap = { UNITSTATMASTERY: {nameKey: 'UNIT_STAT_STAT_VIEW_MASTERY'}}
  let keyMap = [], res = {}
  for(let i in keyMapping){
    if(i?.startsWith('UnitStat_')){
      let statKey = keyMapping[i].replace('__', '')
      keyMap.push({nameKey: keyMapping[i].replace('__', ''), enum: statKey.replace('UnitStat_', 'UNITSTAT').toUpperCase()})
    }
  }
  for(let i in enums){
    let key = keyMap.find(x=>x.enum.startsWith(i))
    if(!key) key = keyMap.find(x=>x.enum.startsWith(i.replace('UNITSTATMAX', 'UNITSTAT')))
    if(!key) key = staticMap[i]
    let nameKey = lang[key?.nameKey] || key?.nameKey
    if(!nameKey) nameKey = i
    res[enums[i]] = { statId: enums[i], pct: pct[enums[i]], enum: i, nameKey: nameKey,  }
  }
  if(Object.values(res)?.length > 0) return res
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ keyMapping, lang, enums ] = await Promise.all([
    getFile('Loc_Key_Mapping.txt', localeVersion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('enums', gameVersion)
  ])
  
  if(!keyMapping || !lang || !enums) return

  let statMap = getStatMap(enums['UnitStat'], lang, keyMapping)
  console.log(statMap)
  if(statMap){
    await mongo.set('configMaps', {_id: 'statDefMap'}, {gameVersion: gameVersion, localeVersion: localeVersion, data: statMap})
    return true
  }
}
