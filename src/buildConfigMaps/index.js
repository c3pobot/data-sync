'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const Cmds = {}
Cmds.statDefMap = require('./statDefMap')
Cmds.modDefMap = require('./modDefMap')
Cmds.unitDefMap = require('./unitDefMap')
Cmds.gearTrackerDefMap = require('./gearTrackerDefMap')
module.exports = async(gameVersion, localeVersion, force = false)=>{
  let status = true
  for(let i in Cmds){
    if(!status) break
    let updateNeeded = force
    let mapVersion = (await mongo.find('configMaps', {_id: i}, {gameVersion: 1, localeVersion: 1}))[0]
    if(!mapVersion || mapVersion?.gameVersion !== gameVersion || mapVersion?.localeVersion !== localeVersion) updateNeeded = true
    if(!updateNeeded) continue;
    log.info(`config ${i} update in progress...`)
    status = await Cmds[i](gameVersion, localeVersion)
    if(!status) log.error(`config ${i} update error...`)
  }
  return status
}
