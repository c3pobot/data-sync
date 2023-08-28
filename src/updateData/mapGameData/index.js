'use strict'
const log = require('logger')
const lists = require('./lists')
const configMaps = require('./configMaps')
const mongo = require('mongoclient')
const checkVersions = (gameVersion, localeVersion, assetVersion, data)=>{
  try{
    let status = true
    if(!gameVersion || !localeVersion || !assetVersion || !data) return
    if(data.gameVersion !== gameVersion) status = false
    if(data.localeVersion !== localeVersion) status = false
    if(data.assetVersion !== assetVersion) status = false
    return status
  }catch(e){
    throw(e)
  }
}
const checkData = async(gameVersion, localeVersion, assetVersion, force = false)=>{
  try{
    let count = 0, totalCount = 0, missing = []
    for(let i in lists){
      if(force){
        missing.push(i)
        continue;
      }
      let versions = (await mongo.find('versionsOld', {_id: i}))[0]
      if(versions){
        let status = checkVersions(gameVersion, localeVersion, assetVersion, versions)
        if(status === true){
          totalCount++;
        }else{
          log.info('missing collection '+i+'...')
          missing.push(i)
        }
      }else{
        log.info('missing collection '+i+'...')
        missing.push(i)
      }
    }
    return missing
  }catch(e){
    throw(e)
  }
}

module.exports = async({ assetVersion, latestGamedataVersion, latestLocalizationBundleVersion}, force = false)=>{
  try{
    let count = 0, totalCount = 0, errorObj = { error: 0, complete: 0 }
    let status = await configMaps(latestGamedataVersion, latestLocalizationBundleVersion, force)
    if(!status) return
    let missing = await checkData(latestGamedataVersion, latestLocalizationBundleVersion, assetVersion, force)
    if(missing?.length > 0){
      log.info('Mapping GameData...')
      for(let i in missing){
        if(!status) break;
        count++;
        await lists[missing[i]](errorObj, assetVersion)
        if(errorObj?.error) status = false
        if(status){
          totalCount++
          await mongo.set('versionsOld', {_id: missing[i]}, {assetVersion: assetVersion, gameVersion: latestGamedataVersion, localeVersion: latestLocalizationBundleVersion})
        }
      }
    }
    if(status){
      log.info('Game Data mapping complete...')
    }else{
      log.error('Game data mapping error...')
    }
    return status
  }catch(e){
    throw(e)
  }
}
