'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
let localeVersion
module.exports = async(latestLocalVersion)=>{
  try{
    if(!latestLocalVersion) return
    if(localeVersion === latestLocalVersion) return
    let obj = await getFile('Loc_ENG_US.txt', latestLocalVersion)
    if(!obj) return
    await mongo.set('localeFiles', { _id: 'ENG_US' }, obj)
    localeVersion = latestLocalVersion
    log.info(`update mongo locale for ENG_US to ${localeVersion}...`)
  }catch(e){
    log.error(e)
  }
}
