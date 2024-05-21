const log = require('logger')
const fetch = require('./fetch')
const shell = require('shelljs')
const base64ToJson = (str)=>{
  if(!str) return
  let json = Buffer.from(str, 'base64').toString()
  if(json) return JSON.parse(json)
}
const get = async({ repo, fileName, token })=>{
  if(!repo || !fileName) return
  let uri = `https://api.github.com/repos/${repo}/contents/${fileName}`, headers
  if(token) headers = { 'Authorization': `Bearer ${token}` }
  return await fetch(uri, 'GET', null, headers)
}
const getSha = async(opt = {})=>{
  if(!opt.repo || !opt.fileName) return
  let file = await get(opt)
  return file?.sha
}
const pushFile = async({ repo, fileName, token, data, user, email, commitMsg, sha })=>{

  if(!repo || !fileName || !token || !data || !email || !user) return
  let rateLimit = await checkRateLimit(token)

  if(!rateLimit) return
  let body = { committer: { name: user, email: email }, message: commitMsg?.toString() || 'update', content: data, sha: sha }
  let status = await fetch(`https://api.github.com/repos/${repo}/contents/${fileName}`, 'PUT', JSON.stringify(body), { 'Authorization': `Bearer ${token}` })
  if(!status?.content?.sha){
    if(status?.message?.includes('sha') && !sha){
      let tempSha = await getSha({ repo: repo, fileName: fileName, token: token })
      if(tempSha) return await pushFile({ repo: repo, fileName: fileName, token: token, data: data, user: user, email: email, commitMsg: commitMsg, sha: tempSha })
    }
    log.error(status)
  }
  return status?.content?.sha
}
const checkRateLimit = async(token)=>{
  let headers
  if(token) headers = { 'Authorization': `Bearer ${token}` }
  let res = await fetch('https://api.github.com/rate_limit', 'GET', null, headers)
  if(!res.rate){
    log.error('error chech git hub rate_limit...')
    return
  }
  if(res.rate.remaining > 0) return true
  log.error(`You have exceeded the git hub api rate limit rate limit will reset in ${(rate.reset * 1000 - Date.now()) / 1000} seconds`)
}
module.exports.get = get
module.exports.getSha = getSha
module.exports.list = async({ repo, token, dir })=>{
  if(!repo) return
  let rateLimit = await checkRateLimit(token)
  if(!rateLimit) return
  let uri = `https://api.github.com/repos/${repo}/contents`, headers
  if(dir) uri += `/${dir}`
  if(token) headers = { 'Authorization': `Bearer ${token}` }
  return await fetch(uri, 'GET', null, headers)
}
module.exports.push = pushFile
module.exports.clone = async({ repo, dir, user, token, branch }) =>{
  if(!repo || !dir) return
  let uri = 'https://'
  if(user && token) uri += `${user}:${token}@`
  uri += `github.com/${repo}.git`
  let timeStart = Date.now()
  log.info(`running git clone`)
  let status = await shell.exec(`git clone --depth=1 --single-branch --branch=${branch || 'main'} ${uri} ${dir}`)
  let timeDiff = Date.now() - timeStart
  log.info(`git clone of ${repo} to ${dir} took ${timeDiff/1000} seconds...`)
  if(status?.code == 0 || status?.code === 128) return true
}
module.exports.pull = async(dir)=>{
  if(!dir) return
  shell.cd(dir)
  log.info(`running git fetch...`)
  let status = await shell.exec(`git fetch --depth 1`)
  if(status?.code == 0) log.info(`running git reset...`)
  if(status?.code == 0) status = await shell.exec('git reset --hard origin/main')
  if(status?.code == 0) log.info(`running git clean...`)
  if(status?.code == 0) status = await shell.exec('git clean -dfx')
  //if(status?.code == 0) status = await shell.exec(`git pull ${dir}`)
  if(status?.code == 0) return true
}
module.exports.getJson = async(opt = {})=>{
  if(!opt.repo || !opt.fileName) return
  let file = await get(opt)
  if(!file?.content && file?.message) log.error(file.message)
  return base64ToJson(file?.content)
}
module.exports.config = async({ user, email, dir })=>{
  let status = await shell.exec(`git config --global user.email "${email}"`)
  if(status?.code == 0) status = await shell.exec(`git config --global user.name "${user}"`)
  if(status?.code == 0) status = await shell.exec(`git config --global --add safe.directory ${dir}`)
  if(status?.code == 0) return true
}
