'use strict'
const fs = require('fs')
const got = require('got')
const publicDir = process.env.PUBLIC_DIR || '/home/node/app/public'
const bucket = process.env.S3_BUCKET || 'web-public'
const FetchImage = async(thumbnailName, version)=>{
  try{
    const imageName = thumbnailName?.replace('tex.', '')
    return await got(process.env.AE_URI+'/Asset/single?forceReDownload=true&version='+version+'&assetName='+imageName, {
      method: 'GET',
      decompress: true,
      encoding: 'base64',
      resolveBodyOnly: true
    })
  }catch(e){
    console.log('Error gettimg image '+thumbnailName)
  }
}
const SaveFile = async(path, data, encoding = 'base64')=>{
  try{
    return await fs.writeFileSync(path, data, {encoding: encoding})
  }catch(e){
    console.error(e);
  }
}
const uploadFile = async(fileName, file)=>{
  try{
    if(fileName){
      return await got(process.env.S3API_URI+'/put',{
        method: 'POST',
        decompress: true,
        responseType: 'json',
        resolveBodyOnly: true,
        json: {
          Key: fileName,
          Bucket: bucket,
          Body: file,
          Convert: "base64"
        }
      })
    }
  }catch(e){
    console.error(e);
  }
}
module.exports = async(version, name, dir)=>{
  try{
    const img = await FetchImage(name, version)
    if(img){
      console.log('Saving '+name+' '+dir+' to disc')
      await uploadFile(dir+'/'+name+'.png', img)
      return await SaveFile(publicDir+'/'+dir+'/'+name+'.png', img, 'base64')
    }
  }catch(e){
    console.error(e);
  }
}
