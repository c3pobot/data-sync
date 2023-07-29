const s3client = require('s3client')
const fs = require('fs')
const path = require('path')

const saveFile = async(fileName, version)=>{
  try{
    if(!fileName || !version) return
    let obj = await s3client.get('gamedata', fileName)
    if(obj?.version === version && obj.data){
      await fs.writeFileSync(path.join(baseDir, 'data', 'files', fileName), JSON.stringify(obj))
      return true
    }
  }catch(e){
    console.error(e);
  }
}
module.exports = async(versions = {})=>{
  try{
    console.log('getting files from object storage...')
    let remoteVersions = await s3client.get('gamedata', 'versions.json')
    if(remoteVersions?.gameVersion !== versions.latestGamedataVersion || remoteVersions?.localeVersion !== versions.latestLocalizationBundleVersion){
      console.log('Object storage versions not updated yet...')
      return
    }
    let totalCount = Object.values(remoteVersions)?.filter(x=>x === versions.latestGamedataVersion)
    if(totalCount?.length === 0 || !totalCount) return
    let count = 1
    for(let i in remoteVersions){
      if(remoteVersions[i] === versions.latestGamedataVersion && i !== 'gameVersion'){
        console.log('saving '+i)
        let status = await saveFile(i, versions.latestGamedataVersion)
        if(status === true) count++;
      }
    }
    console.log('pulled '+count+'/'+totalCount.length+' from object storage')
    if(count !== +totalCount.length) return false
    let status = await saveFile('Loc_ENG_US.txt.json', versions.latestLocalizationBundleVersion)
    if(status) status = await saveFile('Loc_Key_Mapping.txt.json', versions.latestLocalizationBundleVersion)
    if(status) return remoteVersions
  }catch(e){
    console.error(e);
  }
}
