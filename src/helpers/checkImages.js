'use strict'
const log = require('logger');
const mongo = require('mongoclient')
const rabbitmq = require('src/rabbitmq')
const gitClient = require('src/gitClient')

const GIT_REPO = process.env.GIT_ASSET_REPO, GIT_TOKEN = process.env.GIT_TOKEN

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
      let status = await rabbitmq.add('worker.assets', { cmd: 'save', id: `${dir}-${missing[i]}`, type: collectionId, img: missing[i], dir: dir, assetVersion: assetVersion, timestamp: Date.now()})
      if(!status) throw(`Error adding job to que for ${missing[i]} in ${dir}`)
    }
    //await mongo.set('missingAssets', {_id: collectionId}, {imgs: missing, dir: dir, assetVersion: assetVersion})
    return
  }catch(e){
    log.error(e)
    setTimeout(()=>checkImages(imgs, assetVersion, dir, collectionId), 5000)
  }
}

module.exports = async(imgs = [], assetVersion, dir, collectionId)=>{
  if(imgs.length === 0 || !assetVersion || !dir || !collectionId) return
  checkImages(imgs, assetVersion, dir, collectionId)
}
