'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const maps = require('./maps')

const checkVersions = (gameVersion, localeVersion, assetVersion, data)=>{
  if(!gameVersion || !localeVersion || !assetVersion || !data) return
  if(data.gameVersion !== gameVersion) return
  if(data.localeVersion !== localeVersion) return
  if(data.assetVersion !== assetVersion) return
  return true
}
const checkData = async(gameVersion, localeVersion, assetVersion, force = false)=>{
  if(!gameVersion || !localeVersion || !assetVersion) return
  let missing = []
  for(let i in maps){
    let versions = (await mongo.find('versions', { _id: i }))[0]
    let status = checkVersions(gameVersion, localeVersion, assetVersion, versions)
    if(force || !versions || !status){
      missing.push(i)
      log.info(`collection ${i} needs updated...`)
    }
  }
  return missing
}

module.exports = async({ assetVersion, latestGamedataVersion, latestLocalizationBundleVersion }, force = false)=>{
  let missing = await checkData(latestGamedataVersion, latestLocalizationBundleVersion, assetVersion, force)
  if(!missing) return

  if(missing.length == 0) return true

  let status = true
  log.info('Mapping GameData...')
  for(let i in missing){
    if(!status) break;
    count++;
    log.info(`updating collection ${missing[i]}...`)
    status = await maps[missing[i]](latestGamedataVersion, latestLocalizationBundleVersion, assetVersion)
    if(status){
      totalCount++
      await mongo.set('versions', { _id: missing[i] }, { assetVersion: assetVersion, gameVersion: latestGamedataVersion, localeVersion: latestLocalizationBundleVersion })
    }
  }
  if(status){
    log.info('Game Data mapping complete...')
  }else{
    log.error('Game data mapping error...')
  }
  return status
}
