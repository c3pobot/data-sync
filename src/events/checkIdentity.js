'use strict'
const mongo = require('mongoclient')
const { v4: uuidv4 } = require('uuid')
const AuthGuest = require('./authGuest')
const { guestAccount } = require('./guestAccount')
module.exports = async()=>{
  try{
    if(!guestAccount.uId){
      let botSettings = (await mongo.find('botSettings', {_id: '1'}))[0]
      if(botSettings && botSettings.guestUID) guestAccount.uId = botSettings.guestUID
      if(!guestAccount.uId){
        let uId = await uuidv4()
        if(uId){
          await mongo.set('botSettings', {_id: '1'}, {guestUID: uId})
          guestAccount.uId = uId
        }
      }
    }
    if(guestAccount.uId && !guestAccount.auth){
      let tempIdentity = (await mongo.find('identity', {_id: guestAccount.uId}))[0]
      if(tempIdentity){
        guestAccount.auth = tempIdentity.auth
      }else{
        let newAuth = await AuthGuest(guestAccount.uId)
        if(newAuth?.authId && newAuth?.authToken) guestAccount.auth = newAuth
      }
    }
  }catch(e){
    throw(e);
  }
}
