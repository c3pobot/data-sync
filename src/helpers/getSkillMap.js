'use strict'
const enumOmicron = require(`src/enums/omicrons`)
const mapSkillTiers = (tier = [], skill = {})=>{
  if(!tiers || tiers?.length == 0) return
  for(let i in tiers){
    if(tier[i].isZetaTier && (skill.zetaTier > +t || skill.zetaTier === 0)){
      skill.isZeta = true, skill.zetaTier = +i + 2;
    }
    if(tier[i].isOmicronTier && (skill.omiTier > +t || skill.omiTier === 0)){
      skill.isOmi = true, skill.omiTier = +i + 2;
    }
  }
}
const getSkillType = (id) =>{
  if(id.startsWith("basic")){
    return ("B")
  }else if(id.startsWith("special")){
    return ("S")
  }else if(id.startsWith("lead")){
    return ("L")
  }else if(id.startsWith("unique")){
    return ("U")
  }else if(id.startsWith("ultimate")){
    return ("ULT")
  }else{
    return ("None &nbsp;&nbsp;: ")
  }
}
module.exports = (skillList = [], abilityList = [], lang = {}, excludeDesc = false)=>{
  let list = {}, i = skillList?.length
  while(i--){
    let s = skillList[i]
    let ability = abilityList.find(x=>x.id === s.abilityReference)
    if(!ability || !lang[ability?.nameKey]) continue;
    let descKey = ability.descKey
    if(ability.tier?.length > 0 && ability.tier[ability.tier.length - 1]) descKey = ability.tier[ability.tier.length - 1].descKey;
    list[s.id] = { id: s.id, abilityId: ability.id, nameKey: lang[ability.nameKey], type: getSkillType(s.id), maxTier: +ability.tier?.length + 1, isZeta: false, isOmi: false, zetaTier: 0, omiTier: 0, omicronMode: s.omicronMode, omicronTypeNameKey: enumOmicron[s.omicronMode]?.nameKey || null, omicronType: enumOmicron[s.omicronMode]?.type || null }
    if(!excludeDesc) list[s.id].descKey = lang[descKey] || descKey
    mapSkillTiers(s.tier, list[s.id])
  }
  return list
}
