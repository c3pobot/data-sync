const log = require('logger')
const gitClient = require('./gitClient')
const readFile = require('./helpers/readFile')
const GIT_REPO = process.env.GIT_DATA_REPO, DATA_DIR = process.env.DATA_DIR || '/app/data/files', GIT_TOKEN = process.env.GIT_TOKEN

const gitPull = async()=>{
  let status = await gitClient.pull(DATA_DIR)
  if(!status){
    log.info('error performing git pull')
    return
  }
  return await readFile('allVersions')
}
module.exports = async(versions = {}, force)=>{
  let localVersions = await readFile('allVersions')
  if(localVersions?.gameVersion === versions.latestGamedataVersion && localVersions?.localeVersion === versions.latestLocalizationBundleVersion) return localVersions
  let remoteVersions = await gitClient.getJson({ repo: GIT_REPO, fileName: 'allVersions.json', token: GIT_TOKEN })
  if(remoteVersions?.gameVersion !== versions.latestGamedataVersion || remoteVersions?.localeVersion !== versions.latestLocalizationBundleVersion){
    log.info('git versions not updated yet...')
    return
  }
  return await gitPull()
}
