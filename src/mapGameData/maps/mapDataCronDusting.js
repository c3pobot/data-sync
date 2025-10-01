'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const checkImages = require('src/helpers/checkImages')

const mapIngredents = async(ingredients = [], materialList = [], lang = {}, materialSet, images = [])=>{
  for(let i in ingredients){
    if(!ingredients[i]?.id) continue
    if(materialSet?.has(ingredients[i].id)) continue
    let material = materialList.find(x=>x.id == ingredients[i].id)
    if(!material) continue
    await mongo.set('equipment', { _id: material.id }, { id: material.id, iconKey: material.iconKey, nameKey: lang[material.nameKey] || material.nameKey })
    images.push(material.iconKey)
    materialSet.add(material.id)
  }
}
const mapDustRecipe = async(datacronSet, recipeList = [], materialList = [], lang = {}, materialSet, images = [])=>{
  if(!datacronSet?.tier) return
  for(let i in datacronSet.tier){
    if(!datacronSet.tier[i]?.dustGrantRecipeId) continue
    let recipe = recipeList.find(x=>x.id == datacronSet.tier[i].dustGrantRecipeId)
    if(!recipe?.ingredients || recipe?.ingredients?.length == 0) continue
    let ingredients = recipe.ingredients?.map(x=>{
      return { id: x.id, type: x.type, quantity: x.maxQuantity, rarity: x.rarity }
    })
    await mapIngredents(ingredients, materialList, lang, materialSet, images)
    await mongo.set('recipe', { _id: recipe.id }, { id: recipe.id, ingredients: ingredients, type: recipe.type })
  }
}
module.exports = async(gameVerion, localeVersion, assetVersion)=>{
  let [ datacronSetList, recipeList, materialList, lang ] = await Promise.all([
    getFile('datacronSet', gameVerion),
    getFile('recipe', gameVerion),
    getFile('material', gameVerion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!lang || !datacronSetList || !recipeList || !materialList ) return

  let i = datacronSetList.length, array = [], materialSet = new Set([]), images = []
  while(i--) array.push(mapDustRecipe(datacronSetList[i], recipeList, materialList, lang, materialSet, images))
  await Promise.all(array)
  if(images?.length > 0) checkImages(images, assetVersion, 'asset', 'datacronSetDusting')
  return true
}
