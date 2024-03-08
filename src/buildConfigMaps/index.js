'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const Cmds = {}
Cmds.statDefMap = require('./statDefMap')
Cmds.modDefMap = require('./modDefMap')
Cmds.unitDefMap = require('./unitDefMap')
module.exports = async(gameVersion, localeVersion, force = false)=>{
  try{
    for(let i in Cmds){
      let updateNeeded = force
      let mapVersion = (await mongo.find('configMaps', {_id: i}, {gameVersion: 1, localeVersion: 1}))[0]
      if(!mapVersion || mapVersion?.gameVersion !== gameVersion || mapVersion?.localeVersion !== localeVersion) updateNeeded = true
      if(!updateNeeded) continue;
      log.info(`config ${i} update in progress...`)
      let status = await Cmds[i](gameVersion, localeVersion)
      if(status !== true) throw(`config ${i} update error...`)
    }
    return true
  }catch(e){
    throw(e)
  }
}
