'use strict'
const mongo = require('mongoclient')
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try{
    let summoner = await mongo.find('summonerList',{})
    if(summoner.length > 0){
      let sProgression = await ReadFile(`${baseDir}/data/files/statProgression.json`)
      let lang = await ReadFile(`${baseDir}/data/files/Loc_ENG_US.txt.json`)
      let units = await ReadFile(`${baseDir}/data/files/units.json`)
      if(sProgression && lang && units){
        for(let i in summoner){
          for(let j in summoner[i].tier){
            let summoned = units.find(u=>u.id == summoner[i].tier[j])
            if(summoned){
              let tempObj = {
                id: summoner[i].tier[j],
                nameKey: lang[summoned.nameKey] ? lang[summoned.nameKey] : 'Placeholder',
                combatType: summoned.combatType,
                primaryStat: summoned.primaryUnitStat,
                growthModifiers: {},
                gearLvl: {},
                scaler: {}
              }
              for(let k in summoned.summonStatTable){
                let statTableList = summoned.summonStatTable[k]
                tempObj.growthModifiers[statTableList.rarity] = {}
                let sProgTable = sProgression.find(s=>s.id === statTableList.statTable)
                for(let l in sProgTable.stat.stat){
                  tempObj.growthModifiers[statTableList.rarity][sProgTable.stat.stat[l].unitStatId] = +sProgTable.stat.stat[l].unscaledDecimalValue
                }
              }
              for(let m in summoned.unitTier){
                let tierList = summoned.unitTier[m]
                tempObj.gearLvl[tierList.tier] = {}
                for(let n in tierList.baseStat.stat){
                  let baseStatList = tierList.baseStat.stat[n]
                  tempObj.gearLvl[tierList.tier][baseStatList.unitStatId] = +baseStatList.unscaledDecimalValue
                }
              }
              for(let o in summoned.baseStat.stat){
                tempObj.scaler[summoned.baseStat.stat[o].unitStatId] = +summoned.baseStat.stat[o].scalar
              }
              //await redis.set('su-'+summoner[i].tier[j], tempObj)
              await mongo.rep('summonerData', {_id: summoner[i].tier[j]}, tempObj)
              //await sqlite.put('summonerData', summoner[i].tier[j], tempObj)
            }
          }
        }
        sProgression = null
        lang = null
        summoner = null
        units = null
        errObj.complete++
        return
      }else{
        summoner = null
        errObj.error++
        return
      }
    }else{
      errObj.complete++
      return
    }
  }catch(e){
    throw(e)
  }

}
