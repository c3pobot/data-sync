'use strict'
const log = require('logger')
const fs = require('fs')
const mongo = require('mongoclient')
const dataList = [
  'statDefMap',
  'modDefMap',
  'unitDefMap'
]
const ReadFile = (file)=>{
  try{
    let obj = fs.readFileSync(file)
    if(obj) return JSON.parse(obj)
  }catch(e){
    log.error('error reading '+file)
  }
};

module.exports = async(gameVersion)=>{
  try{
    log.info('Creating Gamedata.json...')
    let obj = await ReadFile(baseDir+'/data/files/gameData.json')
    if(!obj?.data || obj?.version !== gameVersion) return
    let newGameData = obj.data, count = 0, totalCount = 0
    for(let i in dataList){
      count++
      let map = (await mongo.find('configMaps', {_id: dataList[i]}))[0]
      if(map?.gameVersion === gameVersion && map?.data){
        log.info('added '+dataList[i]+' to gameData.json...')
        newGameData[dataList[i]] = map.data;
        totalCount++
      }else{
        throw(dataList[i]+' update error...')
      }
    }
    let modData = await getModData()
    if(!modData?.modSetData || !modData?.modDefData) return
    let unitData = await getUnitData()
    if(!unitData) return
    newGameData.unitData = unitData
    newGameData.modDefData = modData.modDefData
    newGameData.modSetData = modData.modSetData
    if(totalCount === count){
      await mongo.set('botSettings', {_id: 'gameData'}, {data: newGameData, version: gameVersion})
      log.info(`gameData.json updated to ${gameVersion}`)
      return true
    }
  }catch(e){
    throw(e)
  }
}

const getModData = async()=>{
  try{
    let res = {modSetData: {}, modDefData: {}}
    let tempModData = await ReadFile(baseDir+'/data/files/statModSet.json')
    tempModData = tempModData?.data
    if(!tempModData) return
    tempModData.forEach( set =>{
      res.modSetData[set.id] = {
        id: set.completeBonus.stat.unitStatId,
        count: set.setCount,
        value: +set.completeBonus.stat.unscaledDecimalValue
      }
    })
    let tempModStat = await ReadFile(baseDir+'/data/files/statMod.json')
    tempModStat = tempModStat?.data
    if(!tempModStat) return
    tempModStat.forEach(mod=>{
      res.modDefData[mod.id] = {
        rarity: mod.rarity,
        slot: +mod.slot,
        setId: +mod.setId
      }
    })
    return res
  }catch(e){
    throw(e)
  }
}
const GetStatProgression = async()=>{
  let tempStatProgress = await ReadFile(baseDir+'/data/files/statProgression.json')
  tempStatProgress = tempStatProgress?.data
  if(tempStatProgress){
    let data = {}
    await tempStatProgress.forEach(table=>{
      if( /^stattable_/.test(table.id) ){
        const tableData = {}
        table.stat.stat.forEach(stat=>{
          tableData[stat.unitStatId] = +stat.unscaledDecimalValue
        })
        data[table.id] = tableData
      }
    })
    tempStatProgress = null
    return data
  }else{
    throw('Error getting statProgression...')
  }
}
const GetAlignment = (categoryId = [])=>{
  try{
    let alignment = categoryId.filter(x=>x === 'alignment_light' || x === 'alignment_dark' || x === 'alignment_neutral')
    if(alignment?.length > 0) return alignment[0]
  }catch(e){
    throw(e);
  }
}
const GetMasteryMultiplierName = (primaryStatID, tags)=>{
  let primaryStats = {
    2: "strength",
    3: "agility",
    4: "intelligence"
  };
  let [role] = tags.filter( tag => /^role_(?!leader)[^_]+/.test(tag)); // select 'role' tag that isn't role_leader
  return `${primaryStats[ primaryStatID ]}_${role}_mastery`;
}
const getUnitData = async()=>{
  try{
    let tempProgress = await GetStatProgression()
    if(!tempProgress) return
    let tempSkill = await ReadFile(baseDir+'/data/files/skill.json')
    let tempUnits = await ReadFile(baseDir+'/data/files/units.json')
    let recipeList = await ReadFile(baseDir+'/data/files/recipe.json')
    tempSkill = tempSkill?.data
    tempUnits = tempUnits?.data
    recipeList = recipeList?.data
    if(tempProgress && tempSkill && tempUnits){
      let skills = {}
      tempSkill.forEach(skill=>{
        let s = {
          id: skill.id,
          maxTier: skill.tier.length + 1,
          powerOverrideTags: {},
          isZeta: skill.tier.slice(-1)[0].powerOverrideTag == "zeta",
          omicronMode: skill.omicronMode
        };
        for(let i in skill.tier){
          if (skill.tier[i]?.powerOverrideTag) s.powerOverrideTags[ +i + 2 ] = skill.tier[i].powerOverrideTag;
          if(!(s.zetaTier >= 0) && skill.tier[i]?.isZetaTier) s.zetaTier = +i + 2;
          if(!(s.omiTier >= 0) && skill.tier[i]?.isOmicronTier) s.omiTier = +i + 2;
        }
        skills[ skill.id ] = s
      })
      let unitGMTables = {}
      tempUnits.forEach(unit=>{
        unitGMTables[unit.baseId] = unitGMTables[unit.baseId] || {}
        unitGMTables[unit.baseId][unit.rarity] = tempProgress[unit.statProgressionId]
      })
      let data = {}
      tempUnits.forEach(unit=>{
        if(unit.rarity > 0 && unit.obtainable && unit.obtainableTime == 0){
          if(unit.combatType == 1){
            const tierData = {}
            const relicData = {}
            unit.unitTier.forEach(gearTier=>{
              tierData[gearTier.tier] = {gear:gearTier.equipmentSet, stats:{}}
              gearTier.baseStat.stat.forEach(stat=>{
                tierData[gearTier.tier].stats[stat.unitStatId] = +stat.unscaledDecimalValue
              })
            })
            unit.relicDefinition.relicTierDefinitionId.forEach(tier=>{
              relicData[+tier.slice(-2) + 2] = tier
            })
            data[unit.baseId] = {
              combatType: 1,
              primaryStat: unit.primaryUnitStat,
              gearLvl: tierData,
              growthModifiers: unitGMTables[ unit.baseId ],
              skills: unit.skillReference.map( skill => skills[ skill.skillId ] ),
              relic: relicData,
              alignment: GetAlignment(unit.categoryId),
              masteryModifierID: GetMasteryMultiplierName(unit.primaryUnitStat, unit.categoryId)
            }
          }else{
            const stats = {}
            unit.baseStat.stat.forEach(stat=>{
              stats[stat.unitStatId] = +stat.unscaledDecimalValue
            })
            const ship = {
              combatType: 2,
              primaryStat: unit.primaryUnitStat,
              stats: stats,
              growthModifiers: unitGMTables[ unit.baseId ],
              skills: unit.skillReference.map( skill => skills[ skill.skillId ] ),
              crewStats: tempProgress[ unit.crewContributionTableId ],
              crew: []
            }
            unit.crew.forEach(crew=>{
              ship.crew.push(crew.unitId)
              crew.skillReference.forEach(s=>ship.skills.push(skills[s.skillId]))
            })
            data[unit.baseId] = ship
          }
        }
      })
      return data
    }else{
      throw('Error creating UnitData...')
    }

  }catch(e){
    throw(e)
  }
}
