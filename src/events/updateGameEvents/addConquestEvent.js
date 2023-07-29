'use strict'
const AddConquestSchedule = require('./addConquestSchedule')
module.exports = async(event)=>{
  try{
    const timeNow = (new Date()).getTime()
    for(let i in event.instance){
      if(event.instance[i].startTime > timeNow) await AddConquestSchedule(event.id, event.instance[i].id, event.instance[i].startTime)
    }
  }catch(e){
    console.error(e)
  }
}
