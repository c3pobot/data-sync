'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const getTier = (string)=>{
  let res = ''
  string = string.replace(/_/g, '')
  for(let i = 0;i<string.length;i++){
    if(+string.charAt(i) >= 0) res += string.charAt(i)
  }
  if(+res > 0) return +res
}

const getIngredients = (ingredients = [], lang = {}, materialList = [])=>{
  let res = [], i = ingredients.length
  while(i--){
    if(ingredients[i].id == 'GRIND') continue
    let mat = materialList.find(x=>x.id === ingredients[i].id)
    let tempObj = { id: ingredients[i].id, qty: ingredients[i].minQuantity, nameKey: lang[mat?.nameKey] || mat?.nameKey, iconKey: mat?.iconKey, tier: mat.tier, rarity: mat.rarity }
    res.push(tempObj)
  }
  return res
}
const mapRecipe = async(recipe, lang = {}, materialList = [])=>{
  let tier = getTier(recipe.id)
  let tempObj = { id: 'relic-'+tier, tier: tier, type: 'relic', ingredients: [] }
  if(recipe.ingredients?.length > 0) tempObj.ingredients = getIngredients(recipe.ingredients, lang, materialList)
  await mongo.set('recipe', { _id: tempObj.id }, tempObj)
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ recipeList, materialList, lang ] = await Promise.all([
    getFile('recipe', gameVersion),
    getFile('material', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!recipeList || !materialList || !lang) return

  let relicList = recipeList.filter(x=>x.id.startsWith('relic_'))
  if(!relicList || relicList?.length == 0) return

  let i = relicList.length, array = []
  while(i--) array.push(mapRecipe(relicList[i], lang, materialList))
  await Promise.all(array)
  return true
}
