'use strict'
const log = require('logger')
const rabbitmq = require('./rabbitmq')
let publisher, publisherReady
let POD_NAME = process.env.POD_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default'
let EXCHANGE_NAME = process.env.GAME_DATA_EXCHANGE || `data-sync`
const createPublisher = async()=>{
  try{
    if(!rabbitmq.ready){
      setTimeout(createPublisher, 5000)
      return
    }
    publisher = rabbitmq.createPublisher({ confirm: true, exchanges: [{ exchange: EXCHANGE_NAME, type: 'topic', durable: true, maxAttempts: 5 }]})
    publisherReady = true
    log.info(`${POD_NAME} game-data publisher is ready...`)
    return
  }catch(e){
    log.error(e)
    setTimeout(createPublisher, 5000)
  }
}
createPublisher()
module.exports.status = ()=>{
  return publisherReady
}
module.exports.send = async(routingKey, data = {})=>{
  if(!routingKey || !data || !publisherReady) return
  await publisher.send({ exchange: EXCHANGE_NAME, routingKey: routingKey }, data)
  return true
}
