'use strict'
const getAbillityDamage = require('./getAbillityDamage')
module.exports = (limitBreakRef = [], lang = {}, abilityList = [], effectList = [], excludeDesc = false)=>{
  let res = {}, i = limitBreakRef.length
  if(i === 0) return
  while(i--){
    let ability = abilityList.find(x=>x.id === limitBreakRef[i].abilityId)
    if(!ability || !lang[ability?.nameKey]) continue
    let descKey = ability.descKey
    if(ability.tier?.length > 0 && ability.tier[ability.tier.length - 1]) descKey = ability.tier[ability.tier.length - 1].descKey;
    res[ability.id] = { id: ability.id, nameKey: lang[ability.nameKey], type: 'ULT' }
    if(!excludeDesc) res[ability.id].descKey = lang[descKey] || descKey
    let abilityDamage = getAbillityDamage(ability.id, abilityList, effectList)
    if(abilityDamage) res[ability.id].damage = abilityDamage
  }
  if(Object.values(res).length > 0) return res
}
