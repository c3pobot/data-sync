'use strict'
const { v4: uuidv4 } = require('uuid')
const AddGACSchedule = async(eventId, instanceId, startTime)=>{
  try{
    const guilds = await mongo.find('guilds', {sync: 1}, {_id: 1, schedule: 1})
    if(guilds && guilds.length > 0){
      for(let i in guilds){
        const exists = (await mongo.find('guildSchedule', {_id: guilds[i]._id+'-'+eventId+':'+instanceId}))[0]
        if(!exists && guilds[i].schedule && guilds[i].schedule.gac) await mongo.set('guildSchedule', {_id: guilds[i]._id+'-'+eventId+':'+instanceId }, {guildId: guilds[i]._id, eventId: eventId, instanceId: instanceId, time: startTime, event: 'gac', nameKey: 'GAC', state: 'join', settings: guilds[i].schedule.gac})
      }
    }
  }catch(e){
    console.error(e)
  }
}
const AddConquestSchedule = async(eventId, instanceId, startTime)=>{
  try{
    const guilds = await mongo.find('guilds', {sync: 1}, {_id: 1, schedule: 1})
    if(guilds && guilds.length > 0){
      for(let i in guilds){
        const exists = (await mongo.find('guildSchedule', {_id: guilds[i]._id+'-'+eventId+':'+instanceId}))[0]
        if(!exists && guilds[i].schedule && guilds[i].schedule.gac) await mongo.set('guildSchedule', {_id: guilds[i]._id+'-'+eventId+':'+instanceId }, {guildId: guilds[i]._id, eventId: eventId, instanceId: instanceId, time: startTime, event: 'conquest', nameKey: 'Conquest', state: 'start', settings: guilds[i].schedule.gac})
      }
    }
  }catch(e){
    console.error(e)
  }
}
const AddGACEvent = async(event)=>{
  try{
    const gac = (await mongo.find('gacEvents', {_id: event.id}))[0]
    if(gac){
      const timeNow = (new Date()).getTime()
      for(let i in event.instance){
        if(gac.instance.filter(x=>x.id == event.instance[i].id).length == 0){
          await mongo.push('gacEvents', {_id: event.id}, {instance: event.instance[i]})
          if(event.instance[i].displayStartTime > timeNow) await AddGACSchedule(event.id, event.instance[i].id, event.instance[i].displayStartTime)
        }
      }
    }else{
      event.mode = (event.territoryMapId.includes('3v3') ? '3v3':'5v5')
      await mongo.set('gacEvents', {_id: event.id}, event)
      for(let i in event.instance) await AddGACSchedule(event.id, event.instance[i].id, event.instance[i].displayStartTime)
    }
  }catch(e){
    console.error(e)
  }
}
const AddConquestEvent = async(event)=>{
  try{
    const timeNow = (new Date()).getTime()
    for(let i in event.instance){
      if(event.instance[i].startTime > timeNow) await AddConquestSchedule(event.id, event.instance[i].id, event.instance[i].startTime)
    }
  }catch(e){
    console.error(e)
  }
}
const AuthGuest = async(uId)=>{
  try{
    const obj = await Client.post('authGuest', {uid: guestAccount.uId})
    if(obj && obj.authId && obj.authToken){
      await mongo.set('identity', {_id: uId}, {auth: obj})
      return obj
    }
  }catch(e){
    console.error(e)
  }
}
const CleanEventName = (string)=>{
  /*
	eventName = eventName.replace('\\n', '')
	eventName = eventName.replace('[c]', '')
	eventName = eventName.replace('[E50073]', ' ')
	eventName = eventName.replace('[FFC891]', ' ')
	eventName = eventName.replace('[-]', '')
	eventName = eventName.replace('[/c]', '')
  */
  string = string.replace('\\n', '')
  string = string.replace(/\[c\]/g, ' ')
  string = string.replace(/\[\/c]/g, '')
  string = string.replace(/\[-\]/g, '')
  string = string.replace(/\[\w{1,6}\]/g, '')
	return string
}
const FormatEventTime = (eventTime)=>{
	const t = new Date(+eventTime)
  return (+t.getMonth() + 1).toString().padStart(2, '0') + '/' + t.getDate().toString().padStart(2, '0')
}
const UpdateGameEvents = async(events)=>{
  try{
    if(events.length > 0){
      const currentEvents = await mongo.find('events', {})
      const lang = await redis.get('lang-ENG_US')
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
module.exports = async()=>{
  try{
    let pObj
    if(!guestAccount.uId){
      const botSettings = (await mongo.find('botSettings', {_id: '1'}))[0]
      if(botSettings && botSettings.guestUID) guestAccount.uId = botSettings.guestUID
      if(!guestAccount.uId){
        const uId = await uuidv4()
        if(uId){
          await mongo.set('botSettings', {_id: '1'}, {guestUID: uId})
          guestAccount.uId = uId
        }
      }
    }
    if(guestAccount.uId && !guestAccount.auth){
      const tempIdentity = (await mongo.find('identity', {_id: guestAccount.uId}))[0]
      if(tempIdentity){
        guestAccount.auth = tempIdentity.auth
      }else{
        const newAuth = await AuthGuest(guestAccount.uId)
        if(newAuth && newAuth.authId && newAuth.authToken) guestAccount.auth = newAuth
      }
    }

    if(guestAccount.uId && guestAccount.auth && guestAccount.auth.authId && guestAccount.auth.authToken){
      pObj = await Client.post({
        method: 'getInitialData',
        identity: {
          androidId: guestAccount.uId,
          deviceId: guestAccount.uId,
          platform: 'Android',
          auth: guestAccount.auth
        }
      })
      if(!pObj){
        const newTempAuth = await AuthGuest(guestAccount.uId)
        if(newTempAuth && newTempAuth.authId && newTempAuth.authToken){
          guestAccount.auth = newTempAuth
          pObj = await Client.post({
            method: 'getInitialData',
            identity: {
              androidId: guestAccount.uId,
              deviceId: guestAccount.uId,
              platform: 'Android',
              auth: guestAccount.auth
            }
          })
        }
      }
    }
    if(pObj && pObj.gameEvent) UpdateGameEvents(pObj.gameEvent)
  }catch(e){
    console.error(e)
  }
}
