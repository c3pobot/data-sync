'use strict'
const getDamageType = (param = [])=>{
  let enumDamageType = { MAX_HEALTH: 1, ATTACK_DAMAGE: 6, ABILITY_POWER: 7 }
  let res, i = param.length
  if(i === 0) return res
  while(i--){
    if(enumDamageType[param[i]] > 0) return enumDamageType[param[i]]
  }
}
module.exports = (effectReference = [], effectList = [])=>{
  let res = [], i = effectReference?.length
  if(i === 0) return
  while(i--){
    let effect = effectList?.find(x=>x.id === effectReference[i].id)
    if(!effect || (effect?.multiplierAmountDecimal === 0)) continue;
    let tempObj = { id: effect.id, multiplierAmountDecimal: effect.multiplierAmountDecimal }
    let damageType = getDamageType(effect.param)
    if(damageType) tempObj.statId = damageType
    if(tempObj.statId) res.push(tempObj)
  }
  return res
}
