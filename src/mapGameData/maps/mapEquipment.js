'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const getRecipeList = require('./getRecipeList')

const mapEquipment = async(equipment = {}, lang = {}, recipeList = {})=>{
  let tempObj = { id: equipment.id, nameKey: lang[equipment.nameKey] || equipment.nameKey, iconKey: equipment.iconKey, tier: equipment.tier, mark: equipment.mark, recipeId: equipment.recipeId }
  let recipe = recipeList.find(x=>x.id == equipment.recipeId)
  tempObj.recipe = recipe?.ingredients || []
  if(tempObj.id) await mongo.set('equipment', { _id: equipment.id }, tempObj)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ equipmentList, lang, recipeList ] = await Promise.all([
    getFile('equipment', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getRecipeList(gameVersion, localeVersion)
  ])
  if(!equipmentList || !lang || !recipeList) return
  let i = equipmentList.length, array = []
  while(i--) array.push(mapEquipment(equipmentList[i], lang, recipeList))
  await Promise.all(array)
  return true
}
