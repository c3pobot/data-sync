'use strict'
const fs = require('fs')
const GetImages = require('../getImages')
let pct = require('./pct')

const ReadFile = require('./readFile')
const MapAbility = async(ability = [], lang = {})=>{
  try{
    let res = {}
    await ability.forEach(a=>{
      if(a.nameKey.includes('DATACRON')){
        res[a.id] = {
          nameKey: lang[a.nameKey] || a.nameKey,
          descKey: lang[a.descKey] || a.descKey,
          iconKey: a.icon
        }
      }
    })
    return res
  }catch(e){
    console.error(e);
  }
}
const MapFaction = async(faction = [], lang = {})=>{
  try{
    let res = {}
    await faction.forEach(f=>{
      if(f?.descKey && f.descKey !== 'PLACEHOLDER' && lang[f.descKey]){
        res[f.id] = {
          id: f.id,
          nameKey: lang[f.descKey],
          visible: f.visible,
          units: []
        }
      }
    })
    return res
  }catch(e){
    console.error(e);
  }
}
const MapUnits = async(units = [], faction = {}, lang = {})=>{
  try{
    let res = {}
    await units.forEach(u=>{
      if( parseInt(u.rarity) !== 7 ) return
      if( u.obtainable !== true ) return
      if( parseInt(u.obtainableTime) !== 0 ) return
      if(u.baseId && u.nameKey && lang[u.nameKey]){
        res[u.baseId] = {
          baseId: u.baseId,
          nameKey: lang[u.nameKey],
          combatType: u.combatType
        }
        for(let f in u?.categoryId){
          if(faction[u.categoryId[f]]) faction[u.categoryId[f]]?.units.push(res[u.baseId])
        }
      }
    })
    return res
  }catch(e){
    console.error(e);
  }
}
const MapStatEnum = (enums = {}, lang = {})=>{
  try{
    let res = {}, tempLang = {}
    for(let i in lang){
      if(i?.startsWith('UnitStat_') || i?.startsWith('UNIT_STAT_')){
        let enums = i.split('_')?.join('')?.split('TU')[0]?.toUpperCase()?.replace('STATVIEW', '')?.replace('STATSVIEW', '')
        if(enums) tempLang[enums] = {langId: i, nameKey: lang[i]}
      }
    }
    for(let i in enums){
      res[i] = {id: i, statId: enums[i], pct: pct[enums[i]]}
      if(tempLang[i]){
        res[i] = {...res[i],...tempLang[i]}
      }else{
        let stat = i.replace('UNITSTATMAX', 'UNITSTAT')
        if(tempLang[stat]) res[i] = {...res[i],...tempLang[stat]}
      }
    }
    return Object.values(res)
  }catch(e){
    console.error(e);
  }
}

