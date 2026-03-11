'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const sorter = require('json-array-sorter')
const mapEvents = require('./mapEvents')
const mapCampains = require('./mapCampains')
//OB: 3, events: 3, guild: 4, TB: 11, era: 13
//DS: 6, LS: 5, CT: 8, MB: 7, SP: 9


const mapUnits = (unitList = [], lang = {})=>{
  let data = {}
  for(let i in unitList){
    if(data[unitList[i].baseId]) continue
    if(!lang[unitList[i].nameKey]) continue
    data[unitList[i].baseId] = { baseId: unitList[i].baseId, nameKey: lang[unitList[i].nameKey] }
  }
  return data
}

const getUnits = (unitList = [], categoryId, lang = {})=>{
  let units = {}
  for(let i in unitList){
    if(!unitList[i]?.categoryId?.includes(categoryId)) continue
    if(units[unitList[i].id]) continue
    units[unitList[i].id] = { id: unitList[i].id, nameKey: lang[unitList[i].nameKey] || unitList[i].nameKey }
  }
  return Object.values(units)
}

module.exports = async(gameVersion, localeVersion)=>{
  let [ unitList, pveList, campaignList, categoryList, unitGuideList, lang ] = await Promise.all([
    getFile('units', gameVersion),
    getFile('units_pve', gameVersion),
    getFile('campaign', gameVersion),
    getFile('category', gameVersion),
    getFile('unitGuideDefinition', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!pveList || !campaignList || !categoryList || !lang || !unitGuideList) return
  let campaignMapList = campaignList.find(x=>x.id == 'EVENTS')?.campaignMap
  if(!campaignMapList) return
  let unitMap = mapUnits(unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0), lang)
  if(!unitMap) return


  for(let i in categoryList){
    let data = []
    if(categoryList[i].id?.startsWith('selftag_') || categoryList[i].id?.startsWith('any_obtainable') || categoryList[i].id?.startsWith('special') || categoryList[i].descKey?.startsWith('PLACEHOLDER')) continue
    let units = getUnits(pveList, categoryList[i].id, lang)
    if(!units || units?.length == 0) continue
    let campaigns = mapCampains(units, campaignList, lang)
    if(campaigns?.length > 0) data = data.concat(campaigns)
    let guideEvents = mapEvents(units, campaignMapList, unitGuideList, unitMap)
    if(guideEvents?.length > 0) data = data.concat(guideEvents)
    if(data?.length > 0) await mongo.set('questFactionList', { _id: categoryList[i].id }, { data: sorter([{ column: 'count', order: 'descending' }], data) })
  }
  return true
}
