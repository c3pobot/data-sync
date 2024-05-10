'use strict'
const fetch = require('node-fetch')
const parseResponse = async(res)=>{
  if(!res) return
  let body
  if (res.headers?.get('Content-Type')?.includes('application/json')) body = await res?.json()
  if(!body && res?.status < 300) body = res.body
  if(body) return body
  if(res.status >= 400) return { status: res.status, message: res.statusText }
}
module.exports = async(uri, method = 'GET', body, headers)=>{
  let req = { method: method, timeout: 60000, compress: true, headers: {'Content-Type': 'application/json'}}
  if(headers) req.headers = {...req.headers,...headers}
  if(body) req.body = body
  let obj = await fetch(uri, req)
  return await parseResponse(obj)
}
