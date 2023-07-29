'use stict'
const Cmds = {}
Cmds.debugMsg = (obj)=>{
  try{
    const tempObj = {status: 'failed'}
    if(obj && obj.debugMsg >= 0){
      debugMsg = +obj.debugMsg
      console.log('debug has been turned '+(debugMsg == 1 ? 'on':'off'))
      tempObj.status = 'ok'
    }
    return tempObj
  }catch(e){
    console.log(e)
    return({status: 'error'})
  }
}
Cmds.updateData = (obj, content)=>{
  try{
    console.log('Server requested a gameData update')
    if(+process.env.DATAUPDATE == 0) DataUpdate(obj?.newFiles)
    return {status: 'ok'}
  }catch(e){
    console.log(e)
    return({status: 'error'})
  }
}
module.exports = Cmds
