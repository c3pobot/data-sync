'use strict'
const mongo = require('mongoclient')
const checkImages = require('src/helpers/checkImages')
const getFile = require('src/helpers/getFile')

const mapPortait = async(portrait = {}, lang = {}, images = [])=>{
  portrait.nameKey = lang[portrait.nameKey] || portrait.nameKey
  portrait.descKey = lang[portrait.descKey] || portrait.descKey
  images.push(portrait.icon)
  await mongo.set('playerPortraitList', { _id: portrait.id }, portrait)
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let [ lang, portraits ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('playerPortrait', gameVersion)
  ])
  if(!lang || !portraits || portraits?.length == 0) return

  let images = [], i = portraits.length, array = []
  while(i--) array.push(mapPortait(portraits[i], lang, images))
  await Promise.all(array)
  if(images?.length > 0 && assetVersion) checkImages(images, assetVersion, 'asset', 'playerPortraitList')
  return true
}
