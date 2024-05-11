'use strict'
const mongo = require('mongoclient')
const getFile = require('src/helpers/getFile')

const mapNode = (node = {}, conquestDifficulty = {}, sector = {})=>{
  if(node.type !== 1 && node.type !== 5) return
  let tempName = node.id.slice(0, -1)
  if(sector.missions.filter(x=>x == tempName).length > 0) return
  sector.missions.push(tempName)
  sector.stars += 3
  conquestDifficulty.stars += 3
}
const mapSector = (sector = {}, conquestDifficulty = {})=>{
  let i = sector.node.length
  sector.missions = [], sector.stars = 0
  while(i--) mapNode(sector.node[i], conquestDifficulty, sector)
}
const mapifficulty = (conquestDifficulty = {})=>{
  let i = conquestDifficulty.sector.length
  conquestDifficulty.stars = 0
  while(i--) mapSector(conquestDifficulty.sector[i], conquestDifficulty)
}
const mapDefinition = async(definition = {})=>{
  let i = definition.conquestDifficulty.length
  while(i--) mapifficulty(definition.conquestDifficulty[i])
  await mongo.set('cqDef', { _id: definition.id }, definition)
}
module.exports = async(gameVerion, localeVersion)=>{
  let conquestDefinitionList = await getFile('conquestDefinition', gameVerion)
  if(!conquestDefinitionList) return

  let i = conquestDefinitionList.length, array = []
  while(i--) array.push(mapDefinition(conquestDefinitionList[i]))
  await Promise.all(array)
  return true
}
