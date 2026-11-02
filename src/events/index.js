'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const CheckIdentity = require('./checkIdentity')
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
let GUEST_ALLYCODE
async function updateAllyCode(){
  try{
    if(!guestAccount.allyCode){
      let botSettings = (await mongo.find('botSettings', { _id: '1' }, { botAllyCode: 1 }))[0]
      if(botSettings?.botAllyCode) guestAccount.allyCode = botSettings.botAllyCode
    }
  }catch(e){
    log.error(e)
  }
}
async function getEvents(){
  try{
    if(!guestAccount?.allyCode) await updateAllyCode()
    if(!guestAccount?.allyCode) return
    let auth = await getIdentity(guestAccount.allyCode)
    if(!auth?.auth) auth = await getIdentity(guestAccount.allyCode, true)
    if(!auth?.auth) return

    let pObj = await swgohClient('getInitialData', {}, auth)
    if(pObj?.code) console.log(pObj)
    if(pObj?.code && reAuthCodes[pObj.code]){
      let newAuth = await getIdentity(guestAccount.allyCode, true)
      if(!newAuth?.auth) return
      pObj = await swgohClient('getInitialData', {}, newAuth)
    }
    return pObj?.gameEvent
  }catch(e){
    log.error(e)
  }
}
module.exports = async()=>{
  try{
    let gameEvents = await getEvents()
    if(!gameEvents || gameEvents?.length == 0) return log.error('Error with Guest getInitialData for events update ...')
    await updateGameEvents(gameEvents)

  }catch(e){
    throw(e)
  }
}
