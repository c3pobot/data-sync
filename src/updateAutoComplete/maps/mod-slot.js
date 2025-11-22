const mongo = require('mongoclient')
const enumSlots = { 2: 'Square', 3: 'Arrow', 4: 'Diamond', 5: 'Triangle', 6: 'Circle', 7: 'Cross' }
module.exports = async(gameVersion, localeVersion)=>{
  let modDef = (await mongo.find('configMaps', { _id: 'modDefMap' }))[0]?.data
  if(!modDef) return
  let autoComplete = [], modSlot = new Set()
  for(let i in modDef){
    if(!modDef[i].slotNameKey || !modDef[i].slot) continue
    if(modSlot.has(modDef[i].slot)) continue
    autoComplete.push({ name: modDef[i].slotNameKey, value: modDef[i].slot.toString() })
    modSlot.add(modDef[i].slot)
  }
  if(autoComplete.length > 0){
    await mongo.set('autoComplete', { _id: 'mod-slot' }, { include: true, data: autoComplete, gameVersion: gameVersion, localeVersion: localeVersion })
    await mongo.set('autoComplete', { _id: 'nameKeys' }, { include: false, 'data.mod-slot': 'mod-slot' })
    return true
  }
}
