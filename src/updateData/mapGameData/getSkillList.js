'use strict'
const ReadFile = require('./readFile')
const GetAbilityList = require('./getAbilityList')
const enumOmicron = require('./enumOmicron')
module.exports = async(errObj)=>{
  try {
    let abilityList = await GetAbilityList(errObj)
    let obj = await ReadFile(baseDir+'/data/files/skill.json')
    let lang = await ReadFile(baseDir+'/data/files/Loc_ENG_US.txt.json')
    let recipeList = await ReadFile(baseDir+'/data/files/recipe.json')
    if(abilityList && obj && lang){
      const list = {}
      await obj.forEach(s=>{
        if(lang[abilityList[s.abilityReference].nameKey]){
          let descKey = abilityList[s.abilityReference].descKey
          if(abilityList[s.abilityReference].tier && abilityList[s.abilityReference].tier.length > 0 && abilityList[s.abilityReference].tier[s.tier.length - 1]) descKey = abilityList[s.abilityReference].tier[s.tier.length - 1].descKey;
          list[s.id] = {
            id: s.id,
            abilityId: abilityList[s.abilityReference].id,
            maxTier: +(s.tier.length) + 1,
            nameKey: lang[abilityList[s.abilityReference].nameKey],
            descKey: (descKey && lang[descKey] ? lang[descKey]:descKey),
            omicronMode: s.omicronMode,
            omicronType: (enumOmicron[s.omicronMode] ? enumOmicron[s.omicronMode].nameKey:''),
            type: (enumOmicron[s.omicronMode] ? enumOmicron[s.omicronMode].type:'')
          }
          for(let i in s.tier){
            if(!(list[s.id].zetaTier >= 0) && s.tier[i].isZetaTier) list[s.id].zetaTier = +i + 2;
            if(s.tier[i].isOmicronTier) list[s.id].omiTier = +i + 2;
          }
        }
      })
      abilityList = null
      obj = null
      lang = null
      recipeList = null
      return list
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    console.log(e)
    errObj.error++
  }

}
