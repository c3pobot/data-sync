'use strict'
global.debugMsg = +process.env.DEBUG || 0
global.dataUpateInProgress = false
global.guestAccount = {}
global.gameData = null
global.GameDataVersions = {
  gameVersion: '',
  localeVersion: ''
}
global.mongo = require('mongoapiclient')
//global.mongo = require('./mongo')
global.DataUpdate = require('./updateData')
global.HP = require('./helpers')
global.Client = require('./client')
