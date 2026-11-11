const campaignTypeSet = new Set([5,6,7,8,9])
function getEnemy(enemyUnitPreview = []){
    let res = {}
    for(let i of enemyUnitPreview){
        if(!i.baseEnemyItem.id) continue
        if(!res[i.baseEnemyItem.id]) res[i.baseEnemyItem.id] = { id: i.baseEnemyItem.id, count: 0}
        if(res[i.baseEnemyItem.id]) res[i.baseEnemyItem.id].count++
    }
    return Object.values(res || {})
}
function getCampaignNodeMission(campaignNodeMission = [], campaignInfo = {}, res = [], lang = {}, campaignNodeDifficulty){
    if(!campaignNodeDifficulty) return
    for(let i of campaignNodeMission){
       let nodeNameKey = lang[i.shortNameKey]?.replace('-', '')
       if(!nodeNameKey) continue
       let pve_units = getEnemy(i.enemyUnitPreview)
       if(!pve_units || pve_units?.length == 0) continue
       
       res.push({ campaignType: campaignInfo.campaignType, campaignNodeDifficulty, nameKey: campaignInfo.nameKey, nodeNameKey, pve_units })
    }
}
function getCampaignNode(campaignNodeDifficultyGroup = {}, campaignInfo = {}, res = [], lang = {}){
    for(let i of campaignNodeDifficultyGroup.campaignNode) getCampaignNodeMission(i.campaignNodeMission, campaignInfo, res, lang, campaignNodeDifficultyGroup.campaignNodeDifficulty)
}
function getCampaignNodeDifficultyGroup(campaignNodeDifficultyGroup = [], campaignInfo = {}, res = [], lang = {}){
    for(let i of campaignNodeDifficultyGroup) getCampaignNode(i, campaignInfo, res, lang)
}
function getCampaignMap(campaignMap = [], campaignInfo = {}, res = [], lang = {}){
    for(let i of campaignMap) getCampaignNodeDifficultyGroup(i.campaignNodeDifficultyGroup, campaignInfo, res, lang)
}
module.exports = (campaignList = [], lang = {})=>{
    let res = []
    for(let i of campaignList){
        if(!campaignTypeSet.has(i.campaignType)) continue
        getCampaignMap(i.campaignMap, { nameKey: lang[i.nameKey]?.replace(/\\n/g, ' ') || i.nameKey, campaignType: i.campaignType }, res, lang)
    }
    return res
}