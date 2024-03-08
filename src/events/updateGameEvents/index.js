'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const AddConquestEvent = require('./addConquestEvent')
const AddGACEvent = require('./addGACEvent')
const CleanEventName = require('./cleanEventName')
const FormatEventTime = require('./formatEventTime')
module.exports = async(events = [])=>{
  try{
    if(events.length > 0){
      let currentEvents = await mongo.find('events', {})
      let lang = (await mongo.find('localeFiles', {_id: 'ENG_US'}, {_id: 0}))[0]
      let timeNow = Date.now()
      events = events.filter(x=>x.uiLocation !== 4 && x.uiLocation !== 1 && x.instance?.length > 0 && x.type !== 13 && x.type !== 4)
      let i = events.length
  		while(i--){
       if(events[i].type === 10) AddGACEvent(events[i])
       if(events[i].type === 14) AddConquestEvent(events[i])
       let e = events[i].instance.length
       while(e--){
         let eventStartTime
         if(events[i].type === 8){
           if(events[i].instance[e].displayStartTime) eventStartTime = events[i].instance[e].displayStartTime
         }else{
           if(events[i].instance[e].startTime) eventStartTime = events[i].instance[e].startTime
         }
         if(eventStartTime && (+eventStartTime > +timeNow || +eventStartTime > (+timeNow - 604800000))){
           if(currentEvents.filter(x=>x.id == events[i].id && x.startTime == eventStartTime ).length == 0){
             let eventName = (lang && lang[events[i].nameKey] ? lang[events[i].nameKey]:events[i].nameKey)
             let tempObj = {
               id: events[i].id,
               startTime: eventStartTime,
               endTime: events[i].instance[e].endTime,
               nameKey: CleanEventName(eventName),
               formatedTime: FormatEventTime(events[i].instance[e].startTime),
               TTL: new Date(+events[i].instance[e].endTime + 2592000000)
             }
             mongo.set('events', {_id: events[i].nameKey+'-'+events[i].instance[e].id}, tempObj)
           }
         }
       }
  		}
    }
  }catch(e){
    log.error(e)
  }
}
