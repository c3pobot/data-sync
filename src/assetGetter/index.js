const log = require('logger');
const imagesToIgnore = require(`src/enums/imagestoignore.json`);
const saveImage = require('./saveImage');
const rabbitmq = require('src/rabbitmq')

const POD_NAME = process.env.POD_NAME || 'data-sync', SET_NAME = process.env.SET_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default'
let queName = `${NAME_SPACE}.worker.assets`, consumer


const checkAssetName = (img)=>{
  try{
    if(!img) return
    if(img.startsWith('icon_stat_')) return;
    return true
  }catch(e){
    throw(e);
  }
}
const checkImage = async(obj = {})=>{
  try{
    if(imagesToIgnore.filter(x=>x === obj.img).length > 0) return;
    let status = checkAssetName(obj.img)
    if(!status) return
    status = await saveImage(obj.assetVersion, obj.img, obj.dir)
    if(!status?.etag) return 1
    log.info(`saved ${obj.img} to ${obj.dir}...`)
  }catch(e){
    throw(e)
  }
}
const processMsg = async(msg = {})=>{
  try{
    if(!msg.body) return
    return await checkImage(msg.body)
  }catch(e){
    log.error(e)
    return 1
  }
}
const startConsumer = async()=>{
  try{
    if(!rabbitmq.ready){
      setTimeout(startConsumer, 5000)
      return
    }
    if(consumer) await consumer.close()
    consumer = rabbitmq.createConsumer({ consumerTag: POD_NAME, concurrency: 1, qos: { prefetchCount: 1 }, queue: queName, queueOptions: { durable: true, arguments: { 'x-queue-type': 'quorum', 'x-message-ttl': 600000 } } }, processMsg)
    consumer.on('error', (err)=>{
      log.info(err)
    })
    consumer.on('ready', ()=>{
      log.info(`${POD_NAME} asset consumer created...`)
    })
  }catch(e){
    log.error(e)
    setTimeout(startConsumer, 5000)
  }
}
startConsumer()
