'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const formatNameKey = (nameKey)=>{
  return nameKey?.toLowerCase()?.split(' ')?.map(x=>x?.charAt(0)?.toUpperCase() + x?.slice(1))?.join(' ')
}
const mapLightspeedToken = async( token = {}, lang = {})=>{
  if(!token?.applicableUnitDefs || token?.applicableUnitDefs?.length == 0) return
  if(!lang[token.nameKey] || !lang[token.descriptionKey]) return

  let nameKey = formatNameKey(`${lang[token.descriptionKey]} ${lang[token.nameKey]}`)

  await mongo.set('lightspeedToken', { _id: token.id }, { id: token.id, units: token.applicableUnitDefs, nameKey: nameKey, level: token?.unitUpgrade?.level, rarity: token?.unitUpgrade?.rarity, gear: token?.unitUpgrade?.tier, relicTier: token?.unitUpgrade?.relicTier, combatType: token.combatType })
  for(let i in token.applicableUnitDefs){
    if(!token.applicableUnitDefs[i]) continue
    let tempUnit = (await mongo.find('unitLightspeedToken', { _id: token.applicableUnitDefs[i] }, { _id: 0, TTL: 0 }))[0]
    if(!tempUnit?.tokens) tempUnit = { baseId: token.applicableUnitDefs[i], tokens: {} }
    tempUnit.tokens[token.id] = { baseId: token.applicableUnitDefs[i], tokenId: token.id, tokenNameKey: nameKey, level: token?.unitUpgrade?.level, rarity: token?.unitUpgrade?.rarity, gear: token?.unitUpgrade?.tier, relicTier: token?.unitUpgrade?.relicTier, combatType: token.combatType }
    if(token.applicableUnitDefs[i]) await mongo.set('unitLightspeedToken', { _id:  token.applicableUnitDefs[i] }, tempUnit)
  }
}
module.exports = async( gameVersion, localeVersion )=>{
  //return true
  let [ lightspeedTokenList, lang ] = await Promise.all([
    getFile('lightspeedToken', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!lightspeedTokenList || !lang) return

  for(let i in lightspeedTokenList) await mapLightspeedToken(lightspeedTokenList[i], lang)
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.token': 'token' })
  return true
}
