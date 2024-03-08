'use strict';
const log = require('logger')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
//require('./globals')
//require('./expressServer')
require('./assetGetter')

const mongo = require('mongoclient')
const swgohClient = require('./client')
const CheckEvents = require('./events')
const MapPlatoons = require('./mapPlatoons')
const updateData = require('./updateData')
const { dataVersions } = require('./dataVersions')
const UPDATE_INTERVAL = +process.env.UPDATE_INTERVAL || 30

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
  const obj = await swgohClient('metadata')
  if(obj?.latestGamedataVersion){
    log.info('API is ready data-sync...')
    StartSync()
    UpdateDataCronAutoComplete()
    SyncEvents()
  }else{
    log.info('API is not ready data-sync...')
    setTimeout(()=>CheckAPIReady(), 5000)
  }
}

const StartSync = async()=>{
  try{
    if(!dataVersions.updateInProgress){
      let updateNeeded = false
      let obj = await swgohClient('metadata')
      if(obj?.latestGamedataVersion && (dataVersions.gameVersion != obj?.latestGamedataVersion || dataVersions.localeVersion != obj?.latestLocalizationBundleVersion)) updateNeeded = true
      if(!updateNeeded){
        let configMapVersions = await mongo.find('configMaps', {}, { gameVersion: 1, localeVersion: 1})
        if(configMapVersions && configMapVersions?.length !== 3) updateNeeded = true
        if(configMapVersions?.length > 0) configMapVersions = configMapVersions.filter(x=>x.gameVersion !== obj?.latestGamedataVersion || x.localeVersion !== obj?.latestLocalizationBundleVersion)
        if(configMapVersions?.length > 0) updateNeeded = true
      }
      if(!updateNeeded){
        let gameDataVersion = (await mongo.find('botSettings', { _id: 'gameData' }, {version: 1 }))[0]
        if(!gameDataVersion) updateNeeded = true
        if(gameDataVersion?.version !== obj?.latestGamedataVersion) updateNeeded = true
      }
      if(!updateNeeded){
        let mapDataVersions = await mongo.find('versions', {}, { gameVersion: 1, localeVersion: 1 })
        if(mapDataVersions && mapDataVersions?.length !== 16) updateNeeded = true
        if(mapDataVersions?.length > 0) mapDataVersions = mapDataVersions.filter(x=>x.gameVersion !== obj?.latestGamedataVersion || x.localeVersion !== obj?.latestLocalizationBundleVersion)
        if(mapDataVersions?.length > 0) updateNeeded = true
      }
      if(updateNeeded){
        await updateData()
        dataVersions.updateInProgress = false
      }
      let configMapVersions = await mongo.find('configMaps', {}, )
    }
    setTimeout(StartSync, UPDATE_INTERVAL * 1000)
  }catch(e){
    log.error(e)
    setTimeout(StartSync, 5 * 1000)
  }
}
const SyncEvents = async()=>{
  try{
    await CheckEvents()
    setTimeout(SyncEvents, UPDATE_INTERVAL * 1000 * 4)
  }catch(e){
    log.error(e)
    setTimeout(SyncEvents, 5 * 1000)
  }
}
const UpdateDataCronAutoComplete = async()=>{
  try{
    let obj = await mongo.find('datacronList', {}, {_id: 1, nameKey: 1, expirationTimeMs: 1})
    if(obj?.length > 0){
      let array = [], timeNow = Date.now()
      for(let i in obj){
        if(obj[i].expirationTimeMs && +obj[i].expirationTimeMs > +timeNow){
          array.push({name: obj[i].nameKey, value: obj[i]._id})
        }
      }
      if(array?.length > 0) await mongo.set('autoComplete', {_id: 'datacron-set'}, { data: array, include: true })
    }
    setTimeout(()=>UpdateDataCronAutoComplete(), UPDATE_INTERVAL * 1000)
  }catch(e){
    log.error(e);
    setTimeout(()=>UpdateDataCronAutoComplete(), 5 * 1000)
  }
}

CheckMongo()
