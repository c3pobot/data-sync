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
  if(token) header = { 'Authorization': `Bearer ${token}` }
  return await fetch(uri, 'GET', null, headers)
}
const getSha = async(opt = {})=>{
  if(!opt.repo || !opt.fileName) return
  let file = await get(opt)
  return file?.sha
}
module.exports.get = get
module.exports.getSha = getSha
module.exports.list = async({ repo, token, dir })=>{
  if(!repo) return
  let uri = `https://api.github.com/repos/${repo}/contents`, headers
  if(dir) uri += `/${dir}`
  if(token) header = { 'Authorization': `Bearer ${token}` }
  return await fetch(uri, 'GET', null, headers)
}
module.exports.push = async({ repo, fileName, token, data, user, email, commitMsg, sha })=>{
  if(!repo || !fileName || !token || !data || !email || !user) return
  let body = { committer: user, email: email, message: commitMsg || 'update', content: data, sha: sha }
  let status = await fetch(`https://api.github.com/repos/${repo}/contents/${fileName}`, 'PUT', JSON.stringify(body), { 'Authorization': `Bearer ${token}` })
    if(!status?.content?.sha) log.error(status)
    return status?.content?.sha
}
module.exports.clone = async({ repo, dir, user, token, branch }) =>{
  if(!repo || !dir) return
  let uri = 'https://'
  if(user && token) uri += `${user}:${token}@`
  uri += `github.com/${repo}.git`
  let status = await shell.exec(`git clone --depth=1 --single-branch --branch=${branch || 'main'} ${uri} ${dir}`)
  if(status?.code == 0) return true
}
module.exports.pull = async(dir)=>{
  if(!dir) return
  shell.cd(dir)
  let status = await shell.exec(`git pull ${dir}`)
  if(status?.code == 0) return true
}
module.exports.getJson = async(opt = {})=>{
  if(!opt.repo || !opt.fileName) return
  let file = await get(opt)
  return base64ToJson(file?.content)
}
module.exports.config = async({ user, email, dir })=>{
  let status = await shell.exec(`git config --global user.email "${email}"`)
  if(status?.code == 0) status = await shell.exec(`git config --global user.name "${user}"`)
  if(status?.code == 0) status = await shell.exec(`git config --global --add safe.directory ${dir}`)
  if(status?.code == 0) return true
}
