'use strict'
const log = require('logger')
const swgohClient = require(`src/client`)
const mongo = require('mongoclient')

module.exports = async(uId)=>{
  try{
    let obj = await swgohClient('authGuest', {uid: uId})
    if(obj?.authId && obj?.authToken){
      await mongo.set('identity', {_id: uId}, {auth: obj})
      return obj
    }
  }catch(e){
    log.error(e)
  }
}
