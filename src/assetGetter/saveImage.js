'use strict'
const minio = require('../minio')
const fetch = require('./fetch')
const S3_BUCKET = process.env.S3_IMAGE_BUCKET
const AE_URI = process.env.AE_URI

const FetchImage = async(thumbnailName, version)=>{
  try{
    if(!AE_URI || !thumbnailName || !version) return
    let assest = thumbnailName?.replace('tex.', '')
    let res = await fetch(`${AE_URI}/Asset/single?forceReDownload=true&version=${version}&assetName=${assest}`)
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
    return await minio.putImage(S3_BUCKET, dir, thumbnailName, img)
  }catch(e){
    throw(e);
  }
}
