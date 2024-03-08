'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
let tempIcon = {}
const getIcon = async(iconKey, version, manifest)=>{
  if(!tempIcon[iconKey]){
    let obj = await Img.get(iconKey, version, manifest)
    if(obj){
      tempIcon[iconKey] = 1
      mongo.set('equipmentIcon', {_id: iconKey}, {image: obj, id: iconKey, type: 'mods'})
    }
  }
}
module.exports = async(metaData = {}, errorObj = {})=>{
  try{
    let tempIcon = {};
    if(metaData.config?.length > 0 && metaData.assetVersion){
      await mongo.set('metaData', {_id: 'config'}, {data: metaData.config})
      let statMod = await ReadFile(`${baseDir}/data/files/statMod.json`)
      if(statMod) statMod = statMod.filter(x=>x.levelTableId)
      let recipe = await ReadFile(`${baseDir}/data/files/recipe.json`)
      let xpTable = await ReadFile(`${baseDir}/data/files/xpTable.json`)
      let table = await ReadFile(`${baseDir}/data/files/table.json`)
      let equipment = await ReadFile(`${baseDir}/data/files/material.json`)
      let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
      for(let i in statMod){
        let tempObj = {id: statMod[i].id, slot: (+statMod[i].slot - 1), rarity: +statMod[i].rarity, setId: +statMod[i].setId, level : {id: statMod[i].levelTableId, table: (xpTable.find(x=>x.id === statMod[i].levelTableId)?.row || [])}}
        if(statMod[i].promotionId){
          tempObj.promotion = {id: statMod[i].promotionId, ingredients: (recipe.find(x=>x.id === statMod[i].promotionRecipeId)?.ingredients || [])}
          if(tempObj.promotion?.ingredients?.length > 0){
            for(let p in tempObj.promotion.ingredients){
              let tempEquip = equipment.find(x=>x.id === tempObj.promotion.ingredients[p].id)
              if(tempEquip){
                tempObj.promotion.ingredients[p].nameKey = lang[tempEquip.nameKey] || tempEquip.nameKey
                tempObj.promotion.ingredients[p].descKey = lang[tempEquip.descKey] || tempEquip.descKey
                tempObj.promotion.ingredients[p].iconKey = tempEquip.iconKey
                tempObj.promotion.ingredients[p].sellValue = tempEquip.sellValue
              }else{
                if(tempObj.promotion.ingredients[p].id === 'GRIND'){
                  tempObj.promotion.ingredients[p].nameKey = lang['Shared_Currency_Grind']
                  tempObj.promotion.ingredients[p].descKey = lang['Shared_Currency_Grind_Desc_TU13']
                  tempObj.promotion.ingredients[p].iconKey = 'tex.goldcreditbar'
                }
              }
            }
          }
        }
        if(statMod[i].tierUpRecipeTableId){
          tempObj.tier = {id: statMod[i].tierUpRecipeTableId, tiers: []}
          let tempTiers = (table.find(x=>x.id === statMod[i].tierUpRecipeTableId)?.row || [])
          if(tempTiers?.length > 0){
            for(let t in tempTiers) {
              let tempTier = (recipe.find(x=>x.id === tempTiers[t].value)?.ingredients || [])
              if(tempTier?.length > 0){
                for(let p in tempTier){
                  let tempEquip = equipment.find(x=>x.id === tempTier[p].id)
                  if(tempEquip){
                    tempTier[p].nameKey = lang[tempEquip.nameKey] || tempEquip.nameKey
                    tempTier[p].descKey = lang[tempEquip.descKey] || tempEquip.descKey
                    tempTier[p].iconKey = tempEquip.iconKey
                  }else{
                    if(tempTier[p].id === 'GRIND'){
                      tempTier[p].nameKey = lang['Shared_Currency_Grind']
                      tempTier[p].descKey = lang['Shared_Currency_Grind_Desc_TU13']
                      tempTier[p].iconKey = 'tex.goldcreditbar'
                    }
                  }
                }
              }
              tempObj.tier.tiers.push({key: tempTiers[t].key, value: tempTiers[t].value, ingredients: tempTier });
            }
          }
        }
        await mongo.set('modsDef', {_id: statMod[i].id}, tempObj)
      }
      errorObj.complete++;
    }
  }catch(e){
    throw(e)
  }
}
