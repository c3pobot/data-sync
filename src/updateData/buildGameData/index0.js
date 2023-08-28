'use strict'
const { gameData } = require('./gameData')
const fs = require('fs')
const enumStats = require('./enumStats')
const ReadFile = (file)=>{
  try{
    let obj = fs.readFileSync(file)
    if(obj) obj = JSON.parse(obj)
    return obj?.data
  }catch(e){
    console.log('error reading '+file)
  }
};
let newGameData = {}, errored = false
const GetMasteryMultiplierName = (primaryStatID, tags)=>{
  let primaryStats = {
    2: "strength",
    3: "agility",
    4: "intelligence"
  };
  let [role] = tags.filter( tag => /^role_(?!leader)[^_]+/.test(tag)); // select 'role' tag that isn't role_leader
  return `${primaryStats[ primaryStatID ]}_${role}_mastery`;
}
const GetStatProgression = async()=>{
  let tempStatProgress = await ReadFile(baseDir+'/data/files/statProgression.json')
  if(tempStatProgress){
    const data = {}
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
    SetErrorFlag()
    return
  }
}
const SetErrorFlag = (e)=>{
  if(e){
    console.log(e.stack);
  }
  errored = true
}
const GetAlignment = (categoryId = [])=>{
  try{
    let alignment = categoryId.filter(x=>x === 'alignment_light' || x === 'alignment_dark' || x === 'alignment_neutral')
    if(alignment?.length > 0) return alignment[0]
  }catch(e){
    console.error(e);
  }
}
module.exports = async(version)=>{
  try{
    console.log('Creating Gamedata.json...')
    newGameData = {}
    await loadGearData()
    await loadModSetData()
    await loadTableData()
    await loadRelicData()
    await loadUnitData()
    if(!errored){
      console.log('saving new data to redis...')
      await mongo.set('botSettings', {_id: 'gameData'}, { version: version, data: newGameData })
      return true
    }
  }catch(e){
    console.error(e)
  }
}

