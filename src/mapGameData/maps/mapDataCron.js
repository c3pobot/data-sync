'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const checkImages = require('src/helpers/checkImages')
const pct = require(`src/enums/pct`)

const mapAbility = (ability = [], lang = {})=>{
  let res = {}, i = ability.length
  while(i--){
    if(!ability[i].nameKey.includes('DATACRON')) continue
    res[ability[i].id] = { nameKey: lang[ability[i].nameKey] || ability[i].nameKey, descKey: lang[ability[i].descKey] || ability[i].descKey, iconKey: ability[i].icon }
  }
  return res
}
const mapFaction = (faction = [], lang = {})=>{
  let res = {}
  for(let i in faction){
    if(!faction[i].descKey || faction[i].descKey == 'PLACEHOLDER' || !lang[faction[i].descKey]) continue
    res[faction[i].id] = { id: faction[i].id, nameKey: lang[faction[i].descKey], visible: faction[i].visible, units: [] }
  }
  return res
}
const mapUnits = (units = [], faction = {}, lang = {})=>{
  let res = {}, i = units.length
  while(i--){
    if(+units[i].rarity !== 7 || units[i].obtainable !== true || +units[i].obtainableTime !== 0) continue
    if(!units[i].baseId || !units[i].nameKey || !lang[units[i].nameKey]) continue
    res[units[i].baseId] = { baseId: units[i].baseId, nameKey: lang[units[i].nameKey], combatType: +units[i].combatType }
    let f = units[i].categoryId.length
    while(f--){
      if(faction[units[i].categoryId[f]]?.units) faction[units[i].categoryId[f]].units.push(res[units[i].baseId])
    }
  }
  return res
}
const mapStatEnum = (enums = {}, lang = {})=>{
  let res = {}, tempLang = {}
  for(let i in lang){
    if(!i?.startsWith('UnitStat_') && !i?.startsWith('UNIT_STAT_')) continue
    let enumKey = i.split('_')?.join('')?.split('TU')[0]?.toUpperCase()?.replace('STATVIEW', '')?.replace('STATSVIEW', '')
    if(enumKey) tempLang[enumKey] = { langId: i, nameKey: lang[i] }
  }
  for(let i in enums){
    let enumKey = i?.replace(/_/g, '')
    res[i] = { id: enumKey, statId: enums[i], pct: pct[enums[i]] }
    if(tempLang[enumKey]){
      res[enumKey] = {...res[enumKey],...tempLang[enumKey]}
    }else{
      let stat = enumKey.replace('UNITSTATMAX', 'UNITSTAT')
      if(tempLang[stat]) res[i] = {...res[i],...tempLang[stat]}
    }
  }
  return Object.values(res)
}
const getTierType = (tier)=>{
  if(tier == 2) return 'alignment'
  if(tier == 5) return 'faction'
  if(tier == 8) return 'unit'
}
const mapCategory = (category = {}, abilityId, targetRule, cron, dataList, images)=>{
  if(category.exlude || !dataList.factions[category.categoryId]) return
  cron.ability[abilityId].target[targetRule] = {
    id: targetRule,
    nameKey: dataList.ability[abilityId]?.nameKey?.replace(/\{0\}/g, dataList.factions[category.categoryId]?.nameKey),
    descKey: dataList.ability[abilityId]?.descKey?.replace(/\{0\}/g, dataList.factions[category.categoryId]?.nameKey)
  }
  if(dataList.factions[category.categoryId].units?.length == 1) cron.ability[abilityId].target[targetRule].unit = dataList.factions[category.categoryId].units[0]
}
const mapCategories = (category = [], abilityId, targetRule, cron, dataList, images)=>{
  for(let i in category){
    mapCategory(category[i], abilityId, targetRule, cron, dataList, images)
  }
}
const mapAffix = (affix = {}, cron, dataList, images)=>{
  if(images.filter(x=>x == affix.scopeIcon).length == 0) images.push(affix.scopeIcon)
  if(affix.statType > 0 && dataList.stats[affix.statType]) cron.stat[affix.statType] = { id: affix.statType, nameKey: dataList.stats[affix.statType].nameKey, pct: dataList.stats[affix.statType].pct, iconKey: affix.scopeIcon }
  if(!affix.abilityId || !affix.targetRule || !dataList.ability[affix.abilityId]) return
  if(!cron.ability[affix.abilityId]) cron.ability[affix.abilityId] = { id: affix.abilityId, iconKey: affix.scopeIcon, target: {} }
  let target = dataList.targetSetList.find(x=>x.id == affix.targetRule)
  if(!target?.category?.category || target?.category?.category?.length == 0) return
  mapCategories(target?.category?.category, affix.abilityId, affix.targetRule, cron, dataList, images)
}
const mapAffixSet = (affixTemplateSetId, cron, dataList, images)=>{
  if(!affixTemplateSetId) return
  let affixSet = dataList.affixList.find(x=>x.id == affixTemplateSetId)
  for(let i in affixSet.affix) mapAffix(affixSet.affix[i], cron, dataList, images)
}
const mapAffixTemplateSetId = (affixTemplateSetId, cron, dataList, images)=>{
  for(let i in affixTemplateSetId) mapAffixSet(affixTemplateSetId[i], cron, dataList, images)
}
const mapTiers = (tiers, cron, dataList, images)=>{
  for(let i in tiers) mapAffixTemplateSetId(tiers[i].affixTemplateSetId, cron, dataList, images)
}
const mapCron = async(cron = {}, cronSet = {}, dataList = {}, images = [])=>{
  cron.stat = {}
  cron.ability = {}
  cron.setTier = cronSet.tier
  cron.setMaterial = cronSet.setMaterial
  cron.nameKey = dataList.lang[cronSet.displayName]
  cron.expirationTimeMs = +cronSet.expirationTimeMs
  cron.iconKey = cronSet.icon
  cron.detailPrefab = cronSet.detailPrefab
  cron.TTL = new Date(+cronSet.expirationTimeMs)
  mapTiers(cron.tier, cron, dataList, images)
  await mongo.set('datacronList', { _id: cron.id }, cron)
}

