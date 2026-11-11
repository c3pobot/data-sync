'use strict'
const eventTypeSet = new Set(['JOURNEY', 'LEGENDARY', 'EPIC', 'GALACTIC', 'MODS', 'PROGRESSION'])

function getEnemy(enemyUnitPreview = []){
    let res = {}
    for(let i of enemyUnitPreview){
        if(!i.baseEnemyItem.id) continue
        if(!res[i.baseEnemyItem.id]) res[i.baseEnemyItem.id] = { id: i.baseEnemyItem.id, count: 0}
        if(res[i.baseEnemyItem.id]) res[i.baseEnemyItem.id].count++
    }
    return Object.values(res || {})
}
function getCampaignNodeMission(campaignNodeMission = [], res = [], unitMap = {}, unitGuideList = [], campaignNodeId){
    let unitGuide = unitGuideList.find(x=>x?.campaignElementIdentifier?.campaignId == 'EVENTS' && x?.campaignElementIdentifier?.campaignNodeId == campaignNodeId)
    if(!unitGuide?.unitBaseId) return

    for(let i of campaignNodeMission){
       let pve_units = getEnemy(i.enemyUnitPreview)
       if(!pve_units || pve_units?.length == 0) continue
       
       res.push({ tier: i.id?.replace('TIER0', '')?.replace('DIFF0', ''), unitBaseId: unitGuide.unitBaseId, unitNameKey: unitMap[unitGuide.unitBaseId]?.nameKey || unitGuide.unitBaseId, pve_units })
    }
}
function getCampaignNode(campaignNodeDifficultyGroup = {}, res = [], unitMap = {}, unitGuideList = []){
    for(let i of campaignNodeDifficultyGroup.campaignNode) getCampaignNodeMission(i.campaignNodeMission, res, unitMap, unitGuideList, i.id)
}
function getCampaignNodeDifficultyGroup(campaignNodeDifficultyGroup = [], res = [], unitMap = {}, unitGuideList = []){
    for(let i of campaignNodeDifficultyGroup) getCampaignNode(i, res, unitMap, unitGuideList)
}

module.exports = (unitGuideList = [], campaignMap = [], unitMap = {}) => {
    let res = []
    for(let i of campaignMap){
        if(!eventTypeSet.has(i.id)) continue
        getCampaignNodeDifficultyGroup(i.campaignNodeDifficultyGroup, res, unitMap, unitGuideList)
    }
    return res
}