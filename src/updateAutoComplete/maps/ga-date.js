'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('gaEvents', {}, { id: 1, key: 1, mode: 1, season: 1, date: 1, leaderboardScanComplete: 1 })
  obj = obj?.filter(x=>x.leaderboardScanComplete)
  if(!obj || obj?.length == 0) return
  let autoComplete = obj.filter(x=>x.leaderboardScanComplete).map(x=>{ return { name: `${x.date} (${x.mode})`, value: x.key, mode: x.mode, eventInstanceId: x.id } })
  if(autoComplete?.length > 0) await mongo.set('autoComplete', { _id: 'ga-date' }, { data: autoComplete, include: true, gameVersion: gameVersion, localeVersion: localeVersion })
  return true
}
