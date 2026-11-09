'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const sorter = require('json-array-sorter')

const mapCampains = require('../mapQuestFactions/mapCampains.js')

const getUnits = (unitList = [], lang = {})=>{
  let units = {}
  for(let i in unitList){
    if(units[unitList[i].id]) continue
    units[unitList[i].id] = { id: unitList[i].id, baseId: unitList[i].baseId, nameKey: lang[unitList[i].nameKey] || unitList[i].nameKey }
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
  let units = getUnits(pveList, lang)
  
  let campaigns = mapCampains(units, campaignList, lang)
  let pve_unit_battles = {}
  for(let i of campaigns){
    if(!i.campaignType || !i.units) continue
    for(let u of i.units){
        if(!pve_unit_battles[u.nameKey]) pve_unit_battles[u.nameKey] = { id: u.baseId, nameKey: u.nameKey, cantina: { normal: [], hard: [] }, ls: { normal: [], hard: [] }, ds: { normal: [], hard: [] }, mod: { normal: [], hard: [] }, fleet: { normal: [], hard: [] } }
        if(!pve_unit_battles[u.nameKey]) continue
        if(i.campaignType == 5){
            //ls battles
            pve_unit_battles[u.nameKey].ls.normal = pve_unit_battles[u.nameKey].ls.normal.concat(i.normal || [])
            pve_unit_battles[u.nameKey].ls.hard = pve_unit_battles[u.nameKey].ls.hard.concat(i.hard || [])
        }
        if(i.campaignType == 6){
            //ds battles
            pve_unit_battles[u.nameKey].ds.normal = pve_unit_battles[u.nameKey].ds.normal.concat(i.normal || [])
            pve_unit_battles[u.nameKey].ds.hard = pve_unit_battles[u.nameKey].ds.hard.concat(i.hard || [])
        }
        if(i.campaignType == 7){
            //mod battles
            pve_unit_battles[u.nameKey].mod.normal = pve_unit_battles[u.nameKey].mod.normal.concat(i.normal || [])
            pve_unit_battles[u.nameKey].mod.hard = pve_unit_battles[u.nameKey].mod.hard.concat(i.hard || [])
        }
        if(i.campaignType == 8){
            //cantina battles
            pve_unit_battles[u.nameKey].cantina.normal = pve_unit_battles[u.nameKey].cantina.normal.concat(i.normal || [])
            pve_unit_battles[u.nameKey].cantina.hard = pve_unit_battles[u.nameKey].cantina.hard.concat(i.hard || [])
        }
        if(i.campaignType == 9){
            //fleet battles
            pve_unit_battles[u.nameKey].fleet.normal = pve_unit_battles[u.nameKey].fleet.normal.concat(i.normal || [])
            pve_unit_battles[u.nameKey].fleet.hard = pve_unit_battles[u.nameKey].fleet.hard.concat(i.hard || [])
        }
    }
  }
  let pve_units = Object.values(pve_unit_battles)
  for(let i of pve_units){
    await mongo.set('questUnitList', { _id: i.id }, i)
  }
  return true
}