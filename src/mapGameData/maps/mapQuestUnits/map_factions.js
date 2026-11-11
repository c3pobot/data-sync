
'use strict'
const sorter = require('json-array-sorter')
const enumNode = { 5: 'Light Side', 6: 'Dark Side', 7: 'Mod', 8: 'Cantina', 9: 'Fleet' }
const enumType = { 4: 'Normal', 5: 'Hard' }
function checkEvent(jgEvent = {}, res = {}){
    let tiers = Object.values(jgEvent.tiers || {})
    if(!tiers || tiers?.length == 0) return
    for(let t of tiers){
        if(!res[t.count]) res[t.count] = { count: t.count }
        if(!res[t.count][jgEvent.baseId]) res[t.count][jgEvent.baseId] = { id: jgEvent.baseId, type: 'jg', nameKey: jgEvent.nameKey, nodes: new Set() }
        if(res[t.count][jgEvent.baseId]) res[t.count][jgEvent.baseId].nodes.add(t.id)
    }
}
function checkEvents(jgEvents = [], res = {}){
    if(!jgEvents || jgEvents?.length == 0) return
    for(let i of jgEvents) checkEvent(i, res)
}
function checkBattle(battles = [], nodeType, battleType, res = {}){
    for(let i of battles){
        let key = `${nodeType}-${battleType}`
        if(!res[i.count]) res[i.count] = { count: i.count }
        if(!res[i.count][key]) res[i.count][key] = { id: key, type: 'node', nameKey: `${enumNode[nodeType]} ${enumType[battleType]}`, nodes: new Set() }
        if(res[i.count][key]) res[i.count][key].nodes.add(i.name)
    }
}
function checkNode(node = {}, nodeType, res = {}){
    for(let i = 4; i < 6; i++) checkBattle(Object.values(node[i] || {}), nodeType, i, res)
}
function checkFaction(faction = {}){
    let res = {}
    for(let i = 5; i < 10;i++){
        checkNode(faction[i], i, res)
    }
    checkEvents(Object.values(faction.events), res)
    return { id: faction.id, nodes: Object.values(res) }
}
function combineBattles(factions = []){
    if(!factions || factions?.length == 0) return
    let tempRes = []
    for(let i of factions){
        let faction = checkFaction(i)
        if(faction) tempRes.push(faction)
    }
    let res = []
    for(let x of tempRes){
        let tempData = { id: x.id, nodes: [] }
        for(let n of x.nodes){
            let nodeData = { count: n.count, battles: [] }
            let array = Object.values(n)
            for(let y of array){
                if(!y.nodes || !y.nodes?.size) continue
                nodeData.battles.push({ id: y.id, type: y.type, nameKey: y.nameKey, nodes: ([...y.nodes]?.sort())})
            }
            tempData.nodes.push(nodeData)
        }
        tempData.nodes = sorter([{ column: 'count', order: 'descending' }], tempData.nodes)
        res.push(tempData)
    }
    return res
}
module.exports = (unit_battles = {}, faction_battles = [])=>{
   let res = {}
   for(let i of faction_battles){
        if(!res[i.id]) res[i.id] = { id: i.id, 5: { 4: {}, 5: {} }, 6: { 4: {}, 5: {} }, 7: { 4: {}, 5: {} }, 8: { 4: {}, 5: {} }, 9: { 4: {}, 5: {} }, events: {} }
        let array = [...new Set(i.units)]
        for(let u of array){
            let unit = unit_battles[u]
            if(!unit.baseId) continue
            for(let x = 5;x < 10;x++){
                if(!unit[x]) continue
                if(unit[x][4]){
                    for(let n of unit[x][4]){
                        if(!n.count) continue;
                        if(!res[i.id][x][4][n.name]) res[i.id][x][4][n.name] = { name: n.name, count: 0 }
                        if(res[i.id][x][4][n.name]) res[i.id][x][4][n.name].count += n.count
                    }
                }
                if(unit[x][5]){
                    for(let h of unit[x][5]){
                        if(!h.count) continue
                        if(!res[i.id][x][5][h.name]) res[i.id][x][5][h.name] = { name: h.name, count: 0 }
                        if(res[i.id][x][5][h.name]) res[i.id][x][5][h.name].count += h.count
                    }
                }
            }
            for(let e of Object.values(unit.events || {})){
                
                for(let t of e.tiers){
                    if(!t.count) continue;
                    if(!res[i.id].events[e.baseId]) res[i.id].events[e.baseId] = { baseId: e.baseId, nameKey: e.nameKey, tiers: {} }
                    if(!res[i.id].events[e.baseId].tiers[t.id]) res[i.id].events[e.baseId].tiers[t.id] = { id: t.id, count: 0 }
                    if(res[i.id].events[e.baseId].tiers[t.id]) res[i.id].events[e.baseId].tiers[t.id].count += t.count
                }
            }
        }
   }
   return combineBattles(Object.values(res))
}