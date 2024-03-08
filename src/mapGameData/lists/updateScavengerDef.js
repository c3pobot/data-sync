'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try{
    let obj = await ReadFile(`${baseDir}/data/files/scavengerConversionSet.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    if(obj && obj.length > 0){
       //await redis.set('scavengerConversionSet', obj)
       let res = []
       for(let i in obj){
         let tempObj = {id: obj[i].output.item.id, pointValue: obj[i].output.item.pointValue, nameKey: (lang[obj[i].output.item.id+'_NAME'] ? lang[obj[i].output.item.id+'_NAME']:obj[i].output.item.id+'_NAME'), gear: []}
         tempObj.gear = obj[i].consumable.map(x=>{
           return Object.assign({}, {
             id: x.id,
             pointValue: x.pointValue
           })
         })
         await mongo.set('scavengerGear', {_id: tempObj.id}, tempObj)
         res.push(tempObj)
       }
       //if(res.length > 0) await redis.set('scavengerGear', res)
       errObj.complete++
    }
  }catch(e){
    throw(e)
  }
}
