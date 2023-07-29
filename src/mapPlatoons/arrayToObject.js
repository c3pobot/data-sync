'use strict'
module.exports = async(array = [], key)=>{
  try{
    return array.reduce((obj, item)=>{
      return{
        ...obj,
        [item[key]]: item
      }
    }, {})
  }catch(e){
    console.error(e);
  }
}
