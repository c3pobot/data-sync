'use strict'
const log = require('logger')
const { dataVersions } = require('./dataVersions')
const buildGameData = require('./buildGameData')
const getGameFiles = require('./getGameFiles')
const mapGameData = require('./mapGameData')
const buildConfigMaps = require('./buildConfigMaps')
const swgohClient = require('./client')
const mongo = require('mongoclient')
module.exports = async(force = false) =>{
  try{
    if(dataVersions.updateInProgress) return;
    dataVersions.updateInProgress = true
    let metaData = await swgohClient('metadata');
    if(!metaData?.assetVersion || !metaData?.latestGamedataVersion || !metaData?.latestLocalizationBundleVersion) return

    let remoteVersions = await getGameFiles(metaData, force)
    if(!remoteVersions || remoteVersions.gameVersion !== metaData.latestGamedataVersion || remoteVersions.localeVersion !== metaData.latestLocalizationBundleVersion) return
    let status = await buildConfigMaps(metaData.latestGamedataVersion, metaData.latestLocalizationBundleVersion, force)
    if(status && dataVersions.gameData !== metaData.latestGamedataVersion) status = await buildGameData(metaData.latestGamedataVersion)
    if(status) status = await mapGameData(metaData, force)
    if(status){
      dataVersions.gameVersion = metaData.latestGamedataVersion
      dataVersions.localeVersion = metaData.latestLocalizationBundleVersion
      await mongo.set('botSettings', {_id: 'gameVersion'}, { gameVersion: dataVersions.gameVersion, localeVersion: dataVersions.localeVersion })
      log.info('GameDataUpdate complete ..')
      log.info(`New gameVersion ${dataVersions.gameVersion}... New localeVersion ${dataVersions.localeVersion}...`)
    }else{
      log.error('GameDataUpdate error ...')
    }
    dataVersions.updateInProgress = false
  }catch(e){
    dataVersions.updateInProgress = false
    throw(e);
  }
}
