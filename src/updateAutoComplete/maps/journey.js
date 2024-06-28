'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('journeyGuide', {}, { baseId: 1, nameKey: 1, unitNameKey: 1, hidden: 1})
  let manualGuides = (await mongo.find('botSettings', { _id: 'manualGuides' }))[0]
  let autoComplete = [], tempSet = new Set()
  for(let i in obj){
    if(tempSet.has(obj[i].baseId) || obj[i].hidden) continue
    autoComplete.push({ name: obj[i].unitNameKey, value: obj[i].baseId, descKey: obj[i].nameKey })
    tempSet.add(obj[i].baseId)
  }
  if(manualGuides?.data?.length > 0){
    for(let i in manualGuides?.data){
      if(tempSet.has(manualGuides.data[i].value)) continue
      autoComplete.push(manualGuides.data[i])
      tempSet.add(manualGuides.data[i].value)
    }
  }
  if(autoComplete?.length > 0){
    await mongo.set('autoComplete', { _id: 'journey' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    return true
  }
}
