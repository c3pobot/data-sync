'use strict'
module.exports = (eventTime)=>{
	try{
    const t = new Date(+eventTime)
    return (+t.getMonth() + 1).toString().padStart(2, '0') + '/' + t.getDate().toString().padStart(2, '0')
  }catch(e){
    console.error(e);
  }
}
