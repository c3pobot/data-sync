'use strict'
const mongo = require('mongoclient')
const fs = require('fs')
const ReadFile = require('./readFile')
const GetImages = require('../getImages')
const raidTokens = require(`${baseDir}/src/enums/raidTokens`)
const getRewards = async(preview, lang = {}, rewardList = [], images = [])=>{
  try{
    if(!preview) return
    let res = {rankStart: preview.rankStart, rankEnd: preview.rankEnd, loot: []}
    res = {...res,...preview.primaryReward[0]}
    let reward = rewardList.find(x=>x.id === res.id)
    if(reward){
      res.texture = reward.texture
      res.nameKey = lang[reward.iconTextKey] || reward.iconTextKey
      for(let i in reward.previewItem){
        if(raidTokens[reward.previewItem[i].id]){
          let loot = {...raidTokens[reward.previewItem[i].id],...{
            qty: reward.previewItem[i].minQuantity,
            type: reward.previewItem[i].type
          }}
          loot.nameKey = lang[loot.nameKey] || loot.nameKey
          res.loot.push(loot)
          if(loot.icon) images.push(loot.icon)
        }
      }
    }
    return res
  }catch(e){
    throw(e)
  }
}

module.exports = async(errObj, assetVersion)=>{
  try{
    let guildRaidList = await ReadFile(`${baseDir}/data/files/guildRaid.json`)
    let campainList = await ReadFile(`${baseDir}/data/files/campaign.json`)
    let rewardList = await ReadFile(`${baseDir}/data/files/mysteryBox.json`)
    let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
    let guildCampaign = campainList?.find(x=>x.id === 'GUILD')
    let campaignNode = guildCampaign?.campaignMap?.find(x=>x.id === 'RAIDS')?.campaignNodeDifficultyGroup[0]?.campaignNode
    let images = [], autoComplete = []
    if(!guildRaidList || !campaignNode || !lang || !rewardList){
      errorObj.error++
      return
    }
    for(let i in guildRaidList){
      let raid = JSON.parse(JSON.stringify(guildRaidList[i]))
      if(!raid?.id){
        errorObj.error++
        return
      }
      let campaign = campaignNode?.find(x=>x.id === raid?.campaignElementIdentifier?.campaignNodeId)
      let campaignMission = campaign?.campaignNodeMission
      raid.nameKey = lang[campaign.nameKey] || campaign.nameKey
      raid.mission = []
      if(raid.image) images.push(raid.image)
      if(raid.portraitIcon) images.push(raid.portraitIcon)
      if(raid.infoImage) images.push(raid.infoImage)
      for(let c in campaignMission){
        let mission = {
          id: campaignMission[c].id,
          nameKey: lang[campaignMission[c].nameKey] || campaignMission[c].nameKey,
          nameKey: lang[campaignMission[c].descKey] || campaignMission[c].descKey,
          combatType: campaignMission[c].combatType,
          rewards:[]
         }
         if(campaignMission[c].entryCategoryAllowed){
           mission.requirements = {
             faction: campaignMission[c].entryCategoryAllowed.categoryId,
             rarity: campaignMission[c].entryCategoryAllowed.minimumUnitRarity || 0,
             gear: campaignMission[c].entryCategoryAllowed.minimumUnitTier || 0,
             relic: campaignMission[c].entryCategoryAllowed.minimumRelicTier || 0,
           }
         }
         if(campaignMission[c]?.rankRewardPreview?.length > 0){
           for(let r in campaignMission[c]?.rankRewardPreview){
             let reward = await getRewards(campaignMission[c]?.rankRewardPreview[r], lang, rewardList, images)
             if(reward) mission.rewards.push(reward)
             if(reward?.texture) images.push(reward.texture)
           }
         }
         raid.mission.push(mission)
      }
      await mongo.set('raidDef', {_id: guildRaidList[i].id}, raid)
      if(raid?.nameKey && raid?.id) autoComplete.push({name: raid.nameKey, value: raid.id})
    }
    if(images.length > 0 && assetVersion) GetImages(images, assetVersion, 'thumbnail', 'raidList')
    if(autoComplete?.length > 0) await mongo.set('autoComplete', {_id: 'raid'}, {data: autoComplete, include: true})
    errObj.complete++
    guildRaidList = null
    campainList = null
    rewardList = null
    lang = null
    guildCampaign = null
    campaignNode = null
  }catch(e){
    throw(e)
  }
}
