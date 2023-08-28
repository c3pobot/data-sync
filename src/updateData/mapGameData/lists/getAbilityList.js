'use strict'
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try {
    let obj = await ReadFile(baseDir+'/data/files/ability.json')
    if(obj){
      const list = {}
      obj.forEach(a=>{
        list[a.id] = {
          id: a.id,
          nameKey: a.nameKey,
          descKey: a.descKey,
          tier: a.tier.map(m=>{return Object.assign({}, {descKey: m.descKey, upgradeDescKey: m.upgradeDescKey})})
        }
      })
      obj = null
      return list
    }else{
      errObj.error++
      return
    }
  } catch (e) {
    throw(e)
  }
}
