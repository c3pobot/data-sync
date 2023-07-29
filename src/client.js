'use strict'
const path = require('path')
const fetch = require('node-fetch')
const GAME_CLIENT_URL = process.env.GAME_CLIENT_URL || 'http://localhost:3000'
const GETRoutes = {'enums': 'enums'}
const parseResponse = async(res)=>{
  try{
    if(!res) return
    let body
    if (res.status?.toString().startsWith('5')) throw('Bad status code '+res.status)
    if (res.headers?.get('Content-Type')?.includes('application/json')){
      body = await res.json()
    }else{
      body = await res.text()
    }
    if(!body && res.status === 204) body = { status: 204 }
    return body
  }catch(e){
    console.error(e);
  }
}

module.exports = async(uri, payload, identity)=>{
  try{
    let headers = {"Content-Type": "application/json"}, method = 'POST'
    if(GETRoutes[uri]) method = 'GET'
    let opts = { method: method, timeout: 60000, compress: true, headers: headers }
    if(payload || identity){
      opts.body = {}
      if(payload) opts.body.payload = payload
      if(identity) opts.body.identity = identity
      opts.body = JSON.stringify(opts.body)
    }
    let obj = await fetch(path.join(GAME_CLIENT_URL, uri), opts)
    return await parseResponse(obj)
  }catch(e){
    console.error(e)
  }
}
