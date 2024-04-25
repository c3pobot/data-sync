'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const CheckIdentity = require('./checkIdentity')
const AuthGuest = require('./authGuest')
const updateGameEvents = require('./updateGameEvents')
const swgohClient = require(`src/client`)
const { guestAccount } = require('./guestAccount')

module.exports = async()=>{
  try{
    let pObj
    await CheckIdentity()
    if(guestAccount?.uId && guestAccount?.auth?.authId && guestAccount?.auth?.authToken){
      pObj = await swgohClient('getInitialData', {}, {
        androidId: guestAccount.uId,
        deviceId: guestAccount.uId,
        platform: 'Android',
        auth: guestAccount.auth
      })
      if(!pObj?.gameEvent){
        let newTempAuth = await AuthGuest(guestAccount.uId)
        if(newTempAuth?.authId && newTempAuth?.authToken){
          guestAccount.auth = newTempAuth
          pObj = await swgohClient('getInitialData', {}, {
            androidId: guestAccount.uId,
            deviceId: guestAccount.uId,
            platform: 'Android',
            auth: guestAccount.auth
          })
        }
      }
    }
    if(pObj?.gameEvent){
      await mongo.set('tempCache', {_id: 'gacEvent'}, { data: pObj.gameEvent.filter(x=>x.type === 10) })
      await updateGameEvents(pObj.gameEvent)
    }else{
      log.error('Error with Guest getInitialData for events update ...')
    }
  }catch(e){
    throw(e)
  }
}
