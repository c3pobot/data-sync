'use strict'
const ReadFile = require('./readFile')
const mongo = require('mongoclient')
module.exports = async(errObj)=>{
  try{
    let cqDef = await ReadFile(`${baseDir}/data/files/challenge.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    if(cqDef && cqDef.length > 0){
      cqDef = cqDef.filter(x=>x.reward.filter(x=>x.type === 22).length > 0)
      cqDef.forEach(async(c)=>{
        let tempObj = {
          id: c.id,
          nameKey: (lang[c.nameKey] ? lang[c.nameKey]:c.nameKey),
          descKey: (lang[c.descKey] ? lang[c.descKey]:c.descKey),
          reward: +(c.reward.find(x=>x.type == 22) ? c.reward.find(x=>x.type == 22).minQuantity:0),
          type: c.type,
          difficulty: (c.id.includes('_III_DIFF') ? 10:(c.id.includes('_II_DIFF') ? 9:8))
        }
        await mongo.set('cqFeats', {_id: c.id}, tempObj)
      })
      errObj.complete++
    }else{
      errObj.error++
    }
    lang = null
  }catch(e){
    throw(e)
  }
}
