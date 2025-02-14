'use strict'
const log = require('logger')
const client = require('./client')

let POD_NAME = process.env.POD_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default'
let DEFAULT_EXCHANGE = `${NAME_SPACE}.cmds`

let queues = [{ queue: 'worker.assets', arguments: { 'x-message-deduplication': true } }]
let exchanges = [{ exchange: DEFAULT_EXCHANGE, type: 'topic', maxAttempts: 5 }]

log.info(`${POD_NAME} topic exchange publisher created...`)
log.info(`${POD_NAME} queue publisher created...`)

let publisher = client.createPublisher({ exchanges: exchanges, queues: queues })
publisher.on('close', ()=>{
  log.info(`${POD_NAME} topic exchange publisher disconnected...`)
  log.info(`${POD_NAME} queue publisher disconnected...`)
})
module.exports = {
  get status(){
    return client?.ready
  }
}
module.exports.add = async(queName, payload)=>{
  try{
    if(!queName || !payload || !payload?.id || !client.ready) return
    await publisher.send ({ routingKey: queName, headers: { 'x-deduplication-header': payload.id } }, payload)
    return true
  }catch(e){
    if(e?.message?.includes('message rejected by server')) return true
    log.error(e)
  }
}
module.exports.notify = async( data, routingKey, exchange )=>{
  try{
    if(!data || !client.ready) return
    if(!exchange) exchange = DEFAULT_EXCHANGE
    await publisher.send({ exchange: exchange, routingKey: routingKey }, data)
    return true
  }catch(e){
    log.error(e)
  }
}
