'use strict'
const gitClient = require('src/gitClient')
const exchange = require('src/helpers/exchange')
const AE_URI = process.env.AE_URI, GIT_REPO = process.env.GIT_ASSET_REPO, GIT_TOKEN = process.env.GIT_TOKEN, GIT_USER = process.env.GIT_USERNAME, GIT_EMAIL = process.env.GIT_EMAIL
let NAME_SPACE = process.env.NAME_SPACE || 'default'
let ROUTING_KEY = process.env.GAME_DATA_TOPIC || `${NAME_SPACE}.data-sync.assets`


const FetchImage = async(thumbnailName, version)=>{
  if(!AE_URI || !thumbnailName || !version) return
  let assest = thumbnailName?.replace('tex.', '')
  return await fetch(`${AE_URI}/Asset/single?forceReDownload=true&version=${version}&assetName=${assest}`)
}

module.exports = async(version, thumbnailName, dir)=>{
  if(!version || !thumbnailName || !dir) return
  let img = await FetchImage(thumbnailName, version)
  if(!img) return
  let status = status = await exchange.send(ROUTING_KEY, { fileName: thumbnailName, dir: dir, file: img, timestamp: Date.now() })
  if(status) status = await gitClient.push({ repo: GIT_REPO, filename: `${dir}/${thumbnailName}.png`, token: GIT_TOKEN, data: img, user: GIT_USER, email: GIT_EMAIL, commitMsg: version})
  return status
}