module.exports = async(errObj = {}, assetVersion)=>{
  try{
    console.log('Updating Datacrons...')
    let stats, faction, units, ability, crons = {}, images = []
    let abilityList = await ReadFile(baseDir+'/data/files/ability.json')
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let unitList = await ReadFile(baseDir+'/data/files/units.json')
    let factionList = await ReadFile(baseDir+'/data/files/category.json')
    let targetSet = await ReadFile(baseDir+'/data/files/battleTargetingRule.json')
    let enums = await ReadFile(baseDir+'/data/files/enums.json')

    let template = await ReadFile(baseDir+'/data/files/datacronTemplate.json')
    let set = await ReadFile(baseDir+'/data/files/datacronSet.json')
    let affix = await ReadFile(baseDir+'/data/files/datacronAffixTemplateSet.json')
    if(factionList?.length > 0 && lang) faction = await MapFaction(factionList, lang)
    if(unitList?.length > 0 && lang && Object.values(faction)?.length > 0) units = await MapUnits(unitList, faction, lang)
    if(abilityList?.length > 0 && lang) ability = await MapAbility(abilityList, lang)
    if(enums['UnitStat'] && lang) stats = await MapStatEnum(enums['UnitStat'], lang)
    if(Object.values(faction)?.length > 0 && Object.values(units)?.length > 0 && template?.length > 0 && set?.length > 0 && affix?.length > 0 && stats?.length > 0 && targetSet?.length > 0){
      const timeNow = Date.now()
      await template.forEach(cron=>{
        let cronSet = set.find(x=>x.id === cron.setId)
        if(cronSet?.expirationTimeMs && +cronSet.expirationTimeMs > +timeNow){
          images.push(cronSet.icon)
          cron.stat = {}
          cron.ability = {}
          cron.setTier = cronSet.tier
          cron.setMaterial = cronSet.setMaterial
          cron.nameKey = lang[cronSet.displayName]
          cron.expirationTimeMs = +cronSet.expirationTimeMs
          cron.iconKey = cronSet.icon
          cron.detailPrefab = cronSet.detailPrefab
          for(let i in cron.tier){
            let type
            if(i == 2) type = 'alignment'
            if(i == 5) type = 'faction'
            if(i == 8) type = 'unit'
            for(let j in cron.tier[i].affixTemplateSetId){
              let affixSet = affix.find(x=>x.id == cron.tier[i].affixTemplateSetId[j])
              if(affixSet?.affix){
                for(let s in affixSet.affix){
                  if(images.filter(x=>x === affixSet.affix[s].scopeIcon).length === 0) images.push(affixSet.affix[s].scopeIcon)
                  if(affixSet.affix[s].statType > 0 && stats[affixSet.affix[s].statType]){
                    cron.stat[affixSet.affix[s].statType] = {
                      id: affixSet.affix[s].statType,
                      nameKey: stats[affixSet.affix[s].statType].nameKey,
                      pct: stats[affixSet.affix[s].statType].pct,
                      iconKey: affixSet.affix[s].scopeIcon
                    }
                  }
                  if(type && affixSet.affix[s].abilityId && affixSet.affix[s].targetRule && ability[affixSet.affix[s].abilityId]){
                    if(!cron.ability[affixSet.affix[s].abilityId]) cron.ability[affixSet.affix[s].abilityId] = {id: affixSet.affix[s].abilityId, iconKey: affixSet.affix[s].scopeIcon, target: {}}
                    let target = targetSet.find(x=>x.id === affixSet.affix[s].targetRule)

                    if(target?.category?.category?.length > 0){
                      for(let c in target?.category?.category){
                        if(!target.category.category[c].exlude && faction[target.category.category[c].categoryId]){
                          cron.ability[affixSet.affix[s].abilityId].target[affixSet.affix[s].targetRule] = {
                            id: affixSet.affix[s].targetRule,
                            nameKey: ability[affixSet.affix[s].abilityId].nameKey?.replace(/\{0\}/g, faction[target.category.category[c].categoryId].nameKey),
                            descKey: ability[affixSet.affix[s].abilityId].descKey?.replace(/\{0\}/g, faction[target.category.category[c].categoryId].nameKey)
                          }
                          if(type === 'unit') cron.ability[affixSet.affix[s].abilityId].target[affixSet.affix[s].targetRule].unit = faction[target.category.category[c].categoryId].units[0]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          crons[cron.id] = cron
        }
      })
      for(let i in crons){
        if(crons[i].id) await mongo.set('datacronList', {_id: crons[i].id}, crons[i])
      }
      if(images?.length > 0 && assetVersion){
        GetImages(images, assetVersion, 'thumbnail', 'datacronList')
      }
      errObj.complete++
    }else{
      console.error('Error updating Datacrons')
      errObj.error++
    }
    stats = null, faction = null, units = null, ability = null, crons = null, images = null
    abilityList = null, lang = null, unitList = null, factionList = null, targetSet = null, enums = null
  }catch(e){
    throw(e)
  }
}
