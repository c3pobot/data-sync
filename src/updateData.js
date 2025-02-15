'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const swgohClient = require('./swgohClient')
const rabbitmq = require('./rabbitmq')

const updateAutoComplete = require('./updateAutoComplete')
const { dataVersions } = require('./helpers/dataVersions')

const buildGameData = require('./buildGameData')
const getGameFiles = require('./getGameFiles')
const mapGameData = require('./mapGameData')
const buildConfigMaps = require('./buildConfigMaps')

const publishVersions = async()=>{
  try{
    let status = await rabbitmq.notify({ cmd: 'versionNotify', gameVersion: dataVersions.gameVersion, localeVersion: dataVersions.localeVersion, timestamp: Date.now() })
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
    let localVersions = await getGameFiles(metaData)
    if(!localVersions) return
    if(localVersions.gameVersion !== metaData.latestGamedataVersion || localVersions.localeVersion !== metaData.latestLocalizationBundleVersion) return

    let status = await buildConfigMaps(metaData.latestGamedataVersion, metaData.latestLocalizationBundleVersion, force)
    if(status && dataVersions.gameData !== metaData.latestGamedataVersion) status = await buildGameData(metaData.latestGamedataVersion)
    if(status) status = await mapGameData(metaData, force)
    if(status) status = await updateAutoComplete(metaData, force)
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
