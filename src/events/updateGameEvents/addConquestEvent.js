'use strict'
const log = require('logger')
const AddConquestSchedule = require('./addConquestSchedule')
module.exports = async(event = {})=>{
  try{
    let timeNow = Date.now(), i = event?.instance?.length
    if(i > 0){
      while(i--){
        if(event.instance[i].startTime > timeNow) await AddConquestSchedule(event.id, event.instance[i].id, event.instance[i].startTime)
      }
    }
  }catch(e){
    log.error(e)
  }
}
