'use strict'
const fs = require('fs')
const ReadFile = require('./readFile')
const altName = {'species_wookiee_ls': 'Light Side Wookiee'}
module.exports = async(errObj)=>{
  try {
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let obj = await ReadFile(baseDir+'/data/files/category.json')
    const list = {}
    if(lang && obj){
      await obj.forEach(f=>{
        //if(f.id && !f.id.startsWith('special') && f.descKey && f.uiFilter && f.uiFilter.length > 0 && lang[f.descKey] && lang[f.descKey] != 'Placeholder'){
        if(f.id){
          if(altName[f.id]){
            list[f.id] = {
              baseId: f.id,
              nameKey: altName[f.id],
              search: altName[f.id]?.toLowerCase(),
              uiFilter: false,
              units:[]
            }
          }else{
            list[f.id] = {
              baseId: f.id,
              nameKey: lang[f.descKey],
              search: lang[f.descKey]?.toLowerCase(),
              uiFilter: (f.uiFilter?.length > 0 ? true:false),
              units:[]
            }
          }
        }
      })
      lang = null
      obj = null
      return list
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    throw(e)
  }
}
