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
      ids = ids.concat(u.skillReference.map(s => s.skillId))
      ids = ids.concat(u.crew.map(cu => cu.skillReference[0].skillId))
      return ids
  },[])
  return idList
}
