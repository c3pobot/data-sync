'use strict'
const getFile = require('src/helpers/getFile')
const altName = require(`src/enums/alternateFactionNames`)

const cleanName = (string)=>{
  if(!string) return
  string = string.replace('\\n', '')
  string = string.replace(/\[c\]/g, ' ')
  string = string.replace(/\[\/c]/g, '')
  string = string.replace(/\[-\]/g, '')
  string = string.replace(/\[\w{1,6}\]/g, '')
  string = string.replace("Released in the", 'Released in the ')
  string = string.replace("released in the", 'released in the ')
  string = string.replace("Released alongside the", 'Released alongside the ')
  string = string.replace("released alongside the", 'released alongside the ')
  return string
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ lang, obj, eraTable ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('category', gameVersion),
    getFile('table', gameVersion)
  ])
  if(!lang || !obj || !eraTable) return
  let list = {}, manualFactions = [ 'conquest_reward_unit' ], eraKeys = (eraTable?.find(x=>x.id === "release-era-tags-icons")?.row || [])
  let manualSet = new Set(manualFactions.concat(eraKeys?.map(x=>x.key)))
  for(let i in obj){
    if(!obj[i].id) continue
    let tempObj = { baseId: obj[i].id, nameKey: cleanName(lang[obj[i].descKey]), search: cleanName(lang[obj[i].descKey]?.toLowerCase()), uiFilter: (obj[i]?.uiFilter?.length > 0 ? true:false), units:[] }
    if(altName[obj[i].id]){
      tempObj.nameKey = altName[obj[i].id]
      tempObj.search = altName[obj[i].id]?.toLowerCase()
    }
    if(manualSet?.has(obj[i].id)) tempObj.uiFilter = true
    list[obj[i].id] = tempObj
  }
  return list
}
