'use strict';
const log = require('logger')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
//require('./assetGetter')

const mongo = require('mongoclient')
const excahnge = require('./helpers/excahnge')
const swgohClient = require('./swgohClient')
const gitClient = require('./gitClient')
//const consumer = require('./consumer')
const mapPlatoons = require('./mapPlatoons')
const checkEvents = require('./events')
const updateData = require('./updateData')
const { dataVersions } = require('./helpers/dataVersions')
const UPDATE_INTERVAL = +process.env.UPDATE_INTERVAL || 30
const GIT_REPO = process.env.GIT_DATA_REPO, DATA_DIR = process.env.DATA_DIR || '/app/data/files'
const cloneGameData = async()=>{
  try{
    let status = await gitClient.clone({ repo: GIT_REPO, dir: DATA_DIR })
    if(status?.code === 0){
      checkTopicPublisher()
      return
    }
    setTimeout(cloneGameData, 5000)
  }catch(e){
    log.error(e)
    setTimeout(cloneGameData, 5000)
  }
}
const checkTopicPublisher = ()=>{
  try{
    let status = topicPublisher.status()
    if(status){
      checkMongo()
      return
    }
    setTimeout(checkTopicPublisher, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkTopicPublisher, 5000)
  }
}
const checkMongo = ()=>{
  try{
    let status = mongo.status()
    if(status){
      checkAPIReady()
      return
    }
    setTimeout(checkMongo, 5000)
  }catch(e){
    log.error(e);
    setTimeout(checkMongo, 5000)
  }
}
const checkAPIReady = async()=>{
  try{
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready data-sync...')
      //StartConsumer()
      startSync()
      updateDataCronAutoComplete()
      syncEvents()
      mapPlatoons()
      return
    }
    setTimeout(checkAPIReady, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkAPIReady, 5000)
  }
}
/*
const StartConsumer = async()=>{
  try{
    let status = await consumer.start()
    if(status){
      StartSync()
      UpdateDataCronAutoComplete()
      SyncEvents()
      return
    }
    setTimeout(StartConsumer, 5000)
  }catch(e){
    log.error(e)
    setTimeout(StartConsumer, 5000)
  }
}
*/
const startSync = async()=>{
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
        if(mapDataVersions && mapDataVersions?.length !== 19) updateNeeded = true
        if(mapDataVersions?.length > 0) mapDataVersions = mapDataVersions.filter(x=>x.gameVersion !== obj?.latestGamedataVersion || x.localeVersion !== obj?.latestLocalizationBundleVersion)
        if(mapDataVersions?.length > 0) updateNeeded = true
      }
      if(updateNeeded){
        await updateData()
        dataVersions.updateInProgress = false
      }
    }
    //setTimeout(StartSync, UPDATE_INTERVAL * 1000)
    setTimeout(startSync, 5 * 1000)
  }catch(e){
    log.error(e)
    setTimeout(startSync, 5 * 1000)
  }
}
const syncEvents = async()=>{
  try{
    await checkEvents()
    setTimeout(syncEvents, UPDATE_INTERVAL * 1000 * 4)
  }catch(e){
    log.error(e)
    setTimeout(syncEvents, 5 * 1000)
  }
}
const updateDataCronAutoComplete = async()=>{
  try{
    let obj = await mongo.find('datacronList', {}, {_id: 1, nameKey: 1, expirationTimeMs: 1})
    if(obj?.length > 0){
      let array = [], timeNow = Date.now()
      for(let i in obj){
        if(obj[i].expirationTimeMs && +obj[i].expirationTimeMs > +timeNow){
          array.push({name: obj[i].nameKey, value: obj[i]._id})
        }
      }
      if(array?.length > 0){
        await mongo.set('autoComplete', {_id: 'datacron-set'}, { data: array, include: true })
      }
    }
    setTimeout(updateDataCronAutoComplete, UPDATE_INTERVAL * 1000)
  }catch(e){
    log.error(e);
    setTimeout(updateDataCronAutoComplete, 5 * 1000)
  }
}

cloneGameData()
