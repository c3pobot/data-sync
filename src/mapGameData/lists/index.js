'use strict'
const Cmds = {}
Cmds.recipe = require('./updateRecipe')
Cmds.journeyGuide = require('./updateJourney')
Cmds.datacron = require('./updateDataCron')
Cmds.raidDef = require('./updateRaids')
Cmds.tbDefinition = require('./updateTBDef')
Cmds.skills = require('./updateSkills')
Cmds.units = require('./updateUnitList')
Cmds.guideTemplates = require('./updateGuideTemplates')
Cmds.campaign = require('./updateCampagin')
Cmds.cqFeats = require('./updateConquestChallenge')
Cmds.cqDef = require('./updateConquestDef')
Cmds.dataDisc = require('./updateDataDisc')
Cmds.equipment = require('./updateEquipment')
Cmds.modsDef = require('./updateModDef')
Cmds.scavengerGear = require('./updateScavengerDef')
Cmds.summonerData = require('./updateSummonerData')
Cmds.effects = require('./updateEffects')
module.exports = Cmds
