'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const CheckIdentity = require('./checkIdentity')
const AuthGuest = require('./authGuest')
const updateGameEvents = require('./updateGameEvents')
const swgohClient = require(`src/swgohClient`)
const { guestAccount } = require('./guestAccount')
const getIdentity = require('./get_identity')
const reAuthCodes = {
  4: 'SESSIONEXPIRED',
  5: 'AUTHFAILED',
  9: 'INVALID_DATA',
  11: 'UNAUTHORIZED',
  51: 'FORCECLIENTRESTART',
  55: 'PRIORITYFORCECLIENTRESTART',
  32: 'RECORDNOTFOUND'
}
async function getEvents(){
  try{
    let pObj = await swgohClient('getInitialData', {}, guestAccount?.identity)
    if(pObj?.code && reAuthCodes[pObj.code]){
      let newAuth = await getIdentity(guestAccount.allyCode, true)
      if(!newAuth?.auth) return
      guestAccount.identity = newAuth
      pObj = await swgohClient('getInitialData', {}, guestAccount?.identity)
    }
    return pObj?.gameEvent
  }catch(e){
    log.error(e)
  }
}
module.exports = async()=>{
  try{
    await CheckIdentity()
    let gameEvents = await getEvents()
    if(!gameEvents || gameEvents?.length == 0) return log.error('Error with Guest getInitialData for events update ...')
    await updateGameEvents(gameEvents)

  }catch(e){
    throw(e)
  }
}
