'use strict'
const IDENTITY_SERVER_URL = 'http://identity-server.ahsoka.svc.cluster.local:3000'

async function identityServerRequest(allyCode, newIdentity){
  try{
    if(!allyCode) return
    let uri = `${IDENTITY_SERVER_URL}/identity/${allyCode}`
    if(newIdentity) uri += '/newIdentity'
    let r = await fetch(uri, { signal: AbortSignal.timeout(60000), compress: true })
    let res = await r?.json()
    if(!r?.ok){
      log.error(`[identity-server] ${url} error`)
      if(res) log.error(JSON.stringify(res))
    }
    return res
  }catch(e){
    log.error(e)
  }
}
module.exports = identityServerRequest
