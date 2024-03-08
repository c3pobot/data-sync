'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const AddGACSchedule = require('./addGACSchedule')
module.exports = async(event = {})=>{
  try{
    let gac = (await mongo.find('gacEvents', {_id: event.id}))[0]
    if(gac){
      let timeNow = Date.now()
      for(let i in event.instance){
        if(gac.instance.filter(x=>x.id == event.instance[i].id).length == 0){
          await mongo.push('gacEvents', {_id: event.id}, {instance: event.instance[i]})
          if(event.instance[i].displayStartTime > timeNow) await AddGACSchedule(event.id, event.instance[i].id, event.instance[i].displayStartTime)
        }
      }
    }else{
      event.mode = (event.territoryMapId.includes('3v3') ? '3v3':'5v5')
      let tempArray = event.id.split('_')
      if(tempArray?.length > 0) event.season = +(tempArray[(tempArray.length - 1)])
      await mongo.set('gacEvents', {_id: event.id}, event)
      for(let i in event.instance) await AddGACSchedule(event.id, event.instance[i].id, event.instance[i].displayStartTime)
    }
  }catch(e){
    log.error(e)
  }
}
