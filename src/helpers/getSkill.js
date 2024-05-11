'use strict'
const getAbillityDamage = require('./getAbillityDamage')
module.exports = (skillReference = [], skillMap = {}, abilityList = [], effectList = [])=>{
  if(skillReference.length === 0) throw ('skillReference length is 0 for getSkill')
  let res = {}
  for(let i in skillReference){
    if(!skillMap[skillReference[i].skillId]) throw('skill for '+skillReference[i].skillId+' not found for getSkill')
    res[skillReference[i].skillId] = JSON.parse(JSON.stringify(skillMap[skillReference[i].skillId]))
    let abilityDamage = getAbillityDamage(skillMap[skillReference[i].skillId].abilityId, abilityList, effectList)
    if(abilityDamage) res[skillReference[i].skillId].damage = abilityDamage
  }
  if(Object.values(res)?.length > 0) return res
}
