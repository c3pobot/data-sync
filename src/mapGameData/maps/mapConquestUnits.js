'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const mapReward = (item = {}, recipeList = [], unitList = [], rewardUnits = {})=>{
  if(!item?.id?.includes('unitshard')) return
  let recipe = recipeList?.find(x=>x.ingredients?.filter(y=>y.id === item?.id)?.length > 0)
  if(!recipe?.id) return

  let unit = unitList.find(x=>x.creationRecipeReference === recipe.id)
  if(!unit?.baseId) return

  if(!rewardUnits[unit.baseId]) rewardUnits[unit.baseId] = unit.baseId
}
const mapCqDef = (cqDef = {}, rewardList = [], recipeList = [], unitList = [], rewardUnits = {})=>{
  let cq = cqDef.conquestDifficulty?.find(x=>x.id === 10)
  if(!cq?.rankRewardPreview || cq?.rankRewardPreview?.length === 0) return

  let rewardId = cq.rankRewardPreview[cq.rankRewardPreview.length - 1]?.primaryReward?.find(x=>x.type === 14)?.id
  if(!rewardId) return

  let rewardBox = rewardList.find(x=>x.id === rewardId)
  if(!rewardBox?.previewItem || rewardBox?.previewItem?.length === 0) return

  for(let i in rewardBox.previewItem) mapReward(rewardBox.previewItem[i], recipeList, unitList, rewardUnits)

}
module.exports = async(gameVerion, localeVersion, assetVersion)=>{
  let [ cqDefinitionList, rewardList, recipeList, unitList ] = await Promise.all([
    getFile('conquestDefinition', gameVerion),
    getFile('mysteryBox', gameVerion),
    getFile('recipe', gameVerion),
    getFile('units', gameVerion)
  ])
  unitList = unitList?.filter(x=>x.rarity == 7 && x.obtainable == true && x.obtainableTime == 0)
  if(!cqDefinitionList || !rewardList || !recipeList || !unitList) return
  let rewardUnits = {}
  for(let i in cqDefinitionList) mapCqDef(cqDefinitionList[i], rewardList, recipeList, unitList, rewardUnits)
  let cqFaction = (await mongo.find('factions', { _id: 'conquest_units_manual' }, { _id: 0, TTL: 0 }))[0]
  if(!cqFaction) cqFaction = { baseId: 'conquest_units_manual', nameKey: 'Conquest Units', uiFilter: true, units: [], unitMap: rewardUnits }
  for(let i in rewardUnits){
    if(!rewardUnits[i]) continue
    if(!cqFaction.unitMap[i]) cqFaction.unitMap[i] = i
  }
  cqFaction.units = Object.values(rewardUnits)
  await mongo.set('factions', { _id: 'conquest_units_manual' }, cqFaction)
  return true
}
