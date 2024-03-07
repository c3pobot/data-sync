'use strict'
const log = require('logger');
const minio = require('../../minio');

const S3_BUCKET = process.env.S3_IMAGE_BUCKET

const checkImages = async(imgs = [], assetVersion, dir, collectionId)=>{
  try{
    let key
    if(dir) key = `${dir}`
    let bucketList = await minio.list(S3_BUCKET, key)
    if(!bucketList) bucketList = []
    bucketList = bucketList.map(x=>x.name)

    let missing = imgs.filter(x=>!bucketList?.includes(`${dir}/${x}.png`))
    if(!missing) throw('Error determing missing assets for '+dir)
    log.info(`Missing ${missing?.length}/${imgs?.length} images for ${dir}...`)
    if(missing.length === 0) return
    await mongo.set('missingAssets', {_id: collectionId}, {imgs: missing, dir: dir, assetVersion: assetVersion})
    return
  }catch(e){
    log.error(e)
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
