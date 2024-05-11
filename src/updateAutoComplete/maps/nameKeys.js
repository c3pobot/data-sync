'use strict'
const mongo = require('mongoclient')
const data = {
    "raid" : "raid",
    "faction" : "faction",
    "leader" : "unit",
    "unit" : "unit",
    "unit1" : "unit",
    "unit2" : "unit",
    "unit3" : "unit",
    "unit4" : "unit",
    "datacron-set" : "datacron-set",
    "journey" : "journey",
    "ga-date" : "ga-date",
    "tb-name" : "tb-name",
    "effect" : "effect"
}
module.exports = async(gameVersion, localeVersion)=>{
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, data: data, gameVersion: gameVersion, localeVersion: localeVersion })
  return true
}
