'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const formatNameKey = (nameKey)=>{
  return nameKey?.toLowerCase()?.split(' ')?.map(x=>x?.charAt(0)?.toUpperCase() + x?.slice(1))?.join(' ')
}
const mapLightspeedToken = async( token = {}, lang = {})=>{
  if(!token?.applicableUnitDefs || token?.applicableUnitDefs?.length == 0) return
  if(!lang[token.nameKey] || !lang[token.descriptionKey]) return

  let nameKey = `${lang[token.descriptionKey]} ${lang[token.nameKey]}`
  await mongo.set('lightspeedToken', { _id: token.id }, { id: token.id, units: token.applicableUnitDefs, nameKey: formatNameKey(nameKey), level: token?.unitUpgrade?.level, rarity: token?.unitUpgrade?.rarity, gear: token?.unitUpgrade?.tier, relicTier: token?.unitUpgrade?.relicTier, combatType: token.combatType })
}
module.exports = async( gameVersion, localeVersion )=>{
  let [ lightspeedTokenList, lang, skillList, unitList ] = await Promise.all([
    getFile('lightspeedToken', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!lightspeedTokenList || !lang) return

  let i = lightspeedTokenList?.length, array = []
  while(i--) array.push(mapLightspeedToken(lightspeedTokenList[i], lang))
  await Promise.all(array)
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.token': 'token' })
  return true
}
