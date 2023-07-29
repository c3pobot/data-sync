'use strict'
const ReadFile = require('./readFile')
const GetSkillList = require('./getSkillList')
const GetFactionList = require('./getFactionList')
const GetImages = require('../getImages')
const enumOmicron = require('./enumOmicron')
const OmiType = (descKey)=>{
  try{
    if(descKey){
      if(descKey.includes('Grand Arenas')) return('ga')
      if(descKey.includes('Territory Wars')) return('tw')
      if(descKey.includes('Territory Battles')) return('tb')
    }
  }catch(e){
    console.error(e)
  }
}
const AddOmi = async(baseId, nameKey, skill)=>{
  try{
    const tempObj = JSON.parse(JSON.stringify(skill))
    tempObj.unitBaseId = baseId
    tempObj.unitNameKey = nameKey
    mongo.set('omicronList', {_id: tempObj.id}, tempObj)
  }catch(e){
    console.error(e)
  }
}
const SaveUnits = async()=>{
  try{
    let units = await ReadFile(baseDir+'/data/files/units.json')
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    for(let i in units){
      if(lang[units[i].nameKey]) units[i.nameKey] = lang[units[i].nameKey]
      await mongo.set('unitList', {_id: units[i].id}, units[i])
    }
    units = null,
    lang = null
    console.log('Saved all units to db ...')
  }catch(e){
    console.error(e);
  }
}
const GetOffenseStat = async(baseId)=>{
  try{
    let res = 6, pd = 0, sd = 0, basicSkill
    let ability = (await mongo.find('skills', {_id: baseId}, {skills: {abilityId: 1, skillId: 1, abilityDamage: 1}}))[0]
    if(ability?.skills?.length > 0) basicSkill = ability.skills.find(x=>x.abilityId?.startsWith('basic'))
    if(basicSkill?.abilityDamage?.length > 0){
      pd = +basicSkill.abilityDamage.filter(x=>x.param?.filter(y=>y === 'ATTACK_DAMAGE').length > 0).length || 0
      sd = +basicSkill.abilityDamage.filter(x=>x.param?.filter(y=>y === 'ABILITY_POWER').length > 0).length || 0
    }
    if(sd > pd) res = 7
    return res
  }catch(e){
    console.error(e);
  }
}
module.exports = async(errObj, assetVersion)=>{
  try {
    console.log('Updating units and factions ...')
    let skillList = await GetSkillList(errObj)
    let factionList = await GetFactionList(errObj)
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let obj = await ReadFile(baseDir+'/data/files/units.json')
    let ability = await ReadFile(baseDir+'/data/files/ability.json')
    if(skillList && factionList && lang && obj && ability){
      obj = obj.filter(u=>u.rarity == 7 && u.obtainable == true && u.obtainableTime == 0)
      const unitsAutoComplete = []
      const factionAutoComplete = []
      let images = []
      for(let u in obj){
        const offenseStatId = await GetOffenseStat(obj[u].baseId)
        const isGl = obj[u].categoryId.find(x=>x === 'galactic_legend') ? true:false
        const alignment = obj[u].categoryId.find(x=>x?.startsWith('alignment_'))
        images.push(obj[u].thumbnailName)
        unitsAutoComplete.push({
          name: lang[obj[u].nameKey],
          value: obj[u].baseId,
          baseId: obj[u].baseId,
          combatType: obj[u].combatType,
          thumbnailName: obj[u].thumbnailName,
          alignment: alignment,
          isGL: isGl,
          offenseStatId: offenseStatId
        })
        const tempObj = {
          baseId: obj[u].baseId,
          nameKey: lang[obj[u].nameKey],
          combatType: obj[u].combatType,
          thumbnailName: obj[u].thumbnailName,
          categoryId: obj[u].categoryId,
          alignment: alignment,
          skills:{},
          ultimate:{},
          faction:{},
          isGL: isGl,
          offenseStatId: offenseStatId
        }

        if(obj[u].combatType == 2 && obj[u].crew && obj[u].crew.length > 0) tempObj.crew = obj[u].crew.map(x=>x.unitId)
        for(let s in obj[u].skillReference){
          tempObj.skills[obj[u].skillReference[s].skillId] = skillList[obj[u].skillReference[s].skillId]
          if(skillList[obj[u].skillReference[s].skillId]?.omiTier) AddOmi(obj[u].baseId, lang[obj[u].nameKey], skillList[obj[u].skillReference[s].skillId])
        }
        if(+obj[u].combatType == 2) {
          for(let l in obj[u].crew){
            obj[u].crew[l].skillReference.forEach(s=>{
              tempObj.skills[s.skillId] = skillList[s.skillId]
            })
          }
        }
        for(let f in obj[u].categoryId){
          if(factionList[obj[u].categoryId[f]]?.units?.filter(x=>x === obj[u].baseId).length == 0) factionList[obj[u].categoryId[f]].units.push(obj[u].baseId)
          tempObj.faction[obj[u].categoryId[f]] = 1
        }
        if(obj[u].limitBreakRef.filter(x=>x.powerAdditiveTag === 'ultimate').length > 0 && obj[u].legend){
          for(let t in obj[u].limitBreakRef){
            if(obj[u].limitBreakRef[t].powerAdditiveTag === 'ultimate'){
              const ultAbility = ability.find(x=>x.id == obj[u].limitBreakRef[t].abilityId)
              tempObj.ultimate[ultAbility.id] = {
                id: ultAbility.id,
                nameKey: lang[ultAbility.nameKey],
                descKey: (lang[ultAbility.id.toUpperCase()+'_DESC'] ? lang[ultAbility.id.toUpperCase()+'_DESC']:null)
              }
            }
          }
        }
        await mongo.set('units', {_id: obj[u].baseId}, tempObj)
      }
      for(let i in factionList){
        if(!factionList[i].baseId.startsWith('special') && factionList[i].nameKey && factionList[i].nameKey != 'Placeholder' && factionList[i].uiFilter){
          factionAutoComplete.push({
            name: factionList[i].nameKey,
            value: factionList[i].baseId
          })
          mongo.set('factions', {_id: factionList[i].baseId}, factionList[i])
          //await redis.set('fn-'+factionList[i].baseId, factionList[i])
        }else{
          if(factionList[i].baseId) mongo.set('hiddenFactions', {_id: factionList[i].baseId}, {baseId: factionList[i].baseId, nameKey: factionList[i].nameKey, units: factionList[i].units})
        }
      }
      await mongo.set('autoComplete', {_id: 'unit'}, {include: true, data: unitsAutoComplete})
      await mongo.set('autoComplete', {_id: 'faction'}, {include: true, data: factionAutoComplete})
      skillList = null
      factionList = null
      obj = null
      lang = null
      errObj.complete++
      if(images?.length){
        GetImages(images, assetVersion, 'thumbnail', 'unitList-thumbnail')
        GetImages(images, assetVersion, 'portrait', 'unitList-portrait')
      }
      SaveUnits()
      return
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    console.error(e)
    errObj.error++
  }
}
