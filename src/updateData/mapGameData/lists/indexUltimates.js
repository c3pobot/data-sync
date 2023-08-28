'use strict'
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try{
    let units = await ReadFile(baseDir+'/data/files/units.json')
    if(units){
      units = units.filter(u => {
          if( parseInt(u.rarity) !== 7 ) return false
          if( u.obtainable !== true ) return false
          if( parseInt(u.obtainableTime) !== 0 ) return false
          return true
      })
      let idList = units.reduce((ids,u) => {
          ids = ids.concat(u.limitBreakRef.filter(x=>x.abilityId.startsWith('ultimate')).map(s => s.abilityId))
          ids = ids.concat(u.uniqueAbilityRef.filter(x=>x.abilityId.startsWith('ultimate')).map(s => s.abilityId))
          return ids
      },[])
      units = null
      return idList
    }else{
      errObj.error++
      return
    }
  }catch(e){
    throw(e)
  }
}
