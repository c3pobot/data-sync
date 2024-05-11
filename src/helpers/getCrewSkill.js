'use strict'
const getSkill = require('./getSkill')
module.exports = (crew = [], skillMap = {}, abilityList = [], effectList = [])=>{
  let res = {}, i = crew.length
  if(i === 0) return
  while(i--){
    let crewSkill = getSkill(crew[i].skillReference, skillMap, abilityList, effectList)
    if(crewSkill) res = { ...res, ...crewSkill }
  }
  if(Object.values(res)?.length > 0) return res
}
