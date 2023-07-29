'use strict'
const CheckIdentity = require('./checkIdentity')
const AuthGuest = require('./authGuest')
const UpdateGameEvents = require('./updateGameEvents')
module.exports = async()=>{
  try{
    let pObj
    await CheckIdentity()
    if(guestAccount?.uId && guestAccount?.auth?.authId && guestAccount?.auth?.authToken){
      pObj = await Client('getInitialData', {}, {
        androidId: guestAccount.uId,
        deviceId: guestAccount.uId,
        platform: 'Android',
        auth: guestAccount.auth
      })
      if(!pObj?.gameEvent){
        const newTempAuth = await AuthGuest(guestAccount.uId)
        if(newTempAuth?.authId && newTempAuth?.authToken){
          guestAccount.auth = newTempAuth
          pObj = await Client('getInitialData', {}, {
            androidId: guestAccount.uId,
            deviceId: guestAccount.uId,
            platform: 'Android',
            auth: guestAccount.auth
          })
        }
      }
    }
    if(pObj?.gameEvent){
      await mongo.set('tempCache', {_id: 'gacEvent'}, {data: pObj.gameEvent.filter(x=>x.id.includes('GRAND_ARENA'))})
      UpdateGameEvents(pObj.gameEvent)
    }else{
      console.log('Error with Guest getInitialData for events update ...')
    }
  }catch(e){
    console.error(e)
  }
}
