'use strict'
module.exports = (string)=>{
  try{
    /*
  	eventName = eventName.replace('\\n', '')
  	eventName = eventName.replace('[c]', '')
  	eventName = eventName.replace('[E50073]', ' ')
  	eventName = eventName.replace('[FFC891]', ' ')
  	eventName = eventName.replace('[-]', '')
  	eventName = eventName.replace('[/c]', '')
    */
    string = string.replace('\\n', '')
    string = string.replace(/\[c\]/g, ' ')
    string = string.replace(/\[\/c]/g, '')
    string = string.replace(/\[-\]/g, '')
    string = string.replace(/\[\w{1,6}\]/g, '')
  	return string
  }catch(e){
    console.error(e);
  }
}
