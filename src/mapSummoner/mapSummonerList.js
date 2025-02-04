'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const ignoreSet = new Set(['GEONOSIANBROODALPHA', 'SITHPALPATINE', 'GRANDMASTERLUKE'])

const getSummonId = (id, effectList)=>{
  let effect = effectList.find(x=>x.id === id)
  if(!effect) return
  if(effect.summonId) return effect.summonId
  for(let i in effect.effectReference){
    let summonId = getSummonId(effect.effectReference[i].id, effectList)
    if(summonId) return summonId
  }
}
const mapEffect = (effectReference = [], summonTag = [], tier = 1, effectList)=>{
  for(let i in effectReference){
    if(effectReference[i].id?.includes('datacron')) continue
    let summonId = getSummonId(effectReference[i]?.id, effectList)
    if(summonId) summonTag.push({id: effectReference[i].id, tier: tier, summonId: summonId })
  }
}
const mapAbilitiesTiers = (tiers = [], summonTag = [], effectList = [])=>{
  if(!tiers || tiers?.length === 0) return
  for(let i in tiers){
    mapEffect(tiers[i].effectReference, summonTag, +i + 2, effectList)
  }
}
const mapAbilities = (array = [], unit = {}, summonEffects =[], abilityList = [], skillList = [], effectList = [])=>{
  for(let i in array){
    let ability = abilityList.find(x=>x.id === array[i].abilityId)
    if(!ability) continue
    let skill = skillList.find(x=>x.abilityReference === ability.id)
    let summonTag = []
    mapEffect(ability.effectReference, summonTag, 1, effectList)
    mapAbilitiesTiers(ability.tier, summonTag, effectList)
    if(!summonTag || summonTag.length === 0) continue
    summonEffects.push({ id: ability.id, baseId: unit.baseId, skillId: skill?.id, tiers: summonTag })
  }
}
const mapUnit = (unit = {}, abilityList = [], effectList = [], skillList = [])=>{
  if(ignoreSet.has(unit.baseId)) return
  if(!unit.uniqueAbilityRef) return
  let summonEffects = []
  mapAbilities(unit.uniqueAbilityRef, unit, summonEffects, abilityList, skillList, effectList)
  mapAbilities(unit.limitBreakRef, unit, summonEffects, abilityList, skillList, effectList)
  mapAbilities(unit.leaderAbilityRef, unit, summonEffects, abilityList, skillList, effectList)
  //if(summonEffects?.length > 0) await mongo.set('summonerList', { _id: unit.baseId }, { baseId: unit.baseId, skills: summonEffects.filter(x=>x.tiers?.filter(y=>y.summonId).length) })

 return summonEffects.filter(x=>x.tiers?.filter(y=>y.summonId).length)
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let [ skillList, abilityList, effectList, unitList ] = await Promise.all([
    getFile('skill', gameVersion),
    getFile('ability', gameVersion),
    getFile('effect', gameVersion),
    getFile('units', gameVersion)
  ])
  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)
  if(!skillList || !abilityList || !effectList || !unitList) return

  let status = true
  for(let i in unitList){
  	let tempObj = mapUnit(unitList[i], abilityList, effectList, skillList)
    if(tempObj?.length > 0){
       await mongo.set('summonerList', { _id: unitList[i].baseId}, { baseId: unitList[i].baseId, skills: tempObj })
    }     
   }
  return status
}
