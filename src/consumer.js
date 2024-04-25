'use strict'
const log = require('logger')
const updateData = require('./updateData')
const { client } = require('./rabbitmq')
const POD_NAME = process.env.POD_NAME || 'data-sync'
let queName = '', consumer
if(process.env.WORKER_QUE_PREFIX) queName = `${process.env.WORKER_QUE_PREFIX}.`
queName += `data-sync.updateRequest`
const cmdProcessor = async(obj = {})=>{
  try{
    let status = await updateData(true)
  }catch(e){
    log.error(e)
  }
}
const processMsg = async(msg = {})=>{
  cmdProcessor(msg?.body)
  return
}
const createWorker = async()=>{
  try{
    if(consumer) await consumer.close()
    consumer = client.createConsumer({ concurrency: 1, qos: { prefetchCount: 1 }, queue: queName, queueOptions: { durable: true, arguments: { 'x-queue-type': 'quorum' } } }, processMsg)
    consumer.on('error', (err)=>{
      if(err?.code){
        log.error(err.code)
        log.error(err.message)
        return
      }
      log.error(err)
    })
    log.info(`rabbitmq consumer started on ${POD_NAME}`)
    return true
  }catch(e){
    throw(e)
  }
}
module.exports.start = async()=>{
  return await createWorker()
}
