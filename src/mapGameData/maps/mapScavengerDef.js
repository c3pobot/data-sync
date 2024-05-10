'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapGear = async(gear = {}, lang = {})=>{
  let tempObj = {id: gear.output.item.id, pointValue: gear.output.item.pointValue, nameKey: lang[gear.output.item.id+'_NAME'] || gear.output.item.id+'_NAME', gear: [] }
  tempObj.gear = gear.consumable.map(x=>{ return { id: x.id, pointValue: x.pointValue } })
  await mongo.set('scavengerGear', { _id: tempObj.id }, tempObj)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ scavengerConversionSetList, lang ] = await Promise.all([
    getFile('scavengerConversionSet', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])

  if(!scavengerConversionSetList || !lang) return

  let i = scavengerConversionSetList.length, array = []
  while(i--) array.push(mapGear(scavengerConversionSetList[i], lang))
  await Promise.all(array)
  return true
}
