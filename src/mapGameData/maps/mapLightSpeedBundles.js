'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const mapUnits = (units = [], res = [])=>{
  if(!units || units?.length == 0) return
  for(let i in units) res.push({ baseId: units[i].id, level: units[i].level, rarity: units[i].rarity, gear: units[i].tier, relicTier: units[i].relicTier })
}
const mapBundle = async(bundle = {}, lang = {})=>{
  if(!bundle?.unitUpgrade || bundle?.unitUpgrade?.length == 0) return
  let nameKey = bundle.tabs[0]?.mainElement?.title || bundle.tabs[1]?.mainElement?.title
  if(!nameKey || !lang[nameKey]) return
  let data = { id: bundle.id, nameKey: lang[nameKey], units: [] }
  mapUnits(bundle.unitUpgrade, data.units)
  if(data?.units?.length > 0) await mongo.set('lightSpeedBundles', { _id: bundle.id }, data)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ galacticBundleList, lang ] = await Promise.all([
    getFile('galacticBundle', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])

  if(!galacticBundleList || !lang) return

  let array = [], i = galacticBundleList?.length
  while(i--) array.push(mapBundle(galacticBundleList[i], lang))

  await Promise.all(array)
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.bundle': 'bundle' })
  return true
}
