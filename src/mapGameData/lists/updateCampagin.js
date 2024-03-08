'use strict'
const ReadFile = require('./readFile')
const mongo = require('mongoclient')
module.exports = async(errObj)=>{
  try{
    let campaign = await ReadFile(`${baseDir}/data/files/campaign.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    let actionCap = await ReadFile(`${baseDir}/data/files/dailyActionCap.json`)
    let gear = await ReadFile(`${baseDir}/data/files/equipment.json`)
    let material = await ReadFile(`${baseDir}/data/files/material.json`)
    let mysteryMod = await ReadFile(`${baseDir}/data/files/mysteryStatMod.json`)
    let modSet = await ReadFile(`${baseDir}/data/files/statModSet.json`)
    let obj = campaign.filter(x=>x.grindEnabled), data = []
    for(let i in obj){
      let campaignId = obj[i].id, mapNameKey = lang[obj[i].nameKey] ? lang[obj[i].nameKey].replace(/\\n/g, ' ').replace(' BATTLES', ''):obj[i].nameKey, campaignMap = obj[i].campaignMap
      for(let m in campaignMap){
        let campaignMapId = campaignMap[m].id, diffGroup = campaignMap[m].campaignNodeDifficultyGroup
        for(let d in diffGroup){
          let campaignNodeDifficulty = diffGroup[d].campaignNodeDifficulty, campaignNode = diffGroup[d].campaignNode
          for(let n in campaignNode){
            let campaignNodeId = campaignNode[n].id, campaignMissions = campaignNode[n].campaignNodeMission
            for(let m in campaignMissions){
              if(campaignMissions[m].grindEnabled){
                let rewards = campaignMissions[m].rewardPreview, energy = campaignMissions[m].entryCostRequirement
                let tempObj = {
                  _id: campaignId+'-'+campaignMapId+'-'+campaignNodeDifficulty+'-'+campaignNodeId+'-'+campaignMissions[m].id,
                  campaignMissionIdentifier: {
                    campaignId: campaignId,
                    campaignMapId:  campaignMapId,
                    campaignNodeDifficulty: +campaignNodeDifficulty,
                    campaignNodeId: campaignNodeId,
                    campaignMissionId: campaignMissions[m].id,
                  },
                  mapNameKey: mapNameKey,
                  missionNameKey: lang[campaignMissions[m].shortNameKey] ? lang[campaignMissions[m].shortNameKey]:campaignMissions[m].shortNameKey,
                  rewards: [],
                  energy: null
                }
                if(campaignMissions[m].dailyBattleCapKey && actionCap.find(x=>x.id == campaignMissions[m].dailyBattleCapKey)){
                  tempObj.dailyBattleCapKey = +actionCap.find(x=>x.id == campaignMissions[m].dailyBattleCapKey).maxActions
                }
                for(let r in rewards){
                  if(rewards[r].id && !rewards[r].id.includes('GRIND') && !rewards[r].id.includes('xp-mat') && !rewards[r].id.includes('FORCE_POINT') && !rewards[r].id.includes('ability_mat')){
                    let tempReward = {
                      id: rewards[r].id,
                      qty: rewards[r].maxQuantity
                    }
                    if(gear.find(x=>x.id == rewards[r].id)){
                      tempReward.nameKey = lang[gear.find(x=>x.id == rewards[r].id).nameKey] ? lang[gear.find(x=>x.id == rewards[r].id).nameKey]:gear.find(x=>x.id == rewards[r].id).nameKey;
                      tempReward.icon = gear.find(x=>x.id == rewards[r].id).iconKey
                      tempReward.gear = true
                      tempReward.mod = false
                      tempReward.tier = gear.find(x=>x.id == rewards[r].id).tier
                      tempReward.mark = gear.find(x=>x.id == rewards[r].id).mark
                    }
                    if(!tempReward.nameKey && material.find(x=>x.id == rewards[r].id)){
                       tempReward.nameKey = lang[material.find(x=>x.id == rewards[r].id).nameKey] ? lang[material.find(x=>x.id == rewards[r].id).nameKey]:material.find(x=>x.id == rewards[r].id).nameKey;
                       tempReward.icon = material.find(x=>x.id == rewards[r].id).iconKey
                       tempReward.gear = false
                       tempReward.mod = false
                    }
                    if(!tempReward.nameKey && mysteryMod.find(x=>x.id == rewards[r].id)){
                      let tempMod = mysteryMod.find(x=>x.id == rewards[r].id)
                      tempReward.nameKey = lang['StatMod_Name_Rarity_'+tempMod.minRarity]
                      if(modSet.find(x=>x.id == tempMod.setId)) tempReward.nameKey += ' '+(lang[modSet.find(x=>x.id == tempMod.setId).name] ? lang[modSet.find(x=>x.id == tempMod.setId).name]:modSet.find(x=>x.id == tempMod.setId).name)
                      if(tempMod.slot && tempMod.slot.length == 1) tempReward.nameKey += ' '+lang['StatMod_Name_Slot_'+(+tempMod.slot[0] - 1)]
                      tempReward.gear = false
                      tempReward.mod = true
                    }
                    tempObj.rewards.push(tempReward)
                  }
                }
                if(energy && energy.length > 0){
                  tempObj.energy = {
                    id: energy[0].id,
                    type: energy[0].type,
                    qty: energy[0].minQuantity
                  }
                  for(let e in energy){
                    if(energy[e].minQuantity > tempObj.energy.qty){
                      tempObj.energy = {
                        id: energy[e].id,
                        type: energy[e].type,
                        qty: energy[e].minQuantity
                      }
                    }
                  }
                }
                await mongo.set('campaign', {_id: campaignId+'-'+campaignMapId+'-'+campaignNodeDifficulty+'-'+campaignNodeId+'-'+campaignMissions[m].id}, tempObj)
              }
            }
          }
        }
      }
    }
    campaign = null
    lang = null
    actionCap = null
    gear = null
    material = null
    mysteryMod = null
    modSet = null
    obj = null
    errObj.complete++
  }catch(e){
    throw(e)
  }
}
