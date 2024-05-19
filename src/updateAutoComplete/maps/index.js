'use strict'
const Cmds = {}
Cmds['datacron-set'] = require('./datacron-set')
Cmds['ga-date'] = require('./ga-date')
Cmds.effect = require('./effect')
Cmds.nameKeys = require('./nameKeys')
Cmds.faction = require('./faction')
Cmds.journey = require('./journey')
Cmds.raid = require('./raid')
Cmds['tb-name'] = require('./tb-name')
Cmds.unit = require('./unit')
module.exports = Cmds
