'use strict'
const getEffectDamage = require('./getEffectDamage')
module.exports = (abilityId, abilityList = [], effectList = [])=>{
  let res = {}, tier = []
  if(!abilityId) throw ('abilityId missing in getAbillityDamage')
  let ability = abilityList.find(x=>x.id === abilityId)
  if(!ability) throw ('ability for '+abilityId+' not found in getAbillityDamage')
  tier.push({ effectReference: ability.effectReference })
  tier = tier.concat(ability.tier)
  for(let i in tier){
    let abilityTier = +i + 1
    let tempObj = getEffectDamage(tier[i].effectReference.filter(x=>x.id.includes('damage')), effectList)
    if(tempObj?.length > 0) res[abilityTier] = { skillTier: abilityTier, damage: tempObj }
  }
  if(Object.values(res).length > 0) return res
}
