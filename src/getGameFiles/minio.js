'use strict'
'use strict'
const Minio = require('minio')
const opts = {
  endPoint: process.env.DATA_S3_SCV_URL,
  accessKey: process.env.DATA_S3_ACCESSKEY,
  secretKey: process.env.DATA_S3_SECRETKEY
}
if(process.env.DATA_S3_PORT){
  opts.port = +process.env.DATA_S3_PORT
  opts.useSSL = false
}
const client = new Minio.Client(opts)
const getObject = (bucket, key)=>{
  return new Promise((resolve, reject)=>{
    try{
      let miniData
      client.getObject(bucket, key, (err, dataStream)=>{
        if(err) reject(err)
        dataStream.on('data', (chunk)=>{
          if(!miniData){
            miniData = chunk
          }else{
            miniData += chunk
          }
        })
        dataStream.on('end', ()=>{
          resolve(miniData)
        })
        dataStream.on('error', (err)=>{
          reject(err)
        })
      })
    }catch(e){
      reject(e)
    }
  })
}
const listBucket = (bucket, prefix)=>{
  return new Promise((resolve, reject)=>{
    try{
      let bucketList = []
      let dataStream = client.listObjectsV2(bucket, (prefix ? prefix:''), false)
      dataStream.on('data', (chunk)=>{
        bucketList.push(chunk)
      })
      dataStream.on('error', (err)=>{
        reject(err)
      })
      dataStream.on('end', ()=>{
        resolve(bucketList)
      })
    }catch(e){
      reject(e)
    }
  })
}
module.exports.put = async(bucket, path, fileName, data)=>{
  try{
    let metadata = { 'Content-Type': 'application/json' }
    let key = ''
    if(path) key += `${path}/`
    key += `${fileName}`
    let result = await client.putObject(bucket, key, JSON.stringify(data), metadata)
    return result
  }catch(e){
    throw(e)
  }
}
module.exports.get = async(bucket, path, fileName)=>{
  try{
    let key = ''
    if(path) key += `${path}/`
    key += `${fileName}`
    let result = await getObject(bucket, key)
    if(result) return JSON.parse(result)
  }catch(e){
    throw(e)
  }
}
module.exports.list = async(bucket, prefix)=>{
  try{
    let key
    if(prefix) key = `${prefix}/`
    return await listBucket(bucket, key)
  }catch(e){
    throw(e)
  }
}
