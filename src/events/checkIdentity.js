'use strict'
const mongo = require('mongoclient')
const { v4: uuidv4 } = require('uuid')
const AuthGuest = require('./authGuest')
const { guestAccount } = require('./guestAccount')
const getIdentity = require('./get_identity')

module.exports = async()=>{
  try{
    if(!guestAccount.allyCode){
      let botSettings = (await mongo.find('botSettings', { _id: '1' }, { botAllyCode: 1 }))[0]
      if(botSettings?.botAllyCode) guestAccount.allyCode = botSettings.botAllyCode
      if(!guestAccount.allyCode) return
    }
    if(guestAccount.allyCode && !guestAccount.identity){
      let tempIdentity = await getIdentity(guestAccount.allyCode)
      if(tempIdentity?.auth) guestAccount.identity = tempIdentity
    }
  }catch(e){
    throw(e);
  }
}
