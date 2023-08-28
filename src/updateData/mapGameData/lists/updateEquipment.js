'use strict'
const ReadFile = require('./readFile')
const GetRecipeList = require('./getRecipeList')
module.exports = async(errObj)=>{
  try {
    console.log('Updating Equipment ...')
    let obj = await ReadFile(baseDir+'/data/files/equipment.json')
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let recipeList = await GetRecipeList(errObj)
    if(obj && lang && recipeList){
      for(let i in obj){
        const tempObj = {
          id: obj[i].id,
          nameKey: (lang[obj[i].nameKey] || obj[i].nameKey),
          iconKey: obj[i].iconKey,
          tier: obj[i].tier,
          mark: obj[i].mark,
          recipeId: obj[i].recipeId
        }
        if(obj[i].recipeId && recipeList.find(x=>x.id == obj[i].recipeId)) tempObj.recipe = (recipeList.find(x=>x.id == obj[i].recipeId) ? recipeList.find(x=>x.id == obj[i].recipeId).ingredients:[])
        mongo.set('equipment', {_id: obj[i].id}, tempObj)
      }
      obj = null
      lang = null
      recipeList = null
      errObj.complete++
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    throw(e)
  }
}
