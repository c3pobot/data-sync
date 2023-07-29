'use strict'
const fetch = require('node-fetch')
const parseResponse = async(res)=>{
  try{
    if(res?.status?.toString().startsWith(4)) throw('Fetch Error')
    if(!res?.status?.toString().startsWith('2')) return
    let body
    if(res.headers?.get('Content-Type')?.includes('application/json')) body = await res.json()
    if(res.headers?.get('Content-Type')?.includes('text/plain')) body = await res.text()
    if(res.headers?.get('Content-Disposition')?.includes('filename')){
      body = await res.arrayBuffer()
      body = Buffer.from(body)
    }
    return body
  }catch(e){
    throw(e)
  }
}
module.exports = async(uri, method = 'GET', body, headers)=>{
  try{
    let payload = { method: method, compress: true, timeout: 60000 }
    if(body) payload.body = JSON.stringify(body)
    if(headers) payload.headers = headers
    const res = await fetch(uri, payload)
    return await parseResponse(res)
  }catch(e){
    throw(e);
  }
}
