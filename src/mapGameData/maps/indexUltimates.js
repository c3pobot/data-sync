'use strict'
const getFile = require('src/helpers/getFile')
module.exports = async(gameVersion, localeVersion)=>{
  let units = await getFile(`units`, gameVersion)
  if(!units) return
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
  return idList
}
