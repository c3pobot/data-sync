'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')
const mapGuideTemplates = require('./mapGuideTemplates')

const mapFaction = (faction = [], lang = {})=>{
  let res = {}
  for(let i in faction){
    if(!faction[i].descKey || faction[i].descKey == 'PLACEHOLDER' || !lang[faction[i].descKey]) continue
    res[faction[i].id] = { baseId: faction[i].id, nameKey: lang[faction[i].descKey], visible: faction[i].visible, type: 'faction', units: [] }
  }
  return res
}

const mapUnits = (units = [], faction = {}, lang = {})=>{
  let res = {}
  for(let i in units){
    if(+units[i].rarity !== 7 || units[i].obtainable !== true || +units[i].obtainableTime !== 0) continue
    if(!units[i].baseId || !units[i].nameKey || !lang[units[i].nameKey]) continue
    res[units[i].baseId] = { baseId: units[i].baseId, nameKey: lang[units[i].nameKey], combatType: +units[i].combatType, type: 'unit', thumbnailName: units[i].thumbnailName }
    if(units[i].categoryId?.filter(x=>x === 'role_capital').length > 0) res[units[i].baseId].capitalShip = true
    let f = units[i].categoryId.length
    while(f--){
      if(!faction[units[i].categoryId[f]]) continue
      if(units[i].categoryId[f]?.startsWith('selftag')){
        faction[units[i].categoryId[f]] = res[u.baseId]
      }else{
        faction[units[i].categoryId[f]]?.units.push(res[u.baseId])
      }
    }
  }
  return res
}
const mapCampaign = (campaign = [], units = {}, factions = {}, lang = {})=>{
  let res = {}
  let obj = campaign.find(x=>x.id === 'EVENTS')
  if(!obj?.campaignMap) return res
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
  return res
}
const mapTask = (task = {}, dataList = {}, tempEvent = {})=>{
  if(!task.actionLinkDef?.link?.startsWith('UNIT_DETAILS?')) return
  let tier = task.descKey.split('_')
  let baseId = task.actionLinkDef.link.replace('UNIT_DETAILS?', '').replace('unit_meta=BASE_ID', '').replace('&','').replace('base_id=', '')
  if(!baseId) return
  if(!tempEvent.requirement.unit) tempEvent.requirement = { unit: {}, faction: {}, unitCount: 0, rarity: 0, gp: 0, tier: 0, relic: 0 }
  tempEvent.requirement.unit[baseId] = JSON.parse(JSON.stringify(dataList.units[baseId]))
  tempEvent.requirement.unit[baseId].required = true
  if(task.descKey?.toUpperCase().includes('RELIC')) tempEvent.requirement.unit[baseId].relic = +tier[(tier.length - 1)]
  if(task.descKey?.toUpperCase().includes('STAR')) tempEvent.requirement.unit[baseId].rarity = +tier[(tier.length - 1)]
}
const mapRequirementItem = (requirementItem = {}, dataList = {}, tempEvent = {})=>{
  let requirement = dataList.challengeList.find(x=>x.id === requirementItem.id)
  if(!requirement?.task || requirement?.task?.length == 0) return
  for(let i in requirement.task) mapTask(requirement.task[i], dataList, tempEvent)
}
const mapGuide = async(guideDef = {}, dataList = {}, autoComplete = [])=>{
  let requirements = dataList.requirementList.find(x=>x.id === guideDef.additionalActivationRequirementId)
  let tempUnit = dataList.units[guideDef.unitBaseId]
  let tempEvent = {
    baseId: guideDef.unitBaseId,
    unitNameKey: tempUnit?.nameKey,
    combatType: tempUnit?.combatType,
    nameKey: dataList.lang[guideDef.titleKey],
    requirementId: guideDef.additionalActivationRequirementId,
    galacticLegend: guideDef.galacticLegend,
    campaignId: guideDef.campaignElementIdentifier?.campaignId,
    campaignMapId: guideDef.campaignElementIdentifier?.campaignMapId,
    campaignNodeId: guideDef.campaignElementIdentifier?.campaignNodeId,
    requirement: {},
    tier: {}
  }
  if(requirements?.requirementItem?.length > 0){
    for(let i in requirements.requirementItem) mapRequirementItem(requirements.requirementItem[i], dataList, tempEvent)
  }
  if(Object.values(tempEvent.requirement)?.length === 0 && dataList.campaign[tempEvent.campaignMapId] && dataList.campaign[tempEvent.campaignMapId][tempEvent.campaignNodeId]){
    let tempCampaign = dataList.campaign[tempEvent.campaignMapId][tempEvent.campaignNodeId]
    for(let n in tempCampaign?.node) tempEvent.tier[n] = JSON.parse(JSON.stringify(tempCampaign?.node[n]))
  }
  if(Object.values(tempEvent.requirement)?.length > 0 || Object.values(tempEvent.tier)?.length > 0){
    autoComplete.push({name: tempEvent.unitNameKey || tempEvent.nameKey, value: tempEvent.baseId, descKey: tempEvent.nameKey })
    await mongo.set('journeyGuide', { _id: tempEvent.baseId }, tempEvent)
    await mapGuideTemplates(tempEvent)
  }
}
module.exports = async(gameVersion, localeVersion)=>{
  let [ unitList, lang, factionList, guideDefList, requirementList, challengeList, campaignList ] = await Promise.all([
    getFile('units', gameVersion),
    getFile('Loc_ENG_US.txt', localeVersion),
    getFile('category', gameVersion),
    getFile('unitGuideDefinition', gameVersion),
    getFile('requirement', gameVersion),
    getFile('challenge', gameVersion),
    getFile('campaign', gameVersion)
  ])
  if(!unitList || !lang || !factionList || !guideDefList, || !requirementList || !challengeList || campaignList) return

  let campaign, units
  //let guideDef = files['unitGuideDefinition'].filter(x=>x.additionalActivationRequirementId)
  let faction = mapFaction(factionList, lang)
  if(faction) units = mapUnits(unitList, faction, lang)
  if(units) campaign = mapCampaign(campaignList, faction, units, lang)
  if(!faction || !campaign || !units ) return

  let i = guideDefList.length, array = [], autoComplete = [], dataList = { units: units, faction: faction, campaign: campaign, lang: lang, requirementList: requirementList, challengeList: challengeList }
  while(i--) array.push(mapGuide(guideDefList[i], dataList, autoComplete))
  await Promise.all(array)
  let manualGuides = (await mongo.find('botSettings', { _id: 'manualGuides'}))[0]
  if(manualGuides?.data?.length > 0) autoComplete = autoComplete.concat(manualGuides.data)
  if(autoComplete?.length > 0) await mongo.set('autoComplete', {_id: 'journey'}, { data: autoComplete, include: true })
  await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.journey': 'journey' })
  return true
}
