'use strict'
const getFile = require('src/helpers/getFile')
const altName = require(`src/enums/alternateFactionNames`)
module.exports = async(gameVersion, localeVersion)=>{
  let [ lang, obj ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('category', gameVersion)
  ])
  if(!lang || !obj) return
  let list = {}
  for(let i in obj){
    if(!obj[i].id) continue
    let tempObj = { baseId: obj[i].id, nameKey: lang[obj[i].descKey], search: lang[obj[i].descKey]?.toLowerCase(), uiFilter: (obj[i]?.uiFilter?.length > 0 ? true:false), units:[] }
    if(altName[obj[i].id]){
      tempObj.nameKey = altName[obj[i].id]
      tempObj.search = altName[obj[i].id]?.toLowerCase()
    }
    list[obj[i].id] = tempObj
  }
  return list
}
