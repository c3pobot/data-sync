'use strict'
const log = require('logger')
const { gameData } = require('./buildGameData/gameData')
const BuildGameData = require('./buildGameData')
const GetGameFiles = require('./getGameFiles')
const MapGameData = require('./mapGameData')

module.exports = async(force = false)=>{
  try{
    if(dataUpateInProgress) return
    dataUpateInProgress = true
    let metaData = await Client('metadata');
    if(!metaData?.assetVersion || !metaData?.latestGamedataVersion || !metaData?.latestLocalizationBundleVersion) return

    let remoteVersions = await GetGameFiles(metaData, force)
    if(!remoteVersions || remoteVersions.gameVersion !== metaData.latestGamedataVersion || remoteVersions.localeVersion !== metaData.latestLocalizationBundleVersion) return
    let status = await MapGameData(metaData, force)
    if(status) status = await BuildGameData(metaData.latestGamedataVersion)

    if(status){
      GameDataVersions.gameVersion = metaData.latestGamedataVersion
      GameDataVersions.localeVersion = metaData.latestLocalizationBundleVersion
      await mongo.set('botSettings', {_id: 'gameVersion'}, GameDataVersions)
      log.info('GameDataUpdate complete ..')
      log.info(`New gameVersion ${GameDataVersions.gameVersion}... New localeVersion ${GameDataVersions.localeVersion}...`)
    }else{
      log.error('GameDataUpdate error ...')
      console.log('GameDataUpdate error ...')
    }
    dataUpateInProgress = false
  }catch(e){
    dataUpateInProgress = false
    log.error(e);
  }
}
