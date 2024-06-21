'use strict'
const mongo = require('mongoclient')
const log = require('logger')
const fs = require('fs')
const readline = require('readline');
const getFileNames = (dir)=>{
  return new Promise((resolve) => {
    fs.readdir(dir, async(err, filenames)=>{
      if(err) log.error(err)
      resolve(filenames)
    })
  })
}
const readFile = (file)=>{
  try{
    if(!file) return
    return fs.readFileSync(file)
  }catch(e){
    log.error(e)
  }
}
const processLineByLine = async(file) => {
  if(!file) return
  const fileStream = fs.createReadStream(file);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  let res = []
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if(line) res.push(line)
  }
  return res
}
const mapRaid = async(raidId, units = [])=>{
  if(!raidId) return
  let data = readFile(`${baseDir}/src/manual-raids/${raidId}/data.json`)
  if(!data) return
  data = JSON.parse(data)
  let raidDef = { id: `${raidId}_manual`, nameKey: data.nameKey }

  let journeyGuide = { baseId: raidDef.id, nameKey: raidDef.nameKey, unitNameKey: raidDef.nameKey }

  let raidUnits = await processLineByLine(`${baseDir}/src/manual-raids/${raidId}/units.txt`)
  if(!raidUnits || raidUnits?.length == 0) return
  let tempUnits = []
  for(let i in raidUnits){
    let tempUnit = units.find(x=>x.nameKey?.toLowerCase() == raidUnits[i]?.toLowerCase())
    if(!tempUnit?.baseId){
      log.info(`${raidUnits[i]} spelling wrong ???`)
      continue
    }
    tempUnits.push(tempUnit.baseId)
  }
  if(tempUnits?.length !== raidUnits?.length) return

  await mongo.set('raidDef', { _id: raidDef.id }, raidDef)

  let faction = { baseId: `${raidId}_manual`, units: tempUnits, raidId: raidDef.id, nameKey: raidDef.nameKey }
  await mongo.set('factions', { _id: faction.baseId }, faction)
  await mongo.set('raidFactions', { _id: faction.baseId }, faction)

  let tempFaction = { baseId: `${raidId}_manual`, rarity: data.unitRequirement?.rarity || 0,  tier: data.unitRequirement?.tier || 0, relic: data.unitRequirement?.relic || 0 }
  journeyGuide.faction = { [`${raidId}_manual`]: tempFaction }
  journeyGuide.requirement = { faction: journeyGuide.faction }
  await mongo.set('journeyGuide', { _id: raidDef.id }, journeyGuide)

  let guideFaction = { baseId: tempFaction.baseId, rarity: tempFaction.rarity, gp: 0, numUnits: 0 }
  if(tempFaction?.relic){
    guideFaction.gear = { nameKey: `R${tempFaction.relic}`, name: 'relic', value: tempFaction.relic + 2 }
  }else{
    if(tempFaction.tier) guideFaction.gear = { nameKey: `G${tempFaction.tier}`, name: 'gear', value: tempFaction.tier }
  }
  let guideTemplate = { baseId: raidDef.id, name: raidDef.nameKey, descKey: raidDef.nameKey, factions: [guideFaction], units: [], groups: []}
  await mongo.set('guideTemplates', { _id: guideTemplate.baseId }, guideTemplate)
}
module.exports = async(gameVerion, localeVersion)=>{
  let raids = await getFileNames(`${baseDir}/src/manual-raids`)
  if(!raids || raids?.length === 0) return true
  let units = await mongo.find('units', {}, { baseId: 1, nameKey: 1})
  if(!units || units?.length == 0) return

  for(let i in raids) await mapRaid(raids[i], units)
  await mongo.set('autoComplete', { _id: 'raid' }, { gameVersion: '1' })
  await mongo.set('autoComplete', { _id: 'faction' }, { gameVersion: '1' })
  await mongo.set('autoComplete', { _id: 'journey' }, { gameVersion: '1' })
  return true
}
