'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getSkillList = require('./getSkillList')
const effectMap = require(`src/enums/effectMap`)

let langArray, abilityList, effectList, lang, effects, units, missingEffects
const mapUnitSkill = (skillReference = [], skill = {}, skillList = {})=>{
  let i = skillReference.length
  while(i--){
    skill[skillReference[i].skillId] = skillList[skillReference[i].skillId]
  }
}
const mapUnits = (unitList = [], skillList = {}, lang = {})=>{
  if(!unitList || unitList?.length == 0) return
  let res = [], i = unitsList.length
  while(i--){
    let tempObj = { baseId: units[i].baseId, skills: {}, nameKey: lang[units[i].nameKey] || units[i].nameKey }
    mapUnitSkill(units[i].skillReference, tempObj.skills, skillList)
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
const addTags = (unit = {}, skill = {}, tags = [])=>{
  let tempUnit = { nameKey: unit.nameKey, baseId: unit.baseId, combatType: unit.combatType, skillId: skill.id, skill: JSON.parse(JSON.stringify(skill)) }
  for(let i in tags){
    if(!tags[i].nameKey || !skill.descKey.toLowerCase().includes(tags[i].nameKey.toLowerCase())) continue
    if(effects.filter(x=>x.nameKey === tags[i].nameKey).length === 0 && tags[i].persistentLocKey){
      let tempEffect = JSON.parse(JSON.stringify(tags[i]))
      tempEffect.id = tempEffect.persistentLocKey
      tempEffect.tags = []
      tempEffect.units = []
      effects.push(tempEffect)
    }
    let effect = effects.find(x=>x.nameKey === tags[i].nameKey)
    if(!effect) continue
    if(effect.tags.filter(x=>x === tags[i].tag).length === 0) effect.tags.push(tags[i].tag)
    if(effect.units.filter(x=>x.skillId === skill.id).length === 0 )  effect.units.push(tempUnit)
  }
}
const checkUnit = (unit, abilityList, effectList)=>{
  if(!unit.skills) return
  for(let i in unit.skills){
    let tempSkill = checkSkill(unit.skills[i])
    if(tempSkill){
      tempSkill.unitNameKey = unit.nameKey
      tempSkill.unitBaseId = unit.baseId
      mongo.set('mechanics', { _id: unit.skills[i].id }, JSON.parse(JSON.stringify(tempSkill)))
      if(tempSkill?.tags?.length > 0) addTags(unit, unit.skills[i], tempSkill.tags)
    }
  }
}
const checkSkill = (skill)=>{
  if(!skill) return
  let ability = abilityList.find(x=>x.id === skill.abilityId);
  if(!ability) return
  let tempSkill = JSON.parse(JSON.stringify(skill))
  tempSkill.icon = ability.icon
  tempSkill.cooldownType = ability.cooldownType
  tempSkill.cooldown = ability.cooldown
  tempSkill.tiers = []
  tempSkill.tags = []
  let baseTier = checkEffects(ability.effectReference, 0)
  if(baseTier) tempSkill.tiers.push(baseTier)
  if(baseTier?.tags?.length > 0) mergeTags(tempSkill.tags, baseTier.tags)
  if(ability?.tier?.length == 0) return tempSkill
  for(let i in ability.tier){
    let tempTier = checkEffects(ability.tier[i].effectReference, (+i + 1))
    if(!tempTier) continue
    tempTier.cooldownMaxOverride = ability.tier[i].cooldownMaxOverride
    tempSkill.tiers.push(tempTier)
    if(tempTier.tags?.length > 0) await MergeTags(tempSkill.tags, tempTier.tags)
  }
  return tempSkill
}
const checkEffects = (effectReference, tier)=>{
  let res = { effects: [], tags: [], tier: tier }
  if(effectReference?.length == 0) return res
  for(let i in effectReference){
    let tempObj = checkEffect(effectReference[i].id)
    if(!tempObj) continue
    res.effects.push(tempObj)
    if(tempObj.tags?.length > 0) res.tags = res.tags.concat(tempObj.tags)
  }
  return res
}
const checkEffect = (id)=>{
  let res
  let effect = effectList.find(x=>x.id === id)
  if(!effect) return
  res = JSON.parse(JSON.stringify(effect))
  res.effectReference = []
  res.tags = checkTags(effect)
  if(!res.tags) res.tags = []
  if(effect.effectReference?.length == 0) return res
  for(let i in effect.effectReference){
    let tempEffect = checkEffect(effect.effectReference[i].id)
    if(!tempEffect) continue
    res.effectReference.push(tempEffect)
    if(tempEffect.tags.length > 0) res.tags = res.tags.concat(tempEffect.tags)
  }
  return res
}
const checkTags = (effect)=>{
  let tags = []
  if(effect.descriptiveTag?.filter(x=>x.tag.startsWith('countable_')).length == 0) return tags
  for(let i in effect.descriptiveTag){
    let tempTag = checkTag(effect.descriptiveTag[i].tag, effect)
    if(tempTag) tags.push(tempTag)
  }
  return tags
}
const checkTag = (tag, effect)=>{
  if(!tag || tag.includes('ability') || tag.includes('countable') || tag.includes('clearable') || tag.includes('featcounter') || tag.startsWith('ai_') || tag == 'buff' || tag == 'debuff') return
  let tempTag = { tag: tag }
  if(effect.persistentIcon) tempTag.persistentIcon = effect.persistentIcon
  if(effect.persistentLocKey){
    tempTag.persistentLocKey = effect.persistentLocKey
  }else{
    let tempLocKeyName = 'BattleEffect_'+tag.replace('_buff','up').replace('_debuff','down').replace('special_')
    let tempLocKey = langArray.find(x=>x.toLowerCase() === tempLocKeyName.toLowerCase())
    if(tempLocKey) tempTag.persistentLocKey = tempLocKey
  }

  if(!tempTag.persistentLocKey && effectMap[tag]) tempTag.persistentLocKey = effectMap[tag]

  let effectName = cleanEffectName(lang[tempTag.persistentLocKey]), tempName
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

module.exports = async(gameVersion, localeVersion)=>{
  langArray = null, abilityList = null, effectList = null, lang = null, effects = null, units = null

  let [ tempLang, tempEffectList, tempAbilityList, unitList, skillList ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('effect', gameVersion),
    getFile('ability', gameVersion),
    getFile('units', gameVersion),
    getSkillList(gameVersion, localeVersion)
  ])

  if(!tempLang || !tempEffectList || !tempAbilityList || !unitList || !skillList) return

  units = mapUnits(unitList.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0), skillList, tempLang)
  if(!units || units?.length == 0){
    units = null
    return
  }

  langArray = Object.keys(tempLang), abilityList = tempAbilityList, effectList = tempEffectList, lang = tempLang, effects = []
  if(!langArray) return

  for(let i in lang){
    if(!lang[i] || !i.startsWith('BattleEffect_')) continue
    let effectName = cleanEffectName(lang[i]), tempName, nameKey, descKey
    if(effectName) tempName = effectName.split(":")
    if(tempName){
      if(tempName[0]) nameKey = tempName[0].trim()
      if(tempName[1]) descKey = tempName[1].trim()
    }
    if(!nameKey) continue
    if(effects.filter(x=>x.nameKey === nameKey).length === 0){
      let tempObj = { id: i.trim(), nameKey: nameKey, descKey: descKey, locKeys: [], tags: [], units: [] }
      tempObj.locKeys.push(i.trim())
      effects.push(tempObj)
    }else{
      effects.filter(x=>x.nameKey === nameKey)[0]?.locKeys?.push(i.trim())
    }
  }

  let tempObj
  for(let i in units) checkUnit(units[i], abilityList, effectList)
  if(effects.length == 0) return
  let effectAutoComplete = [], i = effects.length, array = []
  while(i--){
    if(effects[i].nameKey && effects[i].units?.length > 0 && effects[i].id && effectAutoComplete.filter(x=>x.name === effects[i].nameKey).length === 0) effectAutoComplete.push({name: effects[i].nameKey, value: effects[i].id})
    array.push(mongo.set('effects', {_id: effects[i].id}, effects[i]))
  }
  await Promise.all(array)
  if(effectAutoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'effect' }, { include: true, data: effectAutoComplete })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.effect': 'effect' })
  }
  return true
}
