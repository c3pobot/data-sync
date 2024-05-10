'use strict'
module.exports = (abilityId, abilityList = [], effectList = [])=>{
  if(!abilityId) throw('missing abilityId in getOffenseStatId')
  let ability = abilityList.find(x=>x.id === abilityId)
  if(!ability) throw('ability for '+abilityId+' not found in getOffenseStatId')
  let effects = ability.effectReference
  if(effects) effects = effects.filter(x=>x.id.includes('damage'))
  if(effects?.length === 0) return
  let pd = 0, sd = 0
  for(let i in effects){
    let effect = effectList.find(x=>x.id === effects[i].id && x.multiplierAmountDecimal > 0)
    if(effect?.param?.filter(x=>x === 'ATTACK_DAMAGE').length > 0) pd++
    if(effect?.param?.filter(x=>x === 'ABILITY_POWER').length > 0) sd++
  }
  if(pd === 0 && sd === 0) return
  if(sd > pd){
    return 7
  }
  return 6
}
