'use strict'
const ReadFile = require('./readFile')
const mongo = require('mongoclient')
module.exports = async(errObj)=>{
  try{
    let discDef = await ReadFile(`${baseDir}/data/files/artifactDefinition.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    if(discDef && discDef.length > 0){
      for(let i in discDef){
        if(lang[discDef[i].nameKey]) discDef[i].nameKey = lang[discDef[i].nameKey]
        if(lang[discDef[i].descriptionKey]) discDef[i].descriptionKey = lang[discDef[i].descriptionKey].replace(/\//g, '').replace(/\[c\]/g, '').replace(/\[FFFF33\]/g, '').replace(/\[ffff33\]/g, '').replace(/\[-\]/g, '').replace(/\[-\]/g, '').replace(/\\n/g, '<br>')
        await mongo.set('dataDisc', {_id: discDef[i].id}, discDef[i])
      }
      errObj.complete++
    }else{
      errObj.error++
    }
    discDef = null
    lang = null
  }catch(e){
    throw(e)
  }
}
