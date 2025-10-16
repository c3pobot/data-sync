'use strict'
const Cmds = {}
Cmds['datacron-set'] = require('./datacron-set')
//Cmds['ga-date'] = require('./ga-date')
Cmds.bundle = require('./bundle')
Cmds.effect = require('./effect')
Cmds.nameKeys = require('./nameKeys')
Cmds.faction = require('./faction')
Cmds.journey = require('./journey')
Cmds.raid = require('./raid')
Cmds['raid-faction'] = require('./raidFactions')
Cmds['tb-name'] = require('./tb-name')
Cmds.token = require('./token')
Cmds.unit = require('./unit')
Cmds['mod-set'] = require('./mod-set')
Cmds['mod-slot'] = require('./mod-slot')
Cmds['mod-stat'] = require('./mod-stat')
module.exports = Cmds
