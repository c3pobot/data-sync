'use strict'
const ReadFile = require('./readFile')
module.exports = async(errObj)=>{
  try{
    console.log('Updating conquest def ...')
    const cqDef = await ReadFile(baseDir+'/data/files/conquestDefinition.json')
    if(cqDef && cqDef.length > 0){
      for(let x in cqDef){
        const res = cqDef[x]
        for(let i in res.conquestDifficulty){
          res.conquestDifficulty[i].stars = 0
          for(let s in res.conquestDifficulty[i].sector){
            res.conquestDifficulty[i].sector[s].missions = []
            res.conquestDifficulty[i].sector[s].stars = 0
            for(let n in res.conquestDifficulty[i].sector[s].node){
              if(res.conquestDifficulty[i].sector[s].node[n].type == 1 || res.conquestDifficulty[i].sector[s].node[n].type == 5){
                const tempName = res.conquestDifficulty[i].sector[s].node[n].id.slice(0, -1)
                if(res.conquestDifficulty[i].sector[s].missions.filter(x=>x == tempName).length == 0){
                  res.conquestDifficulty[i].sector[s].missions.push(tempName)
                  res.conquestDifficulty[i].sector[s].stars += 3
                  res.conquestDifficulty[i].stars += 3
                }
              }
            }
          }
        }
        mongo.set('cqDef', {_id: res.id}, res)
      }
      errObj.complete++
    }else{
      errObj.error++
    }
  }catch(e){
    throw(e)
  }
}
