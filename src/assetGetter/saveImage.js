'use strict'
const path = require('path')
const s3client = require('s3client')
const fetch = require('./fetch')
const S3_BUCKET = process.env.S3_IMAGE_BUCKET
const AE_URI = process.env.AE_URI

const FetchImage = async(thumbnailName, version)=>{
  try{
    if(!AE_URI || !thumbnailName || !version) return
    let assest = thumbnailName?.replace('tex.', '')
    let uri = 'Asset/single?forceReDownload=true&version='+version+'&assetName='+assest
    let res = await fetch(path.join(AE_URI, uri))
    if(res) return res.toString('base64')
  }catch(e){
    throw(e);
  }
}

module.exports = async(version, thumbnailName, dir)=>{
  try{
    if(!version || !thumbnailName || !dir) return
    let img = await FetchImage(thumbnailName, version)
    if(!img) return
    return await s3client.put(S3_BUCKET, path.join(dir, thumbnailName+'.png'), img)
  }catch(e){
    throw(e);
  }
}
