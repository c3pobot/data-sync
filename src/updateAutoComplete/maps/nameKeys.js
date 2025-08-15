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
    "unit_mods" : "unit",
    "datacron-set" : "datacron-set",
    "journey" : "journey",
    "ga-date" : "ga-date",
    "tb-name" : "tb-name",
    "effect" : "effect",
    "raid-faction": "raid-faction",
    "mod-set": "mod-set",
    "mod-stat": "mod-stat",
    "mod-slot": "mod-slot"
}
module.exports = async(gameVersion, localeVersion)=>{
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, data: data, gameVersion: gameVersion, localeVersion: localeVersion })
  return true
}
