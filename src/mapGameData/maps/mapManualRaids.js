'use strict'
const mongo = require('mongoclient')
const log = require('logger')

module.exports = async(gameVerion, localeVersion)=>{
  let raids = await mongo.find('manualRaids', {})
  if(!raids || raids?.length === 0) return true
  for(let i in raids){
    if(!raids[i].include){
      await mongo.delete('guideTemplates', { _id: `${raids[i].baseId}` })
      await mongo.delete('journeyGuide', { _id: `${raids[i].baseId}` })
      continue
    }
    await mongo.set('guideTemplates', { _id: raids[i].baseId}, raids[i].template)
    await mongo.set('journeyGuide', { _id: raids[i].baseId}, raids[i].guide)
  }
  return true
}
