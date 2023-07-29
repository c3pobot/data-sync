'use strict'
const { gameData } = require('./buildGameData/gameData')
const BuildGameData = require('./buildGameData')
const GetGameFiles = require('./getGameFiles')
const GetImages = require('./getImages')
const MapGameData = require('./mapGameData')

module.exports = async(force = false)=>{
  try{
    dataUpateInProgress = true
    let mapNeeded = true
    const metaData = await Client('metadata');
    if(!metaData || !metaData.latestGamedataVersion || !metaData.latestLocalizationBundleVersion) return

    let remoteVersions = await GetGameFiles(metaData)
    if(!remoteVersions || remoteVersions.gameVersion !== metaData.latestGamedataVersion || remoteVersions.localeVersion !== metaData.latestLocalizationBundleVersion) return

    let status = await BuildGameData(metaData.latestGamedataVersion)

    if(status && !force && remoteVersions.gameVersion === metaData.latestGamedataVersion && remoteVersions.localeVersion === metaData.latestLocalizationBundleVersion){
      mapNeeded = false
    }

    if(mapNeeded) status = await MapGameData(metaData)
    if(status){
      GameDataVersions.gameVersion = metaData.latestGamedataVersion
      GameDataVersions.localeVersion = metaData.latestLocalizationBundleVersion
      await mongo.set('botSettings', {_id: 'gameVersion'}, GameDataVersions)
      console.log('GameDataUpdate complete ...')
      console.log('New gameVersion '+GameDataVersions.gameVersion+' New localeVersion '+GameDataVersions.localeVersion)
      //GetImages(metaData.assetVersion)
    }else{
      console.log('GameDataUpdate error ...')
    }
  }catch(e){
    console.error(e);
  }
}
