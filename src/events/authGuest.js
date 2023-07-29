'use strict'
module.exports = async(uId)=>{
  try{
    const obj = await Client('authGuest', {uid: guestAccount.uId})
    if(obj?.authId && obj?.authToken){
      await mongo.set('identity', {_id: uId}, {auth: obj})
      return obj
    }
  }catch(e){
    console.error(e)
  }
}
