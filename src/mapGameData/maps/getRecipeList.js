'use strict'
const getFile = require('src/helpers/getFile')
module.exports = async(gameVersion, localeVersion)=>{
  let [ obj, lang ] = await Promise.all([
    getFile('recipe', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion)
  ])
  if(!obj || !lang) return
  let list = obj.map(r=>{
    if(r.ingredients.length > 0) return { id: r.id, ingredients: r.ingredients, result: r.result, nameKey: (lang[r.descKey] || r.descKey) }
  })
  return list;
}
