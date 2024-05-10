'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapCampainMap = async(campaignMap = [], dataList = {}, campaignId)=>{
  let i = campaignMap.length, array = []
  while(i--){
    if(campaignMap[i].id) array.push(mapCampainNodeDifficulty(campaignMap[i].campaignNodeDifficultyGroup, dataList, campaignId, campaignMap[i].id))
  }
  await Promise.all(array)
}
const mapCampainNodeDifficulty = async(campaignNodeDifficultyGroup = [], dataList, campaignId, campaignMapId)=>{
  let i = campaignNodeDifficultyGroup.length, array = []
  while(i--){
    if(campaignNodeDifficultyGroup[i].id) array.push(mapCampainNode(campaignNodeDifficultyGroup[i].campaignNode, dataList, campaignId, campaignMapId, campaignNodeDifficultyGroup[i].campaignNodeDifficulty))
  }
  await Promise.all(array)
}
const mapCampainNode = async(campaignNode = [], dataList, campaignId, campaignMapId, campaignNodeDifficulty)=>{
  let i = campaignNode, array = []
  while(i--){
    if(campaignNode[i].id) array.push(mapCampainMissions(campaignNode[i].campaignNodeMission, dataList, campaignId, campaignMapId, campaignNodeDifficulty, campaignNode[i].id ))
  }
  await Promise.all(array)
}
const mapCampainMissions = async(campaignMissions = [], dataList, campaignId, campaignMapId, campaignNodeDifficulty, campaignNodeId)=>{
  let i = campaignMissions.length, array = []
  while(i--){
    if(!campaignMissions[i].grindEnabled) continue
    if(campaignMission[i].id) array.push(mapCampainMission(campaignMission[i], dataList, campaignId, campaignMapId, campaignNodeDifficulty, campaignNodeId))
  }
  await Promise.all(array)
}
const mapCampainMission = async(campaignMission = {}, dataList, campaignId, campaignMapId, campaignNodeDifficulty, campaignNodeId)=>{
  let id = campaignId+'-'+campaignMapId+'-'+campaignNodeDifficulty+'-'+campaignNodeId+'-'+campaignMission.id, actionCap
  let tempObj = {
    campaignMissionIdentifier: {
      campaignId: campaignId,
      campaignMapId:  campaignMapId,
      campaignNodeDifficulty: +campaignNodeDifficulty,
      campaignNodeId: campaignNodeId,
      campaignMissionId: campaignMission.id,
    },
    mapNameKey: dataList.mapNameKey,
    missionNameKey: dataList.lang[campaignMission.shortNameKey] || campaignMission.shortNameKey? lang[campaignMission.shortNameKey]:campaignMission.shortNameKey
  }
  if(campaignMission.dailyBattleCapKey) tempObj.dailyBattleCapKey = +(dataList.actionCapList.find(x=>x.id === campaignMission.dailyBattleCapKey)?.maxActions || 0)
  tempObj.rewards = mapCampainRewards(campaignMission.rewardPreview, dataList) || []
  tempObj.energy = mapCampainEnergy(campaignMission.entryCostRequirement)
  await mongo.set('campaign', {_id: id }, tempObj)
}
const mapCampainRewards = (rewards = [], { lang, gearList, materialList, mysteryModList, modSetList })=>{
  let res = []
  for(let i in rewards){
    if(rewards[r].id && !rewards[r].id.includes('GRIND') && !rewards[r].id.includes('xp-mat') && !rewards[r].id.includes('FORCE_POINT') && !rewards[r].id.includes('ability_mat')){
      let tempReward = {
        id: rewards[r].id,
        qty: rewards[r].maxQuantity
      }
      let gear = gearList.find(x=>x.id == rewards[r].id), material = materialList.find(x=>x.id == rewards[r].id), mysteryMod = mysteryModList.find(x=>x.id == rewards[r].id)
      if(gear?.id){
        tempReward.nameKey = lang[gear.nameKey] ? lang[gear.nameKey]:gear.nameKey;
        tempReward.icon = gear.iconKey
        tempReward.gear = true
        tempReward.mod = false
        tempReward.tier = gear.tier
        tempReward.mark = gear.mark
      }
      if(!tempReward.nameKey && material?.id){
         tempReward.nameKey = lang[material.nameKey] ? lang[material.nameKey]:material.nameKey;
         tempReward.icon = material.iconKey
         tempReward.gear = false
         tempReward.mod = false
      }
      if(!tempReward.nameKey && mysteryMod?.id){
        let modSet = modSetList.find(x=>x.id == mysteryMod.setId)
        tempReward.nameKey = lang['StatMod_Name_Rarity_'+mysteryMod.minRarity]
        if(modSet?.id) tempReward.nameKey += ' '+(lang[modSet.name] ? lang[modSet.name]:modSet.name)
        if(mysteryMod.slot && mysteryMod.slot.length == 1) tempReward.nameKey += ' '+lang['StatMod_Name_Slot_'+(+mysteryMod.slot[0] - 1)]
        tempReward.gear = false
        tempReward.mod = true
      }
      res.push(tempReward)
    }
  }
  return res
}
const mapCampainEnergy = (energy = [])=>{
  if(!energy || energy.length == 0) return
  let res = { id: energy[0].id, type: energy[0].type, qty: energy[0].minQuantity }
  for(let i in energy){
    if(res.qty >= energy[i].minQuantity) continue
    res = { id: energy[i].id, type: energy[i].type, qty: energy[i].minQuantity }
  }
  return res
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ campaign, lang, actionCap, gear, material, mysteryMod, modSet ] = await Promise.all([
    ReadFile(`campaign`, gameVersion),
    ReadFile(`Loc_ENG_US.txt`, localeVersion),
    ReadFile(`dailyActionCap`, gameVersion),
    ReadFile(`equipment`, gameVersion),
    ReadFile(`material`, gameVersion),
    ReadFile(`mysteryStatMod`, gameVersion),
    ReadFile(`statModSet`, gameVersion),
  ])
  if(!campaign || !lang || !actionCapList || !gearList || !materialList || mysteryModList || !modSetList) return
  let obj = campaign.filter(x=>x.grindEnabled)
  if(!obj || obj.length == 0) return

  let i = obj.length, array = []
  while(i--){
    let mapNameKey = lang[obj[i].nameKey]?.replace(/\\n/g, ' ')?.replace(' BATTLES', '') || obj[i].nameKey
    array.push(mapCampainMap(obj[i].campaignMap, { mapNameKey: mapNameKey, lang: lang, actionCapList: actionCapList, gearList: gearList, materialList: materialList, mysteryModList: mysteryModList, modSetList: modSetList }, obj[i].id))
  }
  await Promise.all(array)
  return true
}
