'use strict'
const ReadFile = require('./readFile')

const fileName = ['units', 'Loc_ENG_US.txt', 'category', 'unitGuideDefinition', 'requirement', 'challenge', 'campaign']
const MapFaction = async(faction = [], lang = {})=>{
  try{
    let res = {}
    await faction.forEach(f=>{
      if(f?.descKey && f.descKey !== 'PLACEHOLDER' && lang[f.descKey]){
        res[f.id] = {
          baseId: f.id,
          nameKey: lang[f.descKey],
          visible: f.visible,
          type: 'faction',
          units: []
        }
      }
    })
    return res
  }catch(e){
    console.error(e);
  }
}
const MapUnits = async(units = [], faction = {}, lang = {})=>{
  try{
    let res = {}
    await units.forEach(u=>{
      if( parseInt(u.rarity) !== 7 ) return
      if( u.obtainable !== true ) return
      if( parseInt(u.obtainableTime) !== 0 ) return
      if(u.baseId && u.nameKey && lang[u.nameKey]){
        res[u.baseId] = {
          baseId: u.baseId,
          nameKey: lang[u.nameKey],
          combatType: u.combatType,
          type: 'unit'
        }
        if(u?.categoryId?.filter(x=>x === 'role_capital').length > 0) res[u.baseId].capitalShip = true
        for(let f in u?.categoryId){
          if(faction[u.categoryId[f]]){
            if(u.categoryId[f]?.startsWith('selftag')){
              faction[u.categoryId[f]] = res[u.baseId]
            }else{
               faction[u.categoryId[f]]?.units.push(res[u.baseId])
            }
          }
        }
      }
    })
    return res
  }catch(e){
    console.error(e);
  }
}
const MapCampaign = async(campaign = [], units = {}, factions = {}, lang = {})=>{
  let res = {}
  let obj = campaign.find(x=>x.id === 'EVENTS')
  if(obj?.campaignMap){
    obj.campaignMap.forEach(map=>{
      if(!res[map.id]) res[map.id] = {}
      map?.campaignNodeDifficultyGroup?.forEach(node=>{
        node?.campaignNode?.forEach(c=>{
          if(!res[map.id][c.id]) res[map.id][c.id] = {id: c.id, node: {}}
          c.campaignNodeMission?.forEach(m=>{
            res[map.id][c.id].node[m.id] = {unit: {}, faction: {}, capitalShip: {}, unitCount: 0, rarity: 0, gp: 0, tier: 0, relic: 0 }
            if(m.entryCategoryAllowed?.minimumRequiredUnitQuantity > res[map.id][c.id].node[m.id].unitCount) res[map.id][c.id].node[m.id].unitCount = m.entryCategoryAllowed?.minimumRequiredUnitQuantity
            if(m.entryCategoryAllowed?.minimumUnitRarity > res[map.id][c.id].node[m.id].rarity) res[map.id][c.id].node[m.id].rarity = m.entryCategoryAllowed?.minimumUnitRarity
            if(m.entryCategoryAllowed?.minimumGalacticPower > res[map.id][c.id].node[m.id].gp) res[map.id][c.id].node[m.id].gp = m.entryCategoryAllowed?.minimumGalacticPower
            if(m.entryCategoryAllowed?.minimumUnitTier > res[map.id][c.id].node[m.id].tier) res[map.id][c.id].node[m.id].tier = m.entryCategoryAllowed?.minimumUnitTier
            if(m.entryCategoryAllowed?.minimumRelicTier > res[map.id][c.id].node[m.id].relic) res[map.id][c.id].node[m.id].relic = m.entryCategoryAllowed?.minimumRelicTier
            let totalUnits = m?.entryCategoryAllowed?.mandatoryRosterUnit?.length || 0
            totalUnits += m?.entryCategoryAllowed?.categoryId?.filter(x=>x?.startsWith('selftag_'))?.length || 0
            for(let i in m?.entryCategoryAllowed?.mandatoryRosterUnit){
              let baseId = m.entryCategoryAllowed.mandatoryRosterUnit[i]?.id, tempUnit, type = 'unit'
              if(baseId && units[baseId]) tempUnit = JSON.parse(JSON.stringify(units[baseId]))
              if(baseId && factions[baseId] && !tempUnit) tempUnit = JSON.parse(JSON.stringify(factions[baseId]))
              if(tempUnit && tempUnit.units){
                type = 'faction'
                tempUnit.units = tempUnit.units.filter(x=>x.combatType === m.combatType)
              }
              if(tempUnit){
                res[map.id][c.id].node[m.id][type][tempUnit.baseId] = tempUnit
                res[map.id][c.id].node[m.id][type][tempUnit.baseId].required = true
              }
            }
            for(let i in m?.entryCategoryAllowed?.categoryId){
              let baseId = m.entryCategoryAllowed.categoryId[i], tempUnit, tempFaction, type = 'unit'
              if(baseId && units[baseId]) tempUnit = JSON.parse(JSON.stringify(units[baseId]))
              if(baseId && factions[baseId] && !tempUnit) tempUnit = tempUnit = JSON.parse(JSON.stringify(factions[baseId]))
              if(tempUnit && tempUnit.units){
                type = 'faction'
                tempUnit.units = tempUnit.units.filter(x=>x.combatType === m.combatType)
                if(m.entryCategoryAllowed.commanderCategoryId?.length > 0) tempUnit.units = tempUnit.units.filter(x=>!x.capitalShip)
              }
              if(tempUnit && !res[map.id][c.id].node[m.id][type][tempUnit.baseId]){
                res[map.id][c.id].node[m.id][type][tempUnit.baseId] = tempUnit
                if(type === 'unit' && +totalUnits === +m.entryCategoryAllowed.minimumRequiredUnitQuantity){
                  res[map.id][c.id].node[m.id][type][tempUnit.baseId].required = true
                }
              }
            }
            for(let i in m?.entryCategoryAllowed?.commanderCategoryId){
              let baseId = m.entryCategoryAllowed.categoryId[i], tempUnit, tempFaction, type = 'unit'
              if(baseId && units[baseId]) tempUnit = JSON.parse(JSON.stringify(units[baseId]))
              if(baseId && factions[baseId] && !tempUnit) tempUnit = tempUnit = JSON.parse(JSON.stringify(factions[baseId]))
              if(tempUnit && tempUnit.units){
                type = 'capitalShip'
                tempUnit.units = tempUnit.units.filter(x=>x.combatType === m.combatType && x.capitalShip)
              }
              if(tempUnit && !res[map.id][c.id].node[m.id][type][tempUnit.baseId]){
                res[map.id][c.id].node[m.id][type][tempUnit.baseId] = tempUnit
                if(type === 'unit' && +totalUnits === +m.entryCategoryAllowed.minimumRequiredUnitQuantity){
                  res[map.id][c.id].node[m.id][type][tempUnit.baseId].required = true
                }
              }
            }
          })
        })
      })
    })
  }
  return res
}
module.exports = async(errObj = {})=>{
  try{
    console.log('updating journey guides')
    let files = {}, error = 0, events = {}
    for(let i in fileName){
      const tempFile = await ReadFile(baseDir+'/data/files/'+fileName[i]+'.json')
      if(tempFile){
        files[fileName[i]] = JSON.parse(JSON.stringify(tempFile))
      }else{
        error++
      }
    }
    if(!error){
      let campaign, units, faction, guideDef = files['unitGuideDefinition'], lang = files['Loc_ENG_US.txt']
      //let guideDef = files['unitGuideDefinition'].filter(x=>x.additionalActivationRequirementId)
      if(guideDef && lang) faction = await MapFaction(files['category'], files['Loc_ENG_US.txt'])
      if(faction) units = await MapUnits(files['units'], faction, files['Loc_ENG_US.txt'])
      if(units) campaign = await MapCampaign(files['campaign'], faction, units, files['Loc_ENG_US.txt'])
      if(campaign){
        for(let i in guideDef){

          let requirements = files['requirement']?.find(x=>x.id === guideDef[i].additionalActivationRequirementId)
          let tempUnit = units[guideDef[i].unitBaseId]
          let tempEvent = {
            baseId: guideDef[i].unitBaseId,
            unitNameKey: tempUnit?.nameKey,
            combatType: tempUnit?.combatType,
            nameKey: lang[guideDef[i].titleKey],
            requirementId: guideDef[i].additionalActivationRequirementId,
            galacticLegend: guideDef[i].galacticLegend,
            campaignId: guideDef[i].campaignElementIdentifier?.campaignId,
            campaignMapId: guideDef[i].campaignElementIdentifier?.campaignMapId,
            campaignNodeId: guideDef[i].campaignElementIdentifier?.campaignNodeId,
            requirement: {},
            tier: {}
          }
          if(requirements?.requirementItem?.length > 0){
            requirements.requirementItem.forEach(r=>{
              let requirement = files['challenge']?.find(x=>x.id === r.id)
              if(requirement?.task?.length > 0){
                requirement.task.forEach(t=>{
                  if(t.actionLinkDef?.link?.startsWith('UNIT_DETAILS?')){
                    let tier = t.descKey.split('_'), unit
                    let baseId = t.actionLinkDef.link.replace('UNIT_DETAILS?', '').replace('unit_meta=BASE_ID', '').replace('&','').replace('base_id=', '')
                    if(baseId) unit = files['units']?.find(x=>x.id.startsWith(baseId+':'))
                    if(baseId){
                      if(!tempEvent.requirement.unit){
                        tempEvent.requirement = { unit: {}, faction: {}, unitCount: 0, rarity: 0, gp: 0, tier: 0, relic: 0 }
                      }
                      tempEvent.requirement.unit[baseId] = JSON.parse(JSON.stringify(units[baseId]))
                      tempEvent.requirement.unit[baseId].required = true
                      if(t.descKey?.toUpperCase().includes('RELIC')) tempEvent.requirement.unit[baseId].relic = +tier[(tier.length - 1)]
                      if(t.descKey?.toUpperCase().includes('STAR')) tempEvent.requirement.unit[baseId].rarity = +tier[(tier.length - 1)]
                    }
                  }
                })
              }

            })
          }
          if(Object.values(tempEvent.requirement)?.length === 0 && campaign[guideDef[i].campaignElementIdentifier?.campaignMapId] && campaign[guideDef[i].campaignElementIdentifier?.campaignMapId][guideDef[i].campaignElementIdentifier?.campaignNodeId]){
            let tempCampaign = campaign[guideDef[i].campaignElementIdentifier?.campaignMapId][guideDef[i].campaignElementIdentifier?.campaignNodeId]
            for(let n in tempCampaign?.node){
              tempEvent.tier[n] = JSON.parse(JSON.stringify(tempCampaign?.node[n]))
              /*
              delete tempRequirement.unit
              delete tempRequirement.faction
              tempEvent.requirement = {...tempEvent.requirement,...tempRequirement}
              //for(let u in tempCampaign?.node[n].unit) events[guideDef[i].unitBaseId].requirement.unit[u] = tempCampaign?.node[n].unit[u]
              //for(let f in tempCampaign?.node[n].faction) events[guideDef[i].unitBaseId].requirement.faction[f] = tempCampaign?.node[n].faction[f]
              tempEvent.requirement.unit = {...tempEvent.requirement.unit,...tempCampaign?.node[n].unit}
              tempEvent.requirement.faction = {...tempEvent.requirement.faction,...tempCampaign?.node[n].faction}
              */
            }
          }
          /*
          let requiredUnits = tempEvent.requirement.unit ? Object.values(tempEvent.requirement.unit)?.filter(x=>x.required === true):[]
          if(tempEvent.campaignNodeId === 'CAMPAIGN_EVENT_JABBA_GALACTICLEGEND') console.log(requiredUnits)
          if(+requiredUnits?.length > tempEvent.requirement.unitCount) tempEvent.requirement.unitCount = +requiredUnits?.length
          if(tempEvent.requirement?.rarity > 7) tempEvent.requirement.rarity = 7
          */
          if(Object.values(tempEvent.requirement)?.length > 0 || Object.values(tempEvent.tier)?.length > 0) events[guideDef[i].unitBaseId] = tempEvent
        }
      }
    }
    if(Object.values(events)?.length > 0){
      let autoComplete = []
      for(let i in events){
        if(events[i]?.baseId){
          await mongo.set('journeyGuide', {_id: events[i].baseId}, events[i])
          autoComplete.push({name: events[i].unitNameKey || events[i].nameKey, value: events[i].baseId, descKey: events[i].nameKey })
        }
      }
      let manualGuides = (await mongo.find('botSettings', {_id: 'manualGuides'}))[0]
      if(manualGuides?.data?.length > 0) autoComplete = autoComplete.concat(manualGuides.data)
      if(autoComplete?.length > 0) await mongo.set('autoComplete', {_id: 'journey'}, {data: autoComplete, include: true})
      errObj.complete++
    }else{
      errObj.error++
      return
    }
  }catch(e){
    console.error(e);
    errObj.error++
  }
}
