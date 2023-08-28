'use strict'
const ReadFile = require('./readFile')
let material, lang
const getTier = (string)=>{
  let res = ''
  string = string.replace(/_/g, '')
  for(let i = 0;i<string.length;i++){
    if(+string.charAt(i) >= 0) res += string.charAt(i)
  }
  if(+res > 0) return +res
}

const getIngredients = (array = [])=>{
  try{
    let res = []
    for(let i in array){
      if(array[i].id !== 'GRIND'){
        let mat = material.find(x=>x.id === array[i].id)
        const tempObj = {
          id: array[i].id,
          qty: array[i].minQuantity,
          nameKey: lang[mat?.nameKey] || mat?.nameKey,
          iconKey: mat?.iconKey
        }
        res.push(tempObj)
      }
    }
    return res
  }catch(e){
    console.error(e)
  }
}
module.exports = async(errObj)=>{
  try{
    let relic
    let recipe = await ReadFile(baseDir+'/data/files/recipe.json')
    material = await ReadFile(baseDir+'/data/files/material.json')
    lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    if(recipe?.length > 0) relic = recipe.filter(x=>x.id.startsWith('relic_'))
    if(relic?.length > 0){
      console.log('Updating relic recipes')
      for(let i in relic){
        let tier = await getTier(relic[i].id)
        let tempObj = {
          id: 'relic-'+tier,
          tier: tier,
          type: 'relic',
          ingredients: []
        }
        if(relic[i].ingredients?.length > 0) tempObj.ingredients = await getIngredients(relic[i].ingredients)
        await mongo.set('recipe', {_id: tempObj.id}, tempObj)
      }
      errObj.complete++
    }
  }catch(e){
    throw(e)
  }
}
