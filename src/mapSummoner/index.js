'use strict'
const log = require('logger')
const mongo = require('mongoclient')
let Cmds = {}
Cmds.summonerList = require('./mapSummonerList')
Cmds.summonerData = require('./mapSummonerData')
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
  for(let i in Cmds){
    let versions = (await mongo.find('summonerVersions', { _id: i }))[0]
    let status = checkVersions(gameVersion, localeVersion, assetVersion, versions)
    if(force || !versions || !status){
      missing.push(i)
      log.info(`collection ${i} needs updated...`)
    }
  }
  return missing
}

module.exports = async({ assetVersion, latestGamedataVersion, latestLocalizationBundleVersion }, force = false)=>{
  if(!process.env.MAP_SUMMON) return true
  let missing = await checkData(latestGamedataVersion, latestLocalizationBundleVersion, assetVersion, force)
  if(!missing) return

  if(missing.length == 0) return true

  let status
  for(let i in missing){
    log.info(`updating collection ${missing[i]}...`)
    status = await Cmds[missing[i]](latestGamedataVersion, latestLocalizationBundleVersion, assetVersion)
    if(!status) break;
    if(status) await mongo.set('summonerVersions', { _id: missing[i] }, { assetVersion: assetVersion, gameVersion: latestGamedataVersion, localeVersion: latestLocalizationBundleVersion })
  }
  if(status) log.info('summoner mapping complete')
  return status
}
