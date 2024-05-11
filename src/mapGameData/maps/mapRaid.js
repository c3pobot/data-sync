'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const checkImages = require('src/helpers/checkImages')
const raidTokens = require(`src/enums/raidTokens`)

const getRewards = (rankRewardPreview, lang = {}, mysteryBoxList = [], images = [])=>{
  if(!rankRewardPreview) return
  let res = { rankStart: rankRewardPreview.rankStart, rankEnd: rankRewardPreview.rankEnd, loot: [] }
  res = {...res,...rankRewardPreview.primaryReward[0]}
  let reward = mysteryBoxList.find(x=>x.id === res.id)
  if(!reward) return res
  res.texture = reward.texture
  res.nameKey = lang[reward.iconTextKey] || reward.iconTextKey
  for(let i in reward.previewItem){
    if(!raidTokens[reward.previewItem[i].id]) continue
    let loot = { ...raidTokens[reward.previewItem[i].id],...{ qty: reward.previewItem[i].minQuantity, type: reward.previewItem[i].type } }
    loot.nameKey = lang[loot.nameKey] || loot.nameKey
    res.loot.push(loot)
    if(loot.icon) images.push(loot.icon)
  }
  return res
}
const mapRewards = (rankRewardPreview = [], rewards = [], lang = {}, mysteryBoxList = [], images = [])=>{
  let i = rankRewardPreview.length
  while(i--){
    let reward = getRewards(rankRewardPreview[i], lang, mysteryBoxList, images)
    if(reward) rewards.push(reward)
    if(reward?.texture) images.push(reward.texture)
  }
}
const mapCampaignMission = (campaignMission = {}, missions = [], lang = {}, mysteryBoxList = [], images = [])=>{
  let mission = {
    id: campaignMission.id,
    nameKey: lang[campaignMission.nameKey] || campaignMission.nameKey,
    nameKey: lang[campaignMission.descKey] || campaignMission.descKey,
    combatType: campaignMission.combatType,
    rewards:[]
 }
 if(campaignMission.entryCategoryAllowed){
   mission.requirements = {
     faction: campaignMission.entryCategoryAllowed.categoryId,
     rarity: campaignMission.entryCategoryAllowed.minimumUnitRarity || 0,
     gear: campaignMission.entryCategoryAllowed.minimumUnitTier || 0,
     relic: campaignMission.entryCategoryAllowed.minimumRelicTier || 0,
   }
 }
 if(campaignMission?.rankRewardPreview?.length > 0) mapRewards(campaignMission.rankRewardPreview, mission.rewards, lang, mysteryBoxList, images)
 missions.push(mission)
}
const mapGuildRaid = async(raid = {}, lang = {}, mysteryBoxList = [], autoComplete = [], images = [], campaignNode)=>{
  let campaign = campaignNode?.find(x=>x.id === raid?.campaignElementIdentifier?.campaignNodeId)
  if(!campaign) return
  let campaignMission = campaign.campaignNodeMission
  if(!campaignMission) return
  raid.nameKey = lang[campaign.nameKey] || campaign.nameKey
  raid.mission = []
  if(raid.image) images.push(raid.image)
  if(raid.portraitIcon) images.push(raid.portraitIcon)
  if(raid.infoImage) images.push(raid.infoImage)
  let i = campaignMission.length
  while(i--) mapCampaignMission(campaignMission[i], raid.mission, lang, mysteryBoxList, images)
  await mongo.set('raidDef', { _id: raid.id }, raid)
  if(raid?.nameKey && raid?.id) autoComplete.push({name: raid.nameKey, value: raid.id})
}
module.exports = async(gameVersion, localeVersion, assetVersion)=>{
  let [ guildRaidList, campainList, mysteryBoxList, lang ] = await Promise.all([
    getFile('guildRaid', gameVersion),
    getFile('campaign', gameVersion),
    getFile('mysteryBox', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!guildRaidList || !campainList || !mysteryBoxList || !lang) return

  let guildCampaign = campainList?.find(x=>x.id === 'GUILD')

  if(!guildCampaign) return
  let campaignNode = guildCampaign?.campaignMap?.find(x=>x.id === 'RAIDS')?.campaignNodeDifficultyGroup[0]?.campaignNode
  if(!campaignNode) return
  let images = [], autoComplete = [], i = guildRaidList.length, array = []
  while(i--) array.push(mapGuildRaid(guildRaidList[i], lang, mysteryBoxList, autoComplete, images, campaignNode))
  await Promise.all(array)
  if(images.length > 0 && assetVersion) checkImages(images, assetVersion, 'asset', 'raidList')
  if(autoComplete?.length > 0) await mongo.set('autoComplete', {_id: 'raid'}, {data: autoComplete, include: true})
  await mongo.set('autoComplete', {_id: 'nameKeys'}, { include: false, 'data.raid': 'raid' })
  return true
}
