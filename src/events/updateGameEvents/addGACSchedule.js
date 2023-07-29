'use strict'
module.exports = async(eventId, instanceId, startTime)=>{
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
