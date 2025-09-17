'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const findRecipe = ( recipeId, lang, equipmentList, recipeList, components = {}, salvage = {}) => {
  let tempRecipe = recipeList.find(x=>x.id == recipeId)
  if(!tempRecipe?.ingredients || tempRecipe.ingredients?.length == 0) return
  for(let i in tempRecipe.ingredients){
    if(tempRecipe.ingredients[i].id === "GRIND") continue;
    if(components[tempRecipe.ingredients[i].id]) continue;
    if(salvage[tempRecipe.ingredients[i].id]) continue;
    let tempEquip = equipmentList.find(x=>x.id === tempRecipe.ingredients[i].id)
    if(!tempEquip?.id) continue;
    if(tempEquip?.recipeId){
      components[tempEquip.id] = { id: tempEquip.id, nameKey: lang[tempEquip.nameKey] || tempEquip.nameKey, iconKey: tempEquip.iconKey, recipeId: tempEquip.recipeId, tier: tempEquip.tier, mark: tempEquip.mark }
      findRecipe(tempEquip?.recipeId, lang, equipmentList, recipeList, components, salvage)
    }else{
      salvage[tempEquip.id] = { id: tempEquip.id, nameKey: lang[tempEquip.nameKey] || tempEquip.nameKey, iconKey: tempEquip.iconKey, recipeId: tempEquip.recipeId, tier: tempEquip.tier, mark: tempEquip.mark }
    }
  }
}
const findRelicMats = (ingredients = [], materialList = [], lang, relicSalvage = {}, relicMat = {})=>{
  if(ingredients?.length == 0) return
  for(let i in ingredients){
    if(ingredients[i].id == 'GRIND') continue
    if(relicSalvage[ingredients[i].id]) continue
    if(relicMat[ingredients[i].id]) continue
    let tempMat = materialList.find(x=>x.id === ingredients[i].id)
    if(!tempMat || !tempMat.id) continue
    if(tempMat.type == 11) relicMat[tempMat.id] = { id: tempMat.id, nameKey: lang[tempMat.nameKey] || tempMat.nameKey, iconKey: tempMat.iconKey, tier: tempMat.tier, mark: tempMat.mark }
    if(tempMat.type == 12) relicSalvage[tempMat.id] = { id: tempMat.id, nameKey: lang[tempMat.nameKey] || tempMat.nameKey, iconKey: tempMat.iconKey, tier: tempMat.tier, mark: tempMat.mark }
  }
}
module.exports = async( gameVersion, localeVersion) =>{
  let [ equipmentList, recipeList, materialList, lang ] = await Promise.all([
    getFile('equipment', gameVersion),
    getFile('recipe', gameVersion),
    getFile('material', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!equipmentList || !lang || !recipeList || !materialList) return

  let equipment = equipmentList.filter(x=>x.requiredLevel == 85 && x.obtainableTime == "0")
  let relicList = recipeList.filter(x=>x.type == 10) //type 10 = RECIPE_RELIC
  let abilityList = materialList.filter(x=>x.type == 5 ) //type 5 = SKILL_MATERIAL
  if(!relicList || relicList?.length == 0) return
  if(!abilityList || abilityList?.length == 0) return

  let equip = {}, salvage = {}, components = {}, relicSalvage = {}, relicMat = {}, abilityMat = {}

  for(let i in relicList) findRelicMats( relicList[i].ingredients, materialList, lang, relicSalvage, relicMat)
  for(let i in abilityList){
    if(!lang[abilityList[i].nameKey]) continue;
    if(abilityMat[abilityList[i].id]) continue;
    abilityMat[abilityList[i].id] = { id: abilityList[i].id, nameKey: lang[abilityList[i].nameKey] || abilityList[i].nameKey, iconKey: abilityList[i].iconKey }
  }
  for(let i in equipment){
    if(equip[equipment[i].id]) continue;
    equip[equipment[i].id] = { id: equipment[i].id, nameKey: lang[equipment[i].nameKey] || equipment[i].nameKey, iconKey: equipment[i].iconKey, recipeId: equipment[i].recipeId, tier: equipment[i].tier, mark: equipment[i].mark  }
    if(!equipment[i].recipeId) continue;
    findRecipe(equipment[i].recipeId, lang, equipmentList, recipeList, components, salvage)
  }
  await mongo.set('configMaps', { _id: 'gearTrackerDefMap' }, { gameVersion: gameVersion, localeVersion: localeVersion, data: { gear: equip, components: components, salvage: salvage, relicMat: relicMat, relicSalvage: relicSalvage, abilityMat: abilityMat } })
  return true
}
