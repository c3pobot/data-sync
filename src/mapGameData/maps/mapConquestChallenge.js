'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getDifficulty = (str)=>{
  if(str?.includes('_II_DIFF')) return 9
  if(str?.includes('_III_DIFF')) return 10
  return 8
}
const mapChallenge = async(challenge = {}, lang = {})=>{
  let tempObj = {
    id: challenge.id,
    nameKey: lang[challenge.nameKey] || challenge.nameKey,
    descKey: lang[challenge.descKey] || challenge.descKey,
    reward: +(challenge.reward?.find(x=>x.type == 22)?.minQuantity || 0),
    type: challenge.type,
    difficulty: getDifficulty(challenge.id)
  }
  await mongo.set('cqFeats', { _id: challenge.id }, tempObj)
}
module.exports = async(gameVerion, localeVersion)=>{
  let [ lang, challengeList ] = await Promise.all([
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('challenge', gameVerion)
  ])
  if(!lang || !challengeList) return

  let i = challengeList.length, array = []
  while(i--) array.push(mapChallenge(challengeList[i], lang))
  await Promise.all(array)
  return true
}
