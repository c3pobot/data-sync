'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getSkillList = require('./getSkillList')
const effectMap = require(`src/enums/effectMap`)
const manualLangMap = { BattleEffect_BonusTurn: 'Bonus Turn'}

const mapUnitSkill = (skillReference = [], skill = {}, skillList = {})=>{
  let i = skillReference.length
  while(i--){
    skill[skillReference[i].skillId] = skillList[skillReference[i].skillId]
  }
}
const mapUnits = (unitList = [], skillList = {}, lang = {})=>{
  if(!unitList || unitList?.length == 0) return
  let res = [], i = unitList.length
  while(i--){
    let tempObj = { baseId: unitList[i].baseId, skills: {}, combatType: unitList[i].combatType, nameKey: lang[unitList[i].nameKey] || unitList[i].nameKey }
    mapUnitSkill(unitList[i].skillReference, tempObj.skills, skillList)
    res.push(tempObj)
  }
  return res
}
const cleanEffectName = (string)=>{
  if(!string) return
  string = string.replace('\\n', '')
  string = string.replace(/\[c\]/g, ' ')
  string = string.replace(/\[\/c]/g, '')
  string = string.replace(/\[-\]/g, '')
  string = string.replace(/\[\w{1,6}\]/g, '')
  return string.trim()
}
const addTags = async(unit = {}, skill = {}, tags = [], effects)=>{
  let tempUnit = { nameKey: unit.nameKey, baseId: unit.baseId, combatType: unit.combatType, skillId: skill.id, skill: JSON.parse(JSON.stringify(skill)) }
  for(let i in tags){
    if(!tags[i].nameKey || !skill.descKey.toLowerCase().includes(tags[i].nameKey.toLowerCase())) continue
    if(!effects[tags[i].nameKey]){
      let tempEffect = JSON.parse(JSON.stringify(tags[i]))
      tempEffect.id = tempEffect.persistentLocKey
      tempEffect.tags = {}
      tempEffect.units = {}
      effects[tags[i].nameKey] = tempEffect
    }

    //let effect = effects.find(x=>x.nameKey === tags[i].nameKey)
    if(!effects[tags[i].nameKey]) continue

    if(!effects[tags[i].nameKey].units[skill.id]){
      if(!effects[tags[i].nameKey].savedToDb){
        await mongo.set('effects', { _id: effects[tags[i].nameKey].id }, { id: effects[tags[i].nameKey].id, nameKey: effects[tags[i].nameKey].nameKey, descKey: effects[tags[i].nameKey].descKey, locKeys: effects[tags[i].nameKey].locKeys })
        effects[tags[i].nameKey].savedToDb = true
      }
      effects[tags[i].nameKey].units[skill.id] = tempUnit
      await mongo.set('effects', { _id: effects[tags[i].nameKey].id }, { [`units.${skill.id}`]: tempUnit, [`tags.${tags[i].tag}`]: tags[i].tag })
    }
    //if(effect.tags.filter(x=>x === tags[i].tag).length === 0) effect.tags.push(tags[i].tag)
    //if(effect.units.filter(x=>x.skillId === skill.id).length === 0 )  effect.units.push(tempUnit)
  }
}
const checkUnit = async(unit, dataList, effects)=>{
  if(!unit.skills) return
  for(let i in unit.skills){
    let tempSkill = checkSkill(unit.skills[i], dataList, effects)
    if(tempSkill){
      tempSkill.unitNameKey = unit.nameKey
      tempSkill.unitBaseId = unit.baseId
      //mongo.set('mechanics', { _id: unit.skills[i].id }, JSON.parse(JSON.stringify(tempSkill)))
      if(tempSkill?.tags?.length > 0) await addTags(unit, unit.skills[i], tempSkill.tags, effects)
    }
  }
}
const checkSkill = (skill, dataList, effects)=>{
  if(!skill) return
  let ability = dataList.abilityList.find(x=>x.id === skill.abilityId);
  if(!ability) return
  let tempSkill = JSON.parse(JSON.stringify(skill))
  tempSkill.icon = ability.icon
  tempSkill.cooldownType = ability.cooldownType
  tempSkill.cooldown = ability.cooldown
  tempSkill.tiers = []
  tempSkill.tags = []
  let baseTier = checkEffects(ability.effectReference, 0, dataList)
  if(baseTier) tempSkill.tiers.push(baseTier)
  if(baseTier?.tags?.length > 0) mergeTags(tempSkill.tags, baseTier.tags)
  if(ability?.tier?.length == 0) return tempSkill
  for(let i in ability.tier){
    let tempTier = checkEffects(ability.tier[i].effectReference, (+i + 1), dataList)
    if(!tempTier) continue
    tempTier.cooldownMaxOverride = ability.tier[i].cooldownMaxOverride
    tempSkill.tiers.push(tempTier)
    if(tempTier.tags?.length > 0) mergeTags(tempSkill.tags, tempTier.tags)
  }
  return tempSkill
}
const checkEffects = (effectReference, tier, dataList)=>{
  let res = { effects: [], tags: [], tier: tier }
  if(effectReference?.length == 0) return res
  for(let i in effectReference){
    let tempObj = checkEffect(effectReference[i].id, dataList)
    if(!tempObj) continue
    res.effects.push(tempObj)
    if(tempObj.tags?.length > 0) res.tags = res.tags.concat(tempObj.tags)
  }
  return res
}
const checkEffect = (id, dataList)=>{
  let res
  let effect = dataList.effectList.find(x=>x.id === id)
  if(!effect) return
  res = JSON.parse(JSON.stringify(effect))
  res.effectReference = []
  res.tags = checkTags(effect, dataList)
  if(!res.tags) res.tags = []
  if(effect.effectReference?.length == 0) return res
  for(let i in effect.effectReference){
    let tempEffect = checkEffect(effect.effectReference[i].id, dataList)
    if(!tempEffect) continue
    res.effectReference.push(tempEffect)
    if(tempEffect.tags.length > 0) res.tags = res.tags.concat(tempEffect.tags)
  }
  return res
}
const checkTags = (effect, dataList)=>{
  let tags = []
  if(effect.descriptiveTag?.filter(x=>x.tag.startsWith('countable_') || x.tag.startsWith('armorshred_') || x.tag.startsWith('bonus_turn')).length == 0) return tags
  for(let i in effect.descriptiveTag){
    let tempTag = checkTag(effect.descriptiveTag[i].tag, effect, dataList)
    if(tempTag) tags.push(tempTag)
  }
  return tags
}
const checkTag = (tag, effect, dataList)=>{
  if(!tag || tag.includes('ability') || tag.includes('countable') || tag.includes('clearable') || tag.includes('featcounter') || tag.startsWith('ai_') || tag == 'buff' || tag == 'debuff') return
  let tempTag = { tag: tag }
  if(effect.persistentIcon) tempTag.persistentIcon = effect.persistentIcon
  if(effect.persistentLocKey){
    tempTag.persistentLocKey = effect.persistentLocKey
  }else{
    let tempLocKeyName = 'BattleEffect_'+tag.replace('_buff','up').replace('_debuff','down').replace('special_')
    let tempLocKey = dataList.langArray.find(x=>x.toLowerCase() === tempLocKeyName.toLowerCase())
    if(tempLocKey) tempTag.persistentLocKey = tempLocKey
  }

  if(!tempTag.persistentLocKey && effectMap[tag]) tempTag.persistentLocKey = effectMap[tag]

  let effectName = cleanEffectName(dataList.lang[tempTag.persistentLocKey] || manualLangMap[tempTag.persistentLocKey]), tempName
  if(effectName) tempName = effectName.split(":")
  if(tempName){
    if(tempName[0]) tempTag.nameKey = tempName[0].trim()
    if(tempName[1]) tempTag.descKey = tempName[1].trim()
  }
  return tempTag
}
const mergeTags = (array = [], tags = [])=>{
  for(let i in tags){
    if(array.filter(x=>x.nameKey === tags[i].nameKey && x.tag === tags[i].tag).length === 0) array.push(tags[i])
  }
}
const sleep = (ms = 5000)=>{
  return new Promise(resolve=>{
    setTimeout(resolve, ms)
  })
}
module.exports = async(gameVersion, localeVersion)=>{

  let [ lang, effectList, abilityList, unitList, skillList ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('effect', gameVersion),
    getFile('ability', gameVersion),
    getFile('units', gameVersion),
    getSkillList(gameVersion, localeVersion)
  ])

  if(!lang || !effectList || !abilityList || !unitList || !skillList) return

  let units = mapUnits(unitList.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0), skillList, lang)
  if(!units || units?.length == 0){
    units = null
    return
  }

  let langArray = Object.keys(lang), effects = {}
  if(!langArray) return
  let manualEffects = new Set(Object.values(effectMap))
  for(let i in lang){
    if(!lang[i] || (!i.startsWith('BattleEffect_') && !manualEffects?.has(i))) continue
    let effectName = cleanEffectName(lang[i]), tempName, nameKey, descKey
    if(effectName) tempName = effectName.split(":")
    if(tempName){
      if(tempName[0]) nameKey = tempName[0].trim()
      if(tempName[1]) descKey = tempName[1].trim()
    }

    if(!nameKey) continue
    if(!effects[nameKey]) effects[nameKey] = { id: i.trim(), nameKey: nameKey, descKey: descKey, locKeys: {}, tags: {}, units: {} }
    effects[nameKey].locKeys[i.trim()] = i.trim()
  }
  effects['Bonus Turn'] = { id: 'BattleEffect_BonusTurn', nameKey: 'Bonus Turn', descKey: 'Bonus Turn', tags: {}, units: {}, locKeys: { BattleEffect_BonusTurn: 'BattleEffect_BonusTurn'} }
  let array = [], dataList = { langArray: langArray, lang: lang, effectList: effectList, abilityList: abilityList, skillList: skillList }
  for(let i in units) await checkUnit(units[i], dataList, effects)
  /*
  //for(let i in units) array.push(checkUnit(units[i], dataList, effects))
  //await Promise.all(array)
  //effects = effects?.filter(x=>x.units && x.units?.length > 0 && x.nameKey && x.id)
  //log.info(`finished mapping ${effects?.length} effects. adding to database...`)
  //if(effects.length == 0) return

  let effectAutoComplete = [], count = 0
  for(let i in effects){
    if(effects[i].nameKey && effects[i].units?.length > 0 && effects[i].id){
      //array.push(mongo.set('effects', {_id: effects[i].id}, effects[i]))
      await mongo.set('effects', { _id: effects[i].id }, effects[i])
      if(effectAutoComplete.filter(x=>x.name === effects[i].nameKey).length === 0) effectAutoComplete.push({name: effects[i].nameKey, value: effects[i].id})
      count++
      await sleep()
    }
  }
  log.info(`added ${count} effects to the database...`)
  if(effectAutoComplete?.length > 0){
    //await mongo.set('autoComplete', { _id: 'effect' }, { include: true, data: effectAutoComplete })
    //await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.effect': 'effect' })
  }
  */
  return true
}
