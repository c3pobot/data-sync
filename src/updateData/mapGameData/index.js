'use strict'
const BuildGameData = require('../buildGameData')
const UpdateJourney = require('./updateJourney')
const UpdateSkills = require('./updateSkills')
const UpdateCampagin = require('./updateCampagin')
const UpdateConquestChallenge = require('./updateConquestChallenge')
const UpdateConquestDef = require('./updateConquestDef')
const UpdateDataCron = require('./updateDataCron')
const UpdateDataDisc = require('./updateDataDisc')
const UpdateEffects = require('./updateEffects')
const UpdateEquipment = require('./updateEquipment')
const UpdateModDef = require('./updateModDef')
const UpdateRaids = require('./updateRaids')
const UpdateRecipe = require('./updateRecipe')
const UpdateScavengerDef = require('./updateScavengerDef')
const UpdateSummonerData = require('./updateSummonerData')
const UpdateTBDef = require('./updateTBDef')
const UpdateUnitList = require('./updateUnitList')
module.exports = async(metaData = {})=>{
  try{
    process.env.DATAUPDATE = 1
    const errorObj = {
      error: 0,
      complete: 0
    }
    console.log('Mapping GameData')
    await UpdateRecipe(errorObj)
    if(!errorObj.error) await UpdateJourney(errorObj)
    if(!errorObj.error) await UpdateDataCron(errorObj, metaData.assetVersion)
    if(!errorObj.error) await UpdateRaids(errorObj, metaData.assetVersion)
    if(!errorObj.error) await UpdateTBDef(errorObj)
    if(!errorObj.error) await UpdateSkills(errorObj)
    if(!errorObj.error) await UpdateUnitList(errorObj, metaData.assetVersion)
    if(!errorObj.error) await UpdateCampagin(errorObj)
    if(!errorObj.error) await UpdateConquestChallenge(errorObj)
    if(!errorObj.error) await UpdateConquestDef(errorObj)
    if(!errorObj.error) await UpdateDataDisc(errorObj)
    if(!errorObj.error) await UpdateEquipment(errorObj)
    if(!errorObj.error) await UpdateModDef(metaData, errorObj)
    if(!errorObj.error) await UpdateScavengerDef(errorObj)
    if(!errorObj.error) await UpdateSummonerData(errorObj)
    if(!errorObj.error) await UpdateEffects(errorObj)

    console.log(errorObj)
    if(errorObj.complete > 12 && errorObj.error == 0){
      process.env.DATAUPDATE = 0
      console.log('Game Data update complete')
      return true
    }else{
      console.log('Game data update error.')
      process.env.DATAUPDATE = 0
    }
  }catch(e){
    console.error(e);
  }
}
