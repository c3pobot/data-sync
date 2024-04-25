const log = require('logger')
const minio = require('./minio')
const fs = require('fs')
const path = require('path')
const swgohClient = require(`src/client`)
const mongo = require('mongoclient')
const checkFile = async(fileName, version, force)=>{
  try{
    if(!version || !fileName) return
    if(force) return
    let obj = await fs.readFileSync(path.join(baseDir, 'data', 'files', fileName))
    if(obj) obj = JSON.parse(obj)
    if(obj?.data && obj?.version === version) return true
  }catch(e){
    return
  }
}
const saveFile = async(fileName, version, force)=>{
  try{
    if(!fileName || !version) return
    let fileExists = await checkFile(fileName, version, force)
    if(fileExists) return true
    let obj = await minio.get('gamedata', null, fileName)
    if(obj?.version === version && obj.data){
      //log.info(`saving ${fileName}`)
      await fs.writeFileSync(path.join(baseDir, 'data', 'files', fileName), JSON.stringify(obj))
      if(fileName === 'Loc_ENG_US.txt.json') await mongo.set('localeFiles', { _id: 'ENG_US' }, obj.data)
      return true
    }
  }catch(e){
    throw(e);
  }
}
const saveEnums = async(version)=>{
  try{
    let data = await swgohClient('enums')
    if(data){
      await fs.writeFileSync(path.join(baseDir, 'data', 'files', 'enums.json'), JSON.stringify({ version: version, data: data }))
      return true
    }
  }catch(e){
    throw(e)
  }
}
module.exports = async(versions = {}, force)=>{
  try{
    log.info('getting files from object storage...')
    let remoteVersions = await minio.get('gamedata', null, 'versions.json')
    if(remoteVersions?.gameVersion !== versions.latestGamedataVersion || remoteVersions?.localeVersion !== versions.latestLocalizationBundleVersion){
      log.info('Object storage versions not updated yet...')
      return
    }
    let totalCount = Object.values(remoteVersions)?.filter(x=>x === versions.latestGamedataVersion)
    if(totalCount?.length === 0 || !totalCount) return
    let count = 1
    for(let i in remoteVersions){
      if(remoteVersions[i] === versions.latestGamedataVersion && i !== 'gameVersion'){
        let status = await saveFile(i, versions.latestGamedataVersion, force)
        if(status === true) count++;
      }
    }
    log.info(`Pulled ${count}/${totalCount?.length} from object storage for ${versions.latestGamedataVersion}`)
    if(count !== +totalCount.length) return false
    let status = await saveFile('Loc_ENG_US.txt.json', versions.latestLocalizationBundleVersion)
    if(status) status = await saveFile('Loc_Key_Mapping.txt.json', versions.latestLocalizationBundleVersion)
    if(status) status = await saveEnums(versions.latestGamedataVersion)
    if(status) return remoteVersions
  }catch(e){
    throw(e);
  }
}
