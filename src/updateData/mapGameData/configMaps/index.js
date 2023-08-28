'use strict'
const log = require('logger')
const Cmds = {}
Cmds.statDefMap = require('./statDefMap')
Cmds.modDefMap = require('./modDefMap')
Cmds.unitDefMap = require('./unitDefMap')
module.exports = async(gameVersion, localeVersion, force = false)=>{
  try{
    for(let i in Cmds){
      let updateNeeded = force
      let versions = (await mongo.find('configMaps', {_id: i}))[0]
      if(!versions || versions?.gameVersion !== gameVersion || versions?.localeVersion !== localeVersion) updateNeeded = true
      if(!updateNeeded) continue;
      log.info(i+' update in progress...')
      let status = await Cmds[i](gameVersion, localeVersion)
      if(status === true){
        log.info(i+' update complete...')
      }else{
        throw(i+' update error...')
      }
    }
    return true
  }catch(e){
    throw(e)
  }
}
