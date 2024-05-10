const log = require('logger')
const gitClient = require('./gitClient')
const readFile = require('./helpers/readFile')
const GIT_REPO = process.env.GIT_DATA_REPO

module.exports = async(versions = {}, force)=>{
  let remoteVersions = await gitClient.getJson({ repo: GIT_REPO, fileName: 'allVersions.json'})
  if(remoteVersions?.gameVersion !== versions.latestGamedataVersion || remoteVersions?.localeVersion !== versions.latestLocalizationBundleVersion){
    log.info('git versions not updated yet...')
    return
  }
  let status = await gitClient.pull('/app/data/files')
  if(!status){
    log.info('error performing git pull')
    return
  }
  return await readFile('allVersions')
}
