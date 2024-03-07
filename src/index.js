'use strict';
const log = require('logger')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
require('./globals')
//require('./expressServer')
require('./assetGetter')

const mongo = require('mongoclient')
const CheckEvents = require('./events')
const MapPlatoons = require('./mapPlatoons')

const CheckMongo = ()=>{
  try{
    let status = mongo.status()
    if(status){
      CheckAPIReady()
      return
    }
    setTimeout(CheckMongo, 5000)
  }catch(e){
    console.error(e);
    setTimeout(CheckMongo, 5000)
  }
}
const CheckAPIReady = async()=>{
  const obj = await Client('metadata')
  if(obj?.latestGamedataVersion){
    console.log('API is ready dataSync Server...')
    StartSync()
    UpdateDataCronAutoComplete()
    SyncEvents()
  }else{
    console.log('API is not ready on dataSync server .... Will try again in 5 seconds')
    setTimeout(()=>CheckAPIReady(), 5000)
  }
}
const StartSync = async()=>{
  try{
    if(!dataUpateInProgress){
      let obj = await Client('metadata')
      if(obj?.latestGamedataVersion && (GameDataVersions.gameVersion != obj?.latestGamedataVersion || GameDataVersions.localeVersion != obj?.latestLocalizationBundleVersion)){
        await DataUpdate()
        dataUpateInProgress = false
      }
      //console.log('GameVersion '+GameDataVersions.gameVersion)
    }
    setTimeout(StartSync, +process.env.UPDATE_INTERVAL || 30000)
  }catch(e){
    console.error(e)
    setTimeout(StartSync, +process.env.UPDATE_INTERVAL || 30000)
  }
}
const SyncEvents = async()=>{
  await CheckEvents()
  setTimeout(SyncEvents, (process.env.UPDATE_INTERVAL ? (+process.env.UPDATE_INTERVAL * 4):300000))
}
const UpdateDataCronAutoComplete = async()=>{
  try{
    const obj = await mongo.find('datacronList', {}, {_id: 1, nameKey: 1, expirationTimeMs: 1})
    if(obj?.length > 0){
      let array = [], timeNow = Date.now()
      for(let i in obj){
        if(obj[i].expirationTimeMs && +obj[i].expirationTimeMs > +timeNow){
          array.push({name: obj[i].nameKey, value: obj[i]._id})
        }
      }
      if(array?.length > 0) await mongo.set('autoComplete', {_id: 'datacron-set'}, { data: array, include: true })
    }
    setTimeout(()=>UpdateDataCronAutoComplete(), 30000)
  }catch(e){
    console.error(e);
    setTimeout(()=>UpdateDataCronAutoComplete(), 30000)
  }
}

CheckMongo()
