'use strict'
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try{
    let obj = await ReadFile(baseDir+'/data/files/recipe.json')
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let list
    if(obj){
      const list = obj.map(r=>{
        if(r.ingredients.length > 0){
          return Object.assign({}, {
            id: r.id,
            ingredients: r.ingredients,
            result: r.result,
            nameKey: (lang[r.descKey] || r.descKey)
          })
        }
      })
      obj = null;
      lang = null;
      return list;
    }else{
      errObj.error++
      return
    }
  }catch(e){
    throw(e)
  }
}
