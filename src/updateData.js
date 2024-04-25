'use strict'
const log = require('logger')
const { dataVersions } = require('./dataVersions')
const buildGameData = require('./buildGameData')
const getGameFiles = require('./getGameFiles')
const mapGameData = require('./mapGameData')
const buildConfigMaps = require('./buildConfigMaps')
const swgohClient = require('./client')
const mongo = require('mongoclient')
let routingKey = process.env.GAME_DATA_TOPIC || `default.data-sync.game-data`
const topicPublisher = require('./topicPublisher')
const publishVersions = async()=>{
  try{
    let status = await topicPublisher.send(routingKey, { gameVersion: dataVersions.gameVersion, localeVersion: dataVersions.localeVersion, timestamp: Date.now() })
    if(status){
      log.info(`published new gameVersion ${dataVersions.gameVersion}... New localeVersion ${dataVersions.localeVersion} to rabbitmq...`)
      return
    }
    setTimeout(publishVersions, 5000)
  }catch(e){
    log.error(e)
    setTimeout(publishVersions, 5000)
  }
}
module.exports = async(force = false) =>{
  try{
    if(dataVersions.updateInProgress) return;
    dataVersions.updateInProgress = true
    let metaData = await swgohClient('metadata');
    if(!metaData?.assetVersion || !metaData?.latestGamedataVersion || !metaData?.latestLocalizationBundleVersion) return

    let remoteVersions = await getGameFiles(metaData, force)
    if(!remoteVersions || remoteVersions.gameVersion !== metaData.latestGamedataVersion || remoteVersions.localeVersion !== metaData.latestLocalizationBundleVersion){
      if(!force) return
    }
    let status = await buildConfigMaps(metaData.latestGamedataVersion, metaData.latestLocalizationBundleVersion, force)
    if(status && dataVersions.gameData !== metaData.latestGamedataVersion) status = await buildGameData(metaData.latestGamedataVersion)
    if(status) status = await mapGameData(metaData, force)
    if(status){
      dataVersions.gameVersion = metaData.latestGamedataVersion
      dataVersions.localeVersion = metaData.latestLocalizationBundleVersion
      await mongo.set('botSettings', {_id: 'gameVersion'}, { gameVersion: dataVersions.gameVersion, localeVersion: dataVersions.localeVersion })

      log.info('GameDataUpdate complete ..')
      log.info(`New gameVersion ${dataVersions.gameVersion}... New localeVersion ${dataVersions.localeVersion}...`)
      publishVersions()
    }else{
      log.error('GameDataUpdate error ...')
    }
    dataVersions.updateInProgress = false
    return dataVersions
  }catch(e){
    dataVersions.updateInProgress = false
    throw(e);
  }
}
