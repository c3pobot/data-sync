'use strict'
const ReadFile = require('./readFile')
const IndexUnits = require('./indexUnits')
const IndexUltimates = require('./indexUltimates')
module.exports = async(errObj)=>{
  try {
    let abilities = await ReadFile(baseDir+'/data/files/ability.json')
    let skills = await ReadFile(baseDir+'/data/files/skill.json')
    let effectList = await ReadFile(baseDir+'/data/files/effect.json')
    let skillIds = await IndexUnits(errObj)
    let ultimateIds = await IndexUltimates(errObj)
    if(abilities && skills && effectList && skillIds){
      console.log("Saving abilityDamage to db")
      for(let i in skillIds){
        const skillInfo = skills.find(x=>x.id === skillIds[i])
        const abilityInfo = abilities.find(x=>x.id === skillInfo.abilityReference)
        const tempObj = {
          skillId: skillIds[i],
          abilityid: abilityInfo.id,
          nameKey: abilityInfo.nameKey,
          isZeta: skillInfo.isZeta,
          type: abilityInfo.abilityType,
          tiers: abilityInfo.tier,
          abilityDamage: []
        }
        for(let a in tempObj.tiers){
          for(let e in tempObj.tiers[a].effectReference){
            const effectInfo = effectList.find(x=>x.id === tempObj.tiers[a].effectReference[e].id)
            if(effectInfo.multiplierAmountDecimal > 0 || effectInfo.summonId){
              tempObj.abilityDamage.push({
                id: effectInfo.id,
                param: effectInfo.param,
                damageType: effectInfo.damageType,
                multiplierAmountDecimal: effectInfo.multiplierAmountDecimal,
                resultVarianceDecimal: effectInfo.resultVarianceDecimal,
                summonId: effectInfo.summonId,
                summonEffectList: effectInfo.summonEffect
              })
            }
          }
        }
        await redis.set('ad-'+skillIds[i], tempObj)
      }
      for(let i in ultimateIds){
        const abilityInfo = abilities.find(x=>x.id === ultimateIds[i])
        const tempObj = {
          abilityid: ultimateIds[i],
          nameKey: abilityInfo.nameKey,
          type: abilityInfo.abilityType,
          abilityDamage: []
        }
        for(let e in abilityInfo.effectReference){
          const effectInfo = effectList.find(x=>x.id === abilityInfo.effectReference[e].id)
          if(effectInfo.multiplierAmountDecimal > 0 || effectInfo.summonId){
            tempObj.abilityDamage.push({
              id: effectInfo.id,
              param: effectInfo.param,
              damageType: effectInfo.damageType,
              multiplierAmountDecimal: effectInfo.multiplierAmountDecimal,
              resultVarianceDecimal: effectInfo.resultVarianceDecimal,
              summonId: effectInfo.summonId,
              summonEffectList: effectInfo.summonEffect
            })
          }
        }
        await redis.set('ad-'+ultimateIds[i], tempObj)
      }
      console.log('ability damage saved to db')
      abilities = null
      skills = null
      skillIds = null
      effectList = null
      errObj.complete++
      return
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    console.log(e)
    errObj.error++
  }

}
