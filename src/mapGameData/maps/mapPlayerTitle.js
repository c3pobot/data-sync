'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapTitle = async(title = {}, lang = {})=>{
  title.nameKey = lang[title.nameKey] || title.nameKey
  title.descKey = lang[title.descKey] || title.descKey
  await mongo.set('playerTitleList', { _id: title.id }, title)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ lang, titles ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('playerTitle', gameVersion)
  ])
  if(!lang || !titles || titles?.length == 0) return
  let i = titles.length, array = []
  while(i--) array.push(mapTitle(titles[i], lang))
  await Promise.all(array)
  return true
}
