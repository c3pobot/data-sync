'use strict'
const sorter = require('json-array-sorter')
const enumNode = { 5: 'Light Side', 6: 'Dark Side', 7: 'Mod', 8: 'Cantina', 9: 'Fleet' }
const enumType = { 4: 'Normal', 5: 'Hard' }

function checkUnit(unit = {}){
    let res = { id: unit.baseId, nameKey: unit.nameKey, battles: {} }
    for(let x = 5; x < 10; x++){
        if(!unit[x]) continue
        for(let y = 4; y < 6;y++){
            if(!unit[x][y]) continue
            for(let i of unit[x][y]){
                let key = `${x}-${y}`
                if(!res.battles[key]) res.battles[key] = { id: key, type: 'node', nameKey: `${enumNode[x]} ${enumType[y]}`, nodes: new Set() }
                if(res.battles[key]) res.battles[key].nodes.add(i.name)
            }
            
        }
    }
    for(let i of Object.values(unit.events) || {}){
        if(!i.tiers || i.tiers?.length == 0) continue
        for(let t of i.tiers){
            if(!res.battles[i.baseId]) res.battles[i.baseId] = { id: i.baseId, type: 'jg', nameKey: i.nameKey, nodes: new Set() }
            if(res.battles[i.baseId]) res.battles[i.baseId].nodes.add(t.id)
        }
    }
    return res
}

module.exports = (battles = []) =>{

    if(!battles || battles?.length == 0) return
    let tempRes = []
    for(let i of battles){
        let unit = checkUnit(i)
        if(unit) tempRes.push(unit)
    }
    
    let res = []
    for(let i of tempRes){
        let unit = { id: i.id, nameKey: i.nameKey, nodes: [] }
        for(let x of Object.values(i.battles || {})){
           if(!x?.nodes?.size) continue
           unit.nodes.push({ id: x.id, type: x.type, nameKey: x.nameKey, battles: ([...x.nodes]?.sort())})
        }
        res.push(unit)
    }
    return res
}