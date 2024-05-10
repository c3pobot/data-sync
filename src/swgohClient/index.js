'use strict'
const log = require('logger')
const fetch = require('./fetch')
const GAME_CLIENT_URL = process.env.GAME_CLIENT_URL || 'http://localhost:3000'
let retryCount = +process.env.CLIENT_RETRY_COUNT || 6
const GETRoutes = {'enums': 'enums'}

const requestWithRetry = async(uri, opts = {}, count = 0)=>{
  try{
    let res = await fetch(uri, opts)
    if(res?.error === 'FetchError' || res?.body?.code === 6 || (res?.status === 400 && res?.body?.message && res?.body?.code !== 4)){
      if(count < retryCount){
        count++
        return await requestWithRetry(uri, opts, count)
      }else{
        log.error(`tried request ${count} time(s) and errored with ${res.error} : ${res.message}`)
      }
    }
    return res
  }catch(e){
    throw(e)
  }
}
module.exports = async(uri, payload, identity = null)=>{
  try{
    let opts = { method: 'POST', timeout: 60000, compress: true, headers: { "Content-Type": "application/json" } }
    if(GETRoutes[uri]) opts.method = 'GET'
    if(payload || identity){
      opts.body = {}
      if(payload) opts.body.payload = payload
      if(identity) opts.body.identity = identity
      opts.body = JSON.stringify(opts.body)
    }
    let obj = await requestWithRetry(`${GAME_CLIENT_URL}/${uri}`, opts)
    if(obj?.body) return obj.body
    return await parseResponse(obj)
  }catch(e){
    log.error(uri)
    throw(e)
  }
}
