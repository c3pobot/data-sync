'use strict'
const log = require('logger');
const minio = require(`src/assetGetter/minio`);
const mongo = require('mongoclient')
const rabbitmq = require('src/rabbitmq')
const S3_BUCKET = process.env.S3_IMAGE_BUCKET
const POD_NAME = process.env.POD_NAME || 'data-sync', SET_NAME = process.env.SET_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default'
let publisher, queName = `${NAME_SPACE}.worker.assets`
const addJob = async(data = {})=>{
  try{
    if(!publisher) return
    await publisher.send(queName, data)
    return true
  }catch(e){
    log.error(e)
  }
}
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
    for(let i in missing){
      let status = await addJob({ type: collectionId, img: missing[i], dir: dir, assetVersion: assetVersion, timestamp: Date.now()})
      if(!status) throw(`Error adding job to que for ${missing[i]} in ${dir}`)
    }
    //await mongo.set('missingAssets', {_id: collectionId}, {imgs: missing, dir: dir, assetVersion: assetVersion})
    return
  }catch(e){
    log.error(e)
    setTimeout(()=>checkImages(imgs, assetVersion, dir, collectionId), 5000)
  }
}
const createPublisher = ()=>{
  try{
    if(!rabbitmq.ready){
      setTimeout(createPublisher, 5000)
      return
    }
    publisher = rabbitmq.createPublisher({ confirm: true, queues:[{queue: queName, durable: true, arguments: { 'x-queue-type': 'quorum', 'x-message-ttl': 600000 }}]})
    log.info(`${POD_NAME} asset publisher is ready...`)
  }catch(e){
    log.error(e)
    setTimeout(createPublisher, 5000)
  }
}
createPublisher()
module.exports = async(imgs = [], assetVersion, dir, collectionId)=>{
  try{
    if(imgs.length === 0 || !assetVersion || !dir || !collectionId) return
    checkImages(imgs, assetVersion, dir, collectionId)
  }catch(e){
    throw(e);
  }
}