const loadGearData = async()=>{
  let tempGearData = await ReadFile(baseDir+'/data/files/equipment.json')
  if(tempGearData){
    let data = {}
    tempGearData.forEach(gear =>{
      const statList = gear.equipmentStat.stat
      if(statList.length > 0){
        data[gear.id] = { stats: {} }
        statList.forEach( stat=> {
          data[gear.id].stats[stat.unitStatId] = +stat.unscaledDecimalValue
        })
      }
    })
    newGameData.gearData = data
    tempGearData = null
    data = null
    return
  }else{
    SetErrorFlag()
    return
  }
}
const loadModSetData = async()=>{
  let tempModData = await ReadFile(baseDir+'/data/files/statModSet.json')
  if(tempModData){
    let data = {}
    tempModData.forEach( set =>{
      data[set.id] = {
        id: set.completeBonus.stat.unitStatId,
        count: set.setCount,
        value: +set.completeBonus.stat.unscaledDecimalValue
      }
    })

    newGameData.modSetData = data
    tempModData = null
    data = null
    let tempModStat = await ReadFile(baseDir+'/data/files/statMod.json')
    if(tempModStat){
      let tempData = {}
      tempModStat.forEach(mod=>{
        tempData[mod.id] = {
          rarity: mod.rarity,
          slot: +mod.slot,
          setId: +mod.setId
        }
      })
      newGameData.modDefData = tempData
      tempModStat = null
      tempData = null
      return
    }else{
      SetErrorFlag()
      return
    }
  }else{
    SetErrorFlag()
    return
  }
}
const loadTableData = async()=>{
  let tempTables = await ReadFile(baseDir+'/data/files/table.json')
  let tempXp = await ReadFile(baseDir+'/data/files/xpTable.json')
  if(tempTables && tempXp){
    let data = {cr:{}, gp: {}}
    tempTables.forEach(table=>{
      let c, g
      switch( table.id ) {
        case "galactic_power_modifier_per_ship_crew_size_table":
          data.gp.crewSizeFactor = {}
          table.row.forEach( row => {
            data.gp.crewSizeFactor[ row.key ] = +row.value;
          });
          break;
        case "crew_rating_per_unit_rarity":
          data.cr.crewRarityCR = {};
          table.row.forEach( row => {
            data.cr.crewRarityCR[ enumStats.rarity[row.key] ] = +row.value;
          });
          data.gp.unitRarityGP = data.cr.crewRarityCR; // used for both CR and GP
          break;
        case "crew_rating_per_gear_piece_at_tier":
          data.cr.gearPieceCR = {};
          table.row.forEach( row => {
            data.cr.gearPieceCR[ row.key.match(/TIER_0?(\d+)/)[1] ] = +row.value;
          });
          break;
        case "galactic_power_per_complete_gear_tier_table":
          data.gp.gearLevelGP = { 1: 0 }; // initialize with value of 0 for unit's at gear 1 (which have none 'complete')
          table.row.forEach( row => {
            // 'complete gear tier' is one less than current gear level, so increment key by one
            data.gp.gearLevelGP[ ++(row.key.match(/TIER_0?(\d+)/)[1]) ] = +row.value;
          });
          data.cr.gearLevelCR = data.gp.gearLevelGP; // used for both GP and CR
          break;
        case "galactic_power_per_tier_slot_table":
          g = data.gp.gearPieceGP = {};
          table.row.forEach( row => {
            let [ tier, slot ] = row.key.split(":");
            g[ tier ] = g[ tier ] || {}; // ensure table exists for this gear level
            g[ tier ][ --slot ] = +row.value; // decrement slot by 1 as .help uses 0-based indexing for slot (game table is 1-based)
          });
          break;
        case "crew_contribution_multiplier_per_rarity":
          data.cr.shipRarityFactor = {};
          table.row.forEach( row => {
            data.cr.shipRarityFactor[ enumStats.rarity[row.key] ] = +row.value;
          });
          data.gp.shipRarityFactor = data.cr.shipRarityFactor; // used for both CR and GP
          break;
        case "galactic_power_per_tagged_ability_level_table":
          g = data.gp.abilitySpecialGP = {};
          table.row.forEach( row => {
            g[ row.key ] = +row.value;
          });
          break;
        case "crew_rating_per_mod_rarity_level_tier":
          c = data.cr.modRarityLevelCR = {};
          g = data.gp.modRarityLevelTierGP = {};
          table.row.forEach( row => {
            if ( row.key.slice(-1) == "0") { // only 'select' set 0, as set doesn't affect CR or GP
              let [ pips, level, tier, set ] = row.key.split(":");
              if ( +tier == 1) { // tier doesn't affect CR, so only save for tier 1
                c[ pips ] = c[ pips ] || {}; // ensure table exists for that rarity
                c[ pips ][ level ] = +row.value;
              }
              g[ pips ] = g[ pips ] || {}; // ensure rarity table exists
              g[ pips ][ level ] = g[ pips ][ level ] || {}; // ensure level table exists
              g[ pips ][ level ][ tier ] = +row.value;
            }
          });
          break;
        case "crew_rating_modifier_per_relic_tier":
          data.cr.relicTierLevelFactor = {};
          table.row.forEach( row => {
            data.cr.relicTierLevelFactor[ +row.key + 2 ] = +row.value; // relic tier enum is relic level + 2
          });
          break;
        case "crew_rating_per_relic_tier":
          data.cr.relicTierCR = {};
          table.row.forEach( row => {
            data.cr.relicTierCR[ +row.key + 2 ] = +row.value;
          });
          break;
        case "galactic_power_modifier_per_relic_tier":
          data.gp.relicTierLevelFactor = {};
          table.row.forEach( row => {
            data.gp.relicTierLevelFactor[ +row.key + 2 ] = +row.value; // relic tier enum is relic level + 2
          });
          break;
        case "galactic_power_per_relic_tier":
          data.gp.relicTierGP = {};
          table.row.forEach( row => {
            data.gp.relicTierGP[ +row.key + 2 ] = +row.value;
          });
          break;
        case "crew_rating_modifier_per_ability_crewless_ships":
          data.cr.crewlessAbilityFactor = {};
          table.row.forEach( row => {
            data.cr.crewlessAbilityFactor[ row.key ] = +row.value;
          });
          break;
        case "galactic_power_modifier_per_ability_crewless_ships":
          data.gp.crewlessAbilityFactor = {};
          table.row.forEach( row => {
            data.gp.crewlessAbilityFactor[ row.key ] = +row.value;
          });
          break;
        case (table.id.match(/_mastery/) || {}).input: // id matches itself only if it ends in _mastery
          // These are not actually CR or GP tables, but were placed in the 'crTables' section of gameData when first implemented.
          // Still placed there for backwards compatibility
          data.cr[ table.id ] = {};
          table.row.forEach( row => {
            data.cr[ table.id ][ enumStats.stats[row.key] ] = +row.value;
          });
          break;
        default:
          return;
      }
    })
    tempXp.forEach( table => {
      let tempTable = {};
      if ( /^crew_rating/.test(table.id) || /^galactic_power/.test(table.id) ) {
        table.row.forEach( row => {
          tempTable[ ++row.index ] = row.xp;
        });
        switch ( table.id ) {
          // 'CR' tables appear to be for both CR and GP on characters
          // 'GP' tables specify ships, but are currently idendical to the 'CR' tables.
          case "crew_rating_per_unit_level":
            data.cr.unitLevelCR = tempTable;
            data.gp.unitLevelGP = tempTable;
            break;
          case "crew_rating_per_ability_level":
            data.cr.abilityLevelCR = tempTable;
            data.gp.abilityLevelGP = tempTable;
            break;
          case "galactic_power_per_ship_level_table":
            data.gp.shipLevelGP = tempTable;
            break;
          case "galactic_power_per_ship_ability_level_table":
            data.gp.shipAbilityLevelGP = tempTable;
            break;
          default:
            return;
        }
      }
    });
    newGameData.crTables = data.cr
    newGameData.gpTables = data.gp
    tempTables = null;
    tempXp = null;
    data = null
    return
  }else{
    SetErrorFlag()
    return
  }
}
const loadRelicData = async()=>{
  let tempRelicData = await ReadFile(baseDir+'/data/files/relicTierDefinition.json')
  let tempProgress = await GetStatProgression()
  if(tempRelicData && tempProgress){
    let data = {}
    tempRelicData.forEach(relic=>{
      data[relic.id] = {stats:{}, gms:tempProgress[relic.relicStatTable]}
      relic.stat.stat.forEach(stat=>{
        data[relic.id].stats[stat.unitStatId] = +stat.unscaledDecimalValue
      })
    })
    newGameData.relicData = data
    tempRelicData = null
    tempProgress = null
    data = null
    return
  }else{
    SetErrorFlag()
    return
  }
}
const loadUnitData = async()=>{
  try{
    let tempProgress = await GetStatProgression()
    let tempSkill = await ReadFile(baseDir+'/data/files/skill.json')
    let tempUnits = await ReadFile(baseDir+'/data/files/units.json')
    let recipeList = await ReadFile(baseDir+'/data/files/recipe.json')
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
      newGameData.unitData = data
      tempProgress = null
      tempSkill = null
      recipeList = null
      tempUnits = null
      skills = null
      unitGMTables = null
      data = null
      return
    }else{
      SetErrorFlag()
      return
    }

  }catch(e){
    SetErrorFlag(e)
  }
}
