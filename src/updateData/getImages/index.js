'use strict'
const s3client = require('s3client')
const path = require('path')
const S3_BUCKET = process.env.S3_IMAGE_BUCKET

const checkImages = async(imgs = [], assetVersion, dir, collectionId)=>{
  try{
    let remoteList = await s3client.list(S3_BUCKET, dir)
    if(!remoteList) remoteList = []
    remoteList = remoteList.map(x=>x.Key)
    let missing = imgs.filter(x=>!remoteList?.includes(dir+'/'+x+'.png'))
    if(!missing) throw('Error determing missing assets for '+dir)
    console.log('Missing '+missing.length+' image for '+dir+'...')
    if(missing.length === 0) return
    await mongo.set('missingAssets', {_id: collectionId}, {imgs: missing, dir: dir, assetVersion: assetVersion})
    return
  }catch(e){
    console.error(e)
    setTimeout(()=>checkImages(imgs, assetVersion, dir, collectionId), 5000)
  }
}
module.exports = async(imgs = [], assetVersion, dir, collectionId)=>{
  try{
    if(imgs.length === 0 || !assetVersion || !dir || !collectionId) return
    checkImages(imgs, assetVersion, dir, collectionId)
  }catch(e){
    throw(e);
  }
}
