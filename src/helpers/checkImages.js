'use strict'
const log = require('logger');
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')
const gitClient = require('src/gitClient')
const GIT_REPO = process.env.GIT_ASSET_REPO, GIT_TOKEN = process.env.GIT_TOKEN

let POD_NAME = process.env.POD_NAME || 'data-sync', SET_NAME = process.env.SET_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default', QUE_NAME = process.env.WORKER_QUE_NAME_SPACE || process.env.NAME_SPACE || 'default'
QUE_NAME += '.worker.assets'
let publisher
const addJob = async(data = {})=>{
  try{
    if(!publisher) return
    await publisher.send(QUE_NAME, data)
    return true
  }catch(e){
    log.error(e)
  }
}
const checkImages = async(imgs = [], assetVersion, dir, collectionId)=>{
  try{
    if(!dir) return
    let list = await gitClient.list({ repo: GIT_REPO, token: GIT_TOKEN, dir: dir })
    list = list?.map(x=>x?.name) || []
    let missing = imgs.filter(x=>!list?.includes(`${x}.png`))
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
    publisher = rabbitmq.createPublisher({ confirm: true, queues:[{queue: QUE_NAME, arguments: { 'x-message-ttl': 600000 }}]})
    log.info(`${POD_NAME} asset publisher is ready...`)
  }catch(e){
    log.error(e)
    setTimeout(createPublisher, 5000)
  }
}
createPublisher()
module.exports = async(imgs = [], assetVersion, dir, collectionId)=>{
  if(imgs.length === 0 || !assetVersion || !dir || !collectionId) return
  checkImages(imgs, assetVersion, dir, collectionId)
}
