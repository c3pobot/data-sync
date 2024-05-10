'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapChallenge = async(challenge = {}, lang = {})=>{
  let tempObj = {
    id: challenge.id,
    nameKey: lang[challenge.nameKey] || challenge.nameKey,
    descKey: lang[challenge.descKey] || challenge.descKey,
    reward: +(challenge.reward?.find(x=>x.type == 22)?.minQuantity || 0),
    type: challenge.type,
    difficulty: 8
  }
  if(challenge.id.includes('_III_DIFF')) tempObj.difficulty = 9
  await mongo.set('cqFeats', { _id: challenge.id }, tempObj)
}
module.exports = async(gameVerion, localeVersion)=>{
  let [ lang, obj ] = Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('challenge', gameVerion)
  ])
  if(!lang || !obj) return

  let i = obj.length, array = []
  while(i--) array.push(mapChallenge(obj[i], lang))
  await Promise.all(array)
  return true
}
