'use strict';
const log = require('logger')
const fs = require('fs')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);

const mongo = require('mongoclient')
const exchange = require('./exchange')
const rabbitmq = require('./rabbitmq')
const swgohClient = require('./swgohClient')
const gitClient = require('./gitClient')
const updateAutoComplete = require('./updateAutoComplete')
const mapSummoner = require('./mapSummoner')
//const consumer = require('./consumer')
const mapPlatoons = require('./mapPlatoons')
const checkEvents = require('./events')
const updateData = require('./updateData')
const { dataVersions } = require('./helpers/dataVersions')
const updateLocale = require('./updateLocale')

const UPDATE_INTERVAL = +process.env.UPDATE_INTERVAL || 30
const GIT_REPO = process.env.GIT_DATA_REPO, DATA_DIR = process.env.DATA_DIR || '/app/data/files'
let MAP_SUMMON = process.env.MAP_SUMMON || false
const CloneGameData = async()=>{
  try{
    let status
    if(fs.existsSync(`${DATA_DIR}/.git`)) status = await gitClient.pull(DATA_DIR)
    if(!status){
      fs.rmSync(DATA_DIR, { recursive: true, force: true })
      status = await gitClient.clone({ repo: GIT_REPO, dir: DATA_DIR })
    }
    if(status){
      CheckRabbitMQ()
      return
    }
    setTimeout(CloneGameData, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CloneGameData, 5000)
  }
}
const CheckRabbitMQ = ()=>{
  try{
    if(!rabbitmq?.status) log.debug(`rabbitmq is not ready...`)
    if(rabbitmq?.status){
      log.debug(`rabbitmq is ready...`)
      CheckMongo()
      return
    }
    setTimeout(CheckRabbitMQ, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckRabbitMQ, 5000)
  }
}
const CheckMongo = ()=>{
  try{
    let status = mongo.status()
    if(status){
      CheckAPIReady()
      return
    }
    setTimeout(CheckMongo, 5000)
  }catch(e){
    log.error(e);
    setTimeout(CheckMongo, 5000)
  }
}
const CheckAPIReady = async()=>{
  try{
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready data-sync...')
      //StartConsumer()
      exchange.start()
      startSync()
      syncEvents()
      mapPlatoons()
      return
    }
    setTimeout(CheckAPIReady, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckAPIReady, 5000)
  }
}

const startSync = async()=>{
  try{
    if(!dataVersions.updateInProgress){
      let updateNeeded = false
      let obj = await swgohClient('metadata')
      if(obj?.latestGamedataVersion && (dataVersions.gameVersion != obj?.latestGamedataVersion || dataVersions.localeVersion != obj?.latestLocalizationBundleVersion)) updateNeeded = true

      if(!updateNeeded){
        let configMapVersions = await mongo.find('configMaps', {}, { gameVersion: 1, localeVersion: 1})
        if(configMapVersions && configMapVersions?.length !== 4) updateNeeded = true
        if(configMapVersions?.length > 0) configMapVersions = configMapVersions.filter(x=>x.gameVersion !== obj?.latestGamedataVersion || x.localeVersion !== obj?.latestLocalizationBundleVersion)
        if(configMapVersions?.length > 0) updateNeeded = true
      }
      if(!updateNeeded){
        let gameDataVersion = (await mongo.find('botSettings', { _id: 'gameData' }, {version: 1 }))[0]
        if(!gameDataVersion) updateNeeded = true
        if(gameDataVersion?.version !== obj?.latestGamedataVersion) updateNeeded = true
      }
      if(!updateNeeded){
        let mapDataVersions = await mongo.find('versions', {}, { _id: 1, gameVersion: 1, localeVersion: 1 })
        if(mapDataVersions && mapDataVersions?.length !== 23) updateNeeded = true
        if(mapDataVersions?.length > 0) mapDataVersions = mapDataVersions.filter(x=>x.gameVersion !== obj?.latestGamedataVersion || x.localeVersion !== obj?.latestLocalizationBundleVersion)
        if(mapDataVersions?.length > 0) updateNeeded = true
      }
      if(updateNeeded){
        await updateData()
        dataVersions.updateInProgress = false
      }
      await updateLocale(obj?.latestLocalizationBundleVersion)
      if(MAP_SUMMON) await mapSummoner(obj)
      await updateAutoComplete(obj)
    }
    setTimeout(startSync, UPDATE_INTERVAL * 1000)
    //setTimeout(startSync, 5 * 1000)
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

CloneGameData()
