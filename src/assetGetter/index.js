const log = require('logger');
const imagestoignore = require(`src/enums/imagestoignore.json`);
const saveImage = require('./saveImage');
const rabbitmq = require('src/helpers/rabbitmq')

let POD_NAME = process.env.POD_NAME || 'data-sync', SET_NAME = process.env.SET_NAME || 'data-sync', NAME_SPACE = process.env.NAME_SPACE || 'default', QUE_NAME = process.env.WORKER_QUE_NAME_SPACE || process.env.NAME_SPACE || 'default'
QUE_NAME += '.worker.assets'
let consumer, imagesToIgnore = new Set(imagestoignore)


const checkAssetName = (img)=>{
  if(!img) return
  if(img.startsWith('icon_stat_')) return;
  return true
}
const checkImage = async(obj = {})=>{
  if(!obj.img) return
  if(imagesToIgnore?.has(obj.img)) return;
  if(obj.img.startsWith('icon_stat_')) return
  let status = await saveImage(obj.assetVersion, obj.img, obj.dir, obj.base64Img)
  if(!status) return 1
  log.debug(`saved ${obj.img} to ${obj.dir}...`)
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
const start = async()=>{
  try{
    if(!rabbitmq.ready){
      setTimeout(start, 5000)
      return
    }
    if(consumer) await consumer.close()
    consumer = rabbitmq.createConsumer({ consumerTag: POD_NAME, concurrency: 1, qos: { prefetchCount: 1 }, queue: QUE_NAME, queueOptions: { durable: true, arguments: { 'x-queue-type': 'quorum', 'x-message-ttl': 600000 } } }, processMsg)
    consumer.on('error', (err)=>{
      log.info(err)
    })
    consumer.on('ready', ()=>{
      log.info(`${POD_NAME} asset consumer created...`)
    })
  }catch(e){
    log.error(e)
    setTimeout(start, 5000)
  }
}
start()