module.exports = async(gameVerion, localeVersion, assetVersion)=>{
  let [ abilityList, unitList, factionList, targetSetList, enums, lang, datacronTemplateList, datacronSetList, datacronAffixTemplateSetList ] = await Promise.all([
    getFile('ability', gameVerion),
    getFile('units', gameVerion),
    getFile('category', gameVerion),
    getFile('battleTargetingRule', gameVerion),
    getFile('enums', gameVerion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('datacronTemplate', gameVerion),
    getFile('datacronSet', gameVerion),
    getFile('datacronAffixTemplateSet', gameVerion)
  ])
  if(!abilityList || !unitList || !factionList || !targetSetList || !enums || !lang || !datacronTemplateList || !datacronSetList || !datacronAffixTemplateSetList ) return

  let stats, factions, units, ability
  if(factionList?.length > 0 && lang) factions = mapFaction(factionList, lang)
  if(unitList?.length > 0 && lang && Object.values(factions)?.length > 0) units = mapUnits(unitList.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0), factions, lang)
  if(abilityList?.length > 0 && lang) ability = mapAbility(abilityList, lang)
  if(enums['UnitStat'] && lang) stats = mapStatEnum(enums['UnitStat'], lang)

  if(!factions || !units || !stats || !ability) return

  if(Object.values(factions).length == 0 || Object.values(units).length == 0 || stats?.length == 0 || Object.values(units).length == 0) return

  let timeNow = Date.now(), i = datacronTemplateList.length, array = [], images = []
  let dataList = { lang: lang, factions: factions, stats: stats, ability: ability, targetSetList: targetSetList, affixList: datacronAffixTemplateSetList }
  while(i--){
    let cronSet = datacronSetList.find(x=>x.id == datacronTemplateList[i].setId)
    if(!cronSet?.expirationTimeMs || +cronSet.expirationTimeMs < +timeNow) continue
    array.push(mapCron(datacronTemplateList[i], cronSet, dataList, images))
  }
  await Promise.all(array)

  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.datacron-set': 'datacron-set' })
  if(images?.length > 0 && assetVersion) checkImages(images, assetVersion, 'asset', 'datacronList')
  return true
}
