'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const maps = require('./maps')
const checkVersions = (gameVersion, localeVersion, data)=>{
  if(!gameVersion || !localeVersion || !data) return
  if(data.gameVersion !== gameVersion) return
  if(data.localeVersion !== localeVersion) return
  return true
}
const checkData = async(gameVersion, localeVersion, force = false)=>{
  if(!gameVersion || !localeVersion ) return
  let missing = []
  let data = await mongo.find('autoComplete', {}, { _id: 1, gameVersion: 1, localeVersion: 1})
  for(let i in maps){
    //missing.push(i)
    //continue
    let status = checkVersions(gameVersion, localeVersion, data.find(x=>x._id === i))
    if(force || !status){
      missing.push(i)
      log.info(`${i} autoComplete needs updated...`)
    }
  }
  return missing
}
module.exports = async({ latestGamedataVersion, latestLocalizationBundleVersion, config }, force)=>{
  let missing = await checkData(latestGamedataVersion, latestLocalizationBundleVersion, force)
  if(!missing) return

  if(missing.length == 0){
    maps['datacron-set'](latestGamedataVersion, latestLocalizationBundleVersion)
    //maps['ga-date'](latestGamedataVersion, latestLocalizationBundleVersion)
    maps['journey'](latestGamedataVersion, latestLocalizationBundleVersion)
    return true
  }
  let status
  log.info('Mapping autoComplete...')
  for(let i in missing){
    log.info(`updating autoComplete ${missing[i]}...`)
    status = await maps[missing[i]](latestGamedataVersion, latestLocalizationBundleVersion, config)
    if(!status) break;
  }
  if(status){
    log.info('autoComplete mapping complete...')
  }else{
    log.error('autoComplete mapping error...')
  }
  return status
}
