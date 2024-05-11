'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapTiers = (teir = {}, dataList = {})=>{
  let tempEquip = dataList.materialList.find(x=>x.id === teir.id)
  if(tempEquip){
    teir.nameKey = dataList.lang[tempEquip.nameKey] || tempEquip.nameKey
    teir.descKey = dataList.lang[tempEquip.descKey] || tempEquip.descKey
    teir.iconKey = tempEquip.iconKey
  }else{
    if(teir.id !== 'GRIND') return
    teir.nameKey = dataList.lang['Shared_Currency_Grind']
    teir.descKey = dataList.lang['Shared_Currency_Grind_Desc_TU13']
    teir.iconKey = 'tex.goldcreditbar'
  }
}
const mapTierUpRecipe = (tierUpRecipeTableId, dataList = {})=>{
  let tempObj = { id: tierUpRecipeTableId, tiers: [] }
  let tempTiers = dataList.tableList.find(x=>x.id === tierUpRecipeTableId)?.row || []
  if(!tempTiers || tempTiers.length ==  0) return tempObj
  for(let i in tempTiers){
    mapTiers(tempTiers[i], dataList)
    tempObj.tiers.push(tempTiers[i])
  }
  return tempObj
}
const mapPromotionIngredients = (ingredient = {}, dataList = {})=>{
  let tempEquip = dataList.materialList.find(x=>x.id === ingredient.id)
  if(tempEquip){
    ingredient.nameKey = dataList.lang[tempEquip.nameKey] || tempEquip.nameKey
    ingredient.descKey = dataList.lang[tempEquip.descKey] || tempEquip.descKey
    ingredient.iconKey = tempEquip.iconKey
    ingredient.sellValue = tempEquip.sellValue
  }else{
    if(ingredient.id !== 'GRIND') return
    ingredient.nameKey = dataList.lang['Shared_Currency_Grind']
    ingredient.descKey = dataList.lang['Shared_Currency_Grind_Desc_TU13']
    ingredient.iconKey = 'tex.goldcreditbar'
  }
}
const mapPromotion = (promotionId, promotionRecipeId, dataList = {})=>{
  let tempObj = { id: promotionId, ingredients: dataList.recipeList.find(x=>x.id === promotionRecipeId)?.ingredients || [] }
  if(!tempObj.ingredients || tempObj.ingredients?.length == 0) return tempObj
  for(let i in tempObj.ingredients) mapPromotionIngredients(tempObj.ingredients[i], dataList)
  return tempObj
}
const mapStatMod = async(statMod = {}, dataList = {})=>{
  let tempObj = { id: statMod.id, slot: +statMod.slot - 1, rarity: +statMod.rarity, setId: +statMod.setId, level : { id: statMod.levelTableId, table: dataList.xpTableList.find(x=>x.id === statMod.levelTableId)?.row || [] }}
  if(statMod.promotionId) tempObj.promotion = mapPromotion(statMod.promotionId, statMod.promotionRecipeId, dataList)
  if(statMod.tierUpRecipeTableId) tempObj.tier = mapTierUpRecipe(statMod.tierUpRecipeTableId, dataList)
  if(tempObj.id) await mongo.set('modDef', { _id: tempObj.id }, tempObj)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ statModList, recipeList, xpTableList, tableList, materialList, lang ] = await Promise.all([
    getFile('statMod', gameVersion),
    getFile('recipe', gameVersion),
    getFile('xpTable', gameVersion),
    getFile('table', gameVersion),
    getFile('material', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])

  if(!statModList || !recipeList || !xpTableList || !tableList || !materialList || !lang) return

  statModList = statModList.filter(x=>x.levelTableId)
  if(statModList.length == 0) return
  let i = statModList.length, array = [], dataList = { recipeList: recipeList, xpTableList: xpTableList, tableList: tableList, materialList: materialList, lang: lang }
  while(i--) array.push(mapStatMod(statModList[i], dataList))
  await Promise.all(array)
  return true
}
