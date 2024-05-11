'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapDiscDef = async(discDef = {}, lang = {})=>{
  discDef.nameKey = lang[discDef.nameKey] || discDef.nameKey
  if(lang[discDef.descriptionKey]) discDef.descriptionKey = lang[discDef.descriptionKey].replace(/\//g, '').replace(/\[c\]/g, '').replace(/\[FFFF33\]/g, '').replace(/\[ffff33\]/g, '').replace(/\[-\]/g, '').replace(/\[-\]/g, '').replace(/\\n/g, '<br>')
  await mongo.set('dataDisc', {_id: discDef.id}, discDef)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ artifactDefinitionList, lang ] = await Promise.all([
    getFile('artifactDefinition', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!artifactDefinitionList || !lang) return

  let i = artifactDefinitionList.length, array = []
  while(i--) array.push(mapDiscDef(artifactDefinitionList[i], lang))
  await Promise.all(array)
  return true
}
