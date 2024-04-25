'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
const effectMap = require(`src/enums/effectMap`)
let langArray, abilityList, effectList, lang, effects, units, missingEffects
const CleanEffectName = (string)=>{
  if(string){
    string = string.replace('\\n', '')
    string = string.replace(/\[c\]/g, ' ')
    string = string.replace(/\[\/c]/g, '')
    string = string.replace(/\[-\]/g, '')
    string = string.replace(/\[\w{1,6}\]/g, '')
    return string.trim()
  }
}
const AddTags = async(unit, skill, tags = [])=>{
  try{
    let tempUnit = {
      nameKey: unit.nameKey,
      baseId: unit.baseId,
      combatType: unit.combatType,
      skillId: skill.id,
      skill: JSON.parse(JSON.stringify(skill))
    }
    for(let i in tags){
      if(tags[i].nameKey){
        if(skill.descKey.toLowerCase().includes(tags[i].nameKey.toLowerCase())){
          if(effects.filter(x=>x.nameKey === tags[i].nameKey).length === 0 && tags[i].persistentLocKey){
            let tempEffect = JSON.parse(JSON.stringify(tags[i]))
            tempEffect.id = tempEffect.persistentLocKey
            tempEffect.tags = []
            tempEffect.units = []
            effects.push(tempEffect)
          }
          let effect = effects.find(x=>x.nameKey === tags[i].nameKey)
          if(effect){
            if(effect.tags.filter(x=>x === tags[i].tag).length === 0) effect.tags.push(tags[i].tag)
            if(effect.units.filter(x=>x.skillId === skill.id).length === 0 )  effect.units.push(tempUnit)
          }
        }
        mongo.del('missingEffects', {_id: tags[i].tag})
      }else{
        if(missingEffects.filter(x=>x.tag === tags[i].tag).length === 0){
          let tempTag = JSON.parse(JSON.stringify(tags[i]))
          tempTag.units = []
          missingEffects.push(tempTag)
        }
        let effect = missingEffects.find(x=>x.tag === tags[i].tag)
        if(effect){
          if(effect.units.filter(x=>x.skillId === skill.id).length === 0)  effect.units.push(tempUnit)
        }
      }
    }
  }catch(e){
    throw(e)
  }
}
const CheckUnit = async(unit, abilityList, effectList)=>{
  try{
    if(unit.skills){
      for(let i in unit.skills){
        let tempSkill = await CheckSkill(unit.skills[i])
        if(tempSkill){
          tempSkill.unitNameKey = unit.nameKey
          tempSkill.unitBaseId = unit.baseId
          await mongo.set('mechanics', {_id: unit.skills[i].id}, tempSkill)
          if(tempSkill?.tags?.length > 0) await AddTags(unit, unit.skills[i], tempSkill.tags)
        }
      }
    }
  }catch(e){
    throw(e)
  }
}
const CheckSkill = async(skill)=>{
  try{
    if(skill){
      let ability = abilityList.find(x=>x.id === skill.abilityId);
      let tempSkill = JSON.parse(JSON.stringify(skill))
      tempSkill.icon = ability.icon
      tempSkill.cooldownType = ability.cooldownType
      tempSkill.cooldown = ability.cooldown
      tempSkill.tiers = []
      tempSkill.tags = []
      let baseTier = await CheckEffects(ability.effectReference, 0)
      if(baseTier) tempSkill.tiers.push(baseTier)
      if(baseTier?.tags?.length > 0) await MergeTags(tempSkill.tags, baseTier.tags)
      if(ability?.tier?.length > 0){
        for(let i in ability.tier){
          let tempTier = await CheckEffects(ability.tier[i].effectReference, (+i + 1))
          if(tempTier){
            tempTier.cooldownMaxOverride = ability.tier[i].cooldownMaxOverride
            tempSkill.tiers.push(tempTier)
            if(tempTier.tags?.length > 0) await MergeTags(tempSkill.tags, tempTier.tags)
          }
        }
      }
      return tempSkill
    }
  }catch(e){
    throw(e)
  }
}
const CheckEffects = async(effectReference, tier)=>{
  try{
    let res = {effects: [], tags: [], tier: tier}
    if(effectReference?.length > 0){
      for(let i in effectReference){
        let tempObj = await CheckEffect(effectReference[i].id)
        if(tempObj){
          res.effects.push(tempObj)
          if(tempObj.tags?.length > 0) res.tags = res.tags.concat(tempObj.tags)
        }
      }
    }
    return res
  }catch(e){
    throw(e)
  }
}
const CheckEffect = async(id)=>{
  try{
    let res
    let effect = effectList.find(x=>x.id === id)
    if(effect){
      res = JSON.parse(JSON.stringify(effect))
      res.effectReference = []
      res.tags = await CheckTags(effect)
      if(!res.tags) res.tags = []
      if(effect.effectReference?.length > 0){
        for(let i in effect.effectReference){
          let tempEffect = await CheckEffect(effect.effectReference[i].id)
          if(tempEffect){
            res.effectReference.push(tempEffect)
            if(tempEffect.tags.length > 0) res.tags = res.tags.concat(tempEffect.tags)
          }
        }
      }
    }
    return res
  }catch(e){
    throw(e)
  }
}
const CheckTags = async(effect)=>{
  try{
    let tags = []
    if(effect.descriptiveTag?.filter(x=>x.tag.startsWith('countable_')).length > 0){
      for(let i in effect.descriptiveTag){
        let tempTag = await CheckTag(effect.descriptiveTag[i].tag, effect)
        if(tempTag) tags.push(tempTag)
      }
    }
    return tags
  }catch(e){
    throw(e)
  }
}
const CheckTag = async(tag, effect)=>{
  try{
    if(tag && !tag.includes('ability') && !tag.includes('countable') && !tag.includes('clearable') && !tag.includes('featcounter') && !tag.startsWith('ai_') && tag !== 'buff' && tag !== 'debuff'){
      let tempTag = {
        tag: tag
      }
      if(effect.persistentIcon) tempTag.persistentIcon = effect.persistentIcon
      if(effect.persistentLocKey){
        tempTag.persistentLocKey = effect.persistentLocKey
      }else{
        let tempLocKeyName = 'BattleEffect_'+tag.replace('_buff','up').replace('_debuff','down').replace('special_')
        let tempLocKey = langArray.find(x=>x.toLowerCase() === tempLocKeyName.toLowerCase())
        if(tempLocKey){
          tempTag.persistentLocKey = tempLocKey
        }
      }

      if(!tempTag.persistentLocKey){
        if(effectMap && effectMap[tag]) tempTag.persistentLocKey = effectMap[tag]
      }

      let effectName = CleanEffectName(lang[tempTag.persistentLocKey]), tempName
      if(effectName) tempName = effectName.split(":")
      if(tempName){
        if(tempName[0]) tempTag.nameKey = tempName[0].trim()
        if(tempName[1]) tempTag.descKey = tempName[1].trim()
      }
      return tempTag
    }
  }catch(e){
    throw(e)
  }
}
const MergeTags = async(array = [], tags = [])=>{
  for(let i in tags){
    if(array.filter(x=>x.nameKey === tags[i].nameKey && x.tag === tags[i].tag).length === 0) array.push(tags[i])
  }
}
module.exports = async(errObj)=>{
  try{
    langArray = null,
    abilityList = null
    effectList = null
    lang = null
    effects = null
    units = null
    missingEffects = []
    lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    langArray = Object.keys(lang)
    effectList = await ReadFile(`${baseDir}/data/files/effect.json`)
    abilityList = await ReadFile(`${baseDir}/data/files/ability.json`)
    units = await mongo.find('units', {}, {portrait: 0, thumbnail: 0})
    effects = await mongo.find('effect', {}, {_id: 0, TTL:0})

    if(!effects) effects = []

    for(let i in lang){
      if(lang[i] && i.startsWith('BattleEffect_')){
        let effectName = CleanEffectName(lang[i]), tempName, nameKey, descKey
        if(effectName) tempName = effectName.split(":")
        if(tempName){
          if(tempName[0]) nameKey = tempName[0].trim()
          if(tempName[1]) descKey = tempName[1].trim()
        }
        if(nameKey){
          if(effects.filter(x=>x.nameKey === nameKey).length === 0){
            let tempObj = {
              id: i.trim(),
              nameKey: nameKey,
              descKey: descKey,
              locKeys: [],
              tags: [],
              units: []
            }
            tempObj.locKeys.push(i.trim())
            effects.push(tempObj)
          }else{
            effects.filter(x=>x.nameKey === nameKey)[0]?.locKeys?.push(i.trim())
          }
        }
      }
    }

    let tempObj
    for(let i in units) await CheckUnit(units[i], abilityList, effectList)
    let effectAutoComplete = []
    if(effects?.length > 0){
      for(let i in effects){
        await mongo.set('effects', {_id: effects[i].id}, effects[i])
        if(effects[i].nameKey && effects[i].units?.length > 0 && effects[i].id && effectAutoComplete.filter(x=>x.name === effects[i].nameKey).length === 0) effectAutoComplete.push({name: effects[i].nameKey, value: effects[i].id})
      }
    }
    if(effectAutoComplete?.length > 0){
      await mongo.set('autoComplete', {_id: 'effect'}, {include: true, data: effectAutoComplete})
      await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.effect': 'effect' })
    }
    if(missingEffects?.length > 0){
      for(let i in missingEffects){
        if(missingEffects[i].units?.length > 0) await mongo.set('missingEffects', {_id: missingEffects[i].tag}, missingEffects[i])
      }
    }
    langArray = null,
    abilityList = null
    effectList = null
    lang = null
    effects = null
    units = null
    missingEffects = null
    errObj.complete++
  }catch(e){
    throw(e)
  }
}
