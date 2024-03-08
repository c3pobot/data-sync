'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
let lang, skillList, abilityList, unitsList, effectList
const IndexUnitSkills = (unit = {})=>{
  try{
    let res = {baseId: unit.baseId, nameKey: lang[unit.nameKey], skills: [], ultimate: []}
    if(unit.skillReference?.length > 0){
      res.skills = unit.skillReference.reduce((a,v)=>({...a, [v.skillId]:{skillId: v.skillId}}), {})
    }
    if(unit.crew?.length > 0){
      for(let i in unit.crew){
        res.skills = unit.crew[i].skillReference.reduce((a,v)=>({...res.skills, [v.skillId]:{skillId: v.skillId}}), {})
      }
    }
    let ultimateArray = unit.limitBreakRef.filter(x=>x.abilityId.startsWith('ultimate'))
    ultimateArray = ultimateArray.concat(unit.uniqueAbilityRef.filter(x=>x.abilityId.startsWith('ultimate')))
    res.ultimate = ultimateArray.reduce((a,v)=>({...a, [v.abilityId]:{abilityId: v.abilityId}}), {})
    return res;
  }catch(e){
    throw(e);
  }
}
const IndexUnits = async()=>{
  try {
    if(unitsList?.length > 0){
      let units = unitsList.filter(u => {
          if( parseInt(u.rarity) !== 7 ) return false
          if( u.obtainable !== true ) return false
          if( parseInt(u.obtainableTime) !== 0 ) return false
          return true
      })
      let res = await Promise.all(units.map(async(x)=>{
        return await IndexUnitSkills(x)
      }))
      return res
    };
  } catch (e) {
    throw(e)
  }
}
const UpdateSkills = async(unit = {})=>{
  try{
    for(let i in unit.skills){
      unit.skills[i] = await UpdateSkill(unit.skills[i])
    }
    for(let i in unit.ultimate){
      unit.ultimate[i] = await UpdateUlitmate(unit.ultimate[i])
    }
  }catch(e){
    throw(e);
  }
}
const UpdateSkill = async(skill = {})=>{
  try{
    let skillInfo = skillList.find(x=>x.id === skill.skillId)
    let abilityInfo = abilityList.find(x=>x.id === skillInfo.abilityReference)
    let tempObj = {
      abilityId: abilityInfo.id,
      nameKey: lang[abilityInfo.nameKey] || abilityInfo.nameKey,
      descKey: lang[abilityInfo?.tier[(+abilityInfo?.tier?.length - 1)]?.descKey] || abilityInfo.descKey,
      isZeta: skillInfo.isZeta,
      type: abilityInfo.abilityType,
      tiers: abilityInfo.tier,
      abilityDamage: []
    }
    for(let a in tempObj.tiers){
      for(let e in tempObj.tiers[a].effectReference){
        let effectInfo = effectList.find(x=>x.id === tempObj.tiers[a].effectReference[e].id)
        if(effectInfo.multiplierAmountDecimal > 0 || effectInfo.summonId){
          tempObj.abilityDamage.push({
            id: effectInfo.id,
            param: effectInfo.param,
            damageType: effectInfo.damageType,
            multiplierAmountDecimal: effectInfo.multiplierAmountDecimal,
            resultVarianceDecimal: effectInfo.resultVarianceDecimal,
            summonId: effectInfo.summonId,
            summonEffectList: effectInfo.summonEffect
          })
        }
      }
    }
    return {...skill,...tempObj}
  }catch(e){
    throw(e);
  }
}
const UpdateUlitmate = async(skill = {})=>{
  try{
    let abilityInfo = abilityList.find(x=>x.id === skill.abilityId)
    let tempObj = {
      nameKey: lang[abilityInfo.nameKey] || abilityInfo.nameKey,
      descKey: lang[abilityInfo.descKey] || abilityInfo.descKey,
      type: abilityInfo.abilityType,
      abilityDamage: []
    }
    for(let e in abilityInfo.effectReference){
      let effectInfo = effectList.find(x=>x.id === abilityInfo.effectReference[e].id)
      if(effectInfo.multiplierAmountDecimal > 0 || effectInfo.summonId){
        tempObj.abilityDamage.push({
          id: effectInfo.id,
          param: effectInfo.param,
          damageType: effectInfo.damageType,
          multiplierAmountDecimal: effectInfo.multiplierAmountDecimal,
          resultVarianceDecimal: effectInfo.resultVarianceDecimal,
          summonId: effectInfo.summonId,
          summonEffectList: effectInfo.summonEffect
        })
      }
    }
    return {...skill,...tempObj}
  }catch(e){
    throw(e);
  }
}
module.exports = async(errObj)=>{
  try{
    unitsList = await ReadFile(`${baseDir}/data/files/units.json`)
    abilityList = await ReadFile(`${baseDir}/data/files/ability.json`)
    skillList = await ReadFile(`${baseDir}/data/files/skill.json`)
    effectList = await ReadFile(`${baseDir}/data/files/effect.json`)
    lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    let units = await IndexUnits()
    if(units?.length > 0){
      for(let i in units){
        await UpdateSkills(units[i])
        if(units[i].ultimate) units[i].ultimate = Object.values(units[i].ultimate)
        if(units[i].skills){
          units[i].skills = Object.values(units[i].skills)
          await mongo.set('skills', {_id: units[i].baseId}, units[i])
        }
      }
      errObj.complete++;
    }else{
      errObj.error++;
    }
  }catch(e){
    throw(e)
  }
}
