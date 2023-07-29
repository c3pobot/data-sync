'use strict'
const got = require('got')
const FetchImage = async(thumbnailName, version, manifest)=>{

}
module.exports.list = async(version)=>{
  try{
    return await got(process.env.AE_URI+'/Asset/list?version='+version, {
      method: 'GET',
      decompress: true,
      responseType: 'json',
      resolveBodyOnly: true
    })
  }catch(e){
    console.log(e)
  }
}

module.exports.get = async(thumbnailName, version, manifest)=>{
  try{
    const imageName = thumbnailName.split('.')[1]
    if(manifest?.filter(x=>x === imageName).length > 0) return await got(process.env.AE_URI+'/Asset/single?forceReDownload=true&version='+version+'&assetName='+imageName, {
      method: 'GET',
      decompress: true,
      encoding: 'base64',
      resolveBodyOnly: true
    })

  }catch(e){
    console.log(e)
  }
}
