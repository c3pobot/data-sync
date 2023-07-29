'use strict'
const AddConquestEvent = require('./addConquestEvent')
const AddGACEvent = require('./addGACEvent')
const CleanEventName = require('./cleanEventName')
const FormatEventTime = require('./formatEventTime')
module.exports = async(events)=>{
  try{
    if(events.length > 0){
      const currentEvents = await mongo.find('events', {})
      const lang = (await mongo.find('localeFiles', {_id: 'ENG_US'}, {_id: 0}))[0]
      //const lang = await redis.get('lang-ENG_US')
      const timeNow = (new Date()).getTime()
  		for(let i in events){
  		 if(events[i].id.startsWith('EVENT') || events[i].id.startsWith('GC_') || events[i].id.startsWith('TB_EVENT_') || events[i].id.startsWith('CONQUEST_') || events[i].id.startsWith('TERRITORY_WAR') || events[i].id.startsWith('CHAMPIONSHIPS_GRAND_ARENA')){
         if(events[i].id.startsWith('CHAMPIONSHIPS_GRAND_ARENA')) AddGACEvent(events[i])
         if(events[i].id.startsWith('CONQUEST_ARCADE_EVENT')) AddConquestEvent(events[i])
					for(let e in events[i].instance){
            let eventStartTime
            if(events[i].id.startsWith('TERRITORY_WAR')){
              if(events[i].instance[e].displayStartTime) eventStartTime = events[i].instance[e].displayStartTime
            }else{
              if(events[i].instance[e].startTime) eventStartTime = events[i].instance[e].startTime
            }
						if(eventStartTime && (+eventStartTime > +timeNow || +eventStartTime > (+timeNow - 604800000))){
              if(currentEvents.filter(x=>x.id == events[i].id && x.startTime == eventStartTime ).length == 0){
                const eventName = (lang && lang[events[i].nameKey] ? lang[events[i].nameKey]:events[i].nameKey)
                const tempObj = {
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
    }
  }catch(e){
    console.error(e)
  }
}
