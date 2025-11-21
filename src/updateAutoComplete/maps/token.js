'use strict'
const mongo = require('mongoclient')
module.exports = async(gameVersion, localeVersion)=>{
  let obj = await mongo.find('lightspeedToken', {}, { id: 1, nameKey: 1 })
  if(!obj || obj?.length == 0) return

  let array = []
  for(let i in obj){
    array.push({ name: obj[i].nameKey, value: obj[i].id })
  }
  if(array?.length > 0){
    await mongo.set('autoComplete', { _id: 'token' }, { data: array, include: true, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.token': 'token' })
  }
  return true
}
