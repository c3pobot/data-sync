'use strict'
const log = require('logger')
const path = require('path')
const fs = require('fs')
const DATA_PATH = process.env.DATA_PATH || path.join(baseDir, 'data', 'files')

const pct = require(`src/enums/pct`)
const enumOmicron = require(`src/enums/omicrons`)
const readFile = (file, version)=>{
  try{
    if(!file || !version) throw('readFile info not provided '+file+' '+version)
    let obj = fs.readFileSync(path.join(DATA_PATH, file))
    if(obj) obj = JSON.parse(obj)
    if(obj?.data && obj?.version && obj?.version === version) return obj.data
  }catch(e){
    log.error(e);
  }
}
const getAbillityDamage = async(abilityId, data = {})=>{
  try{
    let res = {}, tier = []
    if(!abilityId) throw ('abilityId missing in getAbillityDamage')
    let ability = data.abilityList.find(x=>x.id === abilityId)
    if(!ability) throw ('ability for '+abilityId+' not found in getAbillityDamage')
    tier.push({ effectReference: ability.effectReference })
    tier = tier.concat(ability.tier)
    for(let i in tier){
      let abilityTier = +i + 1
      let tempObj = await getEffectDamage(tier[i].effectReference.filter(x=>x.id.includes('damage')), data)
      if(tempObj?.length > 0) res[abilityTier] = { skillTier: abilityTier, damage: tempObj }
    }
    if(Object.values(res).length > 0) return res
  }catch(e){
    throw(e)
  }
}
const getCrewSkill = async(crew = [], data = {})=>{
  try{
    let res = {}, i = crew.length
    if(i === 0) return
    while(i--){
      let crewSkill = await getSkill(crew[i].skillReference, data)
      if(crewSkill) res = { ...res, ...crewSkill }
    }
    if(Object.values(res)?.length > 0) return res
  }catch(e){
    throw(e)
  }
}
const getDamageType = (param = [])=>{
  try{
    const enumDamageType = { MAX_HEALTH: 1, ATTACK_DAMAGE: 6, ABILITY_POWER: 7 }
    let res, i = param.length
    if(i === 0) return res
    while(i--){
      if(enumDamageType[param[i]]) res = enumDamageType[param[i]]
      if(res > 0) break;
    }
    return res
  }catch(e){
    throw(e)
  }
}
const getEffectDamage = async(effectReference = [], data = {})=>{
  try{
    let res = [], i = effectReference?.length
    if(i === 0) return
    while(i--){
      let effect = data.effectList?.find(x=>x.id === effectReference[i].id)
      if(!effect || (effect?.multiplierAmountDecimal === 0)) continue;
      let tempObj = {id: effect.id, multiplierAmountDecimal: effect.multiplierAmountDecimal}
      let damageType = await getDamageType(effect.param)
      if(damageType) tempObj.statId = damageType
      if(tempObj.statId) res.push(tempObj)
    }
    return res
  }catch(e){
    throw(e)
  }
}
const getOffenseStatId = async(abilityId, data = {})=>{
  try{
    if(!abilityId) throw('missing abilityId in getOffenseStatId')
    let ability = data.abilityList.find(x=>x.id === abilityId)
    if(!ability) throw('ability for '+abilityId+' not found in getOffenseStatId')
    let effects = ability.effectReference
    if(effects) effects = effects.filter(x=>x.id.includes('damage'))
    if(effects?.length === 0) return
    let pd = 0, sd = 0
    for(let i in effects){
      let effect = data.effectList.find(x=>x.id === effects[i].id && x.multiplierAmountDecimal > 0)
      if(effect?.param?.filter(x=>x === 'ATTACK_DAMAGE').length > 0) pd++
      if(effect?.param?.filter(x=>x === 'ABILITY_POWER').length > 0) sd++
    }
    if(pd === 0 && sd === 0) return
    if(sd > pd){
      return 7
    }else{
      return 6
    }
  }catch(e){
    throw(e)
  }
}
const getStatMap = (enums = {}, lang = {}, keyMapping = {})=>{
  try{
    const staticMap = {UNITSTATMASTERY: {nameKey: 'UNIT_STAT_STAT_VIEW_MASTERY'}}
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
  }catch(e){
    throw(e)
  }
}
const getSkill = async(skillReference = [], data = {})=>{
  try{
    let res = {}
    if(skillReference.length === 0) throw ('skillReference length is 0 for getSkill')
    for(let i in skillReference){
      if(!data.skillMap[skillReference[i].skillId]) throw('skill for '+skillReference[i].skillId+' not found for getSkill')
      res[skillReference[i].skillId] = JSON.parse(JSON.stringify(data.skillMap[skillReference[i].skillId]))
      let abilityDamage = await getAbillityDamage(data.skillMap[skillReference[i].skillId].abilityId, data)
      if(abilityDamage) res[skillReference[i].skillId].damage = abilityDamage
    }
    if(Object.values(res)?.length > 0) return res
  }catch(e){
    throw(e)
  }
}
const getSkillMap = (skillList, abilityList, lang, excludeDesc = false)=>{
  try{

    if(!abilityList || !skillList || !lang || skillList?.length === 0 || abilityList?.length === 0) throw ('missing data for getSkillMap')
    let list = {}, i = skillList?.length
    while(i--){
      let s = skillList[i]
      let ability = abilityList.find(x=>x.id === s.abilityReference)
      if(!ability || !lang[ability?.nameKey]) continue;
      let descKey = ability.descKey
      if(ability.tier?.length > 0 && ability.tier[ability.tier.length - 1]) descKey = ability.tier[ability.tier.length - 1].descKey;
      list[s.id] = {
        id: s.id,
        abilityId: ability.id,
        nameKey: lang[ability.nameKey],
        type: getSkillType(s.id),
        maxTier: +ability.tier?.length + 1,
        isZeta: false,
        isOmi: false,
        zetaTier: 0,
        omiTier: 0,
        omicronMode: s.omicronMode,
        omicronTypeNameKey: (enumOmicron[s.omicronMode] ? enumOmicron[s.omicronMode].nameKey:null),
        omicronType: (enumOmicron[s.omicronMode] ? enumOmicron[s.omicronMode].type:null)
      }
      if(!excludeDesc) list[s.id].descKey = lang[descKey] || descKey
      let t = s.tier.length
      while(t--){
        if(s.tier[t].isZetaTier && (list[s.id].zetaTier > +t || list[s.id].zetaTier === 0)){
          list[s.id].isZeta = true
          list[s.id].zetaTier = +t + 2;
        }
        if(s.tier[t].isOmicronTier && (list[s.id].omiTier > +t || list[s.id].omiTier === 0)){
          list[s.id].isOmi = true
          list[s.id].omiTier = +t + 2;
        }
      }
    }
    return list
  }catch(e){
    throw(e)
  }
}
const getSkillType = (id) =>{
  if(id.startsWith("basic")){
    return ("B")
  }else if(id.startsWith("special")){
    return ("S")
  }else if(id.startsWith("lead")){
    return ("L")
  }else if(id.startsWith("unique")){
    return ("U")
  }else if(id.startsWith("ultimate")){
    return ("ULT")
  }else{
    return ("None &nbsp;&nbsp;: ")
  }
}
const getUltimate = async(limitBreakRef = [], data = {}, excludeDesc = false)=>{
  try{
    let res = {}, i = limitBreakRef.length
    if(i === 0) return
    while(i--){
      let ability = data.abilityList.find(x=>x.id === limitBreakRef[i].abilityId)
      if(!ability || !data.lang[ability?.nameKey]) continue
      let descKey = ability.descKey
      if(ability.tier?.length > 0 && ability.tier[ability.tier.length - 1]) descKey = ability.tier[ability.tier.length - 1].descKey;
      res[ability.id] = {id: ability.id, nameKey: data.lang[ability.nameKey], type: 'ULT'}
      if(!excludeDesc) res[ability.id].descKey = data.lang[descKey] || descKey
      let abilityDamage = await getAbillityDamage(ability.id, data)
      if(abilityDamage) res[ability.id].damage = abilityDamage
    }
    if(Object.values(res).length > 0) return res
  }catch(e){
    throw(e);
  }
}
module.exports = {
  readFile: readFile,
  getCrewSkill: getCrewSkill,
  getOffenseStatId: getOffenseStatId,
  getSkill: getSkill,
  getSkillMap: getSkillMap,
  getStatMap: getStatMap,
  getUltimate: getUltimate
}
