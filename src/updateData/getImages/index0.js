'use strict'
const got = require('got')
const fs = require('fs')
const SaveImage = require('../saveImage')
const publicDir = process.env.PUBLIC_DIR || '/home/node/app/public'
const GetFileNames = (dir)=>{
  return new Promise(resolve =>{
    try{
      fs.readdir(dir, (err, files)=>{
        if(err) console.error(err);
        resolve(files)
      })
    }catch(e){
      console.error(e);
      resolve()
    }
  })
}
const SaveFile = async(dir, fileName, file)=>{
  try{
    fs.writeFileSync(filePath+'/'+key, file, {encoding: 'binary'})
  }catch(e){
    console.error(e);
  }
}
module.exports = async(assetVersion)=>{
  try{
    console.log('Checking for missing images...')
    let thumbNails = await GetFileNames(publicDir+'/thumbnail')
    let portraits = await GetFileNames(publicDir+'/portrait')
    if(!thumbNails) thumbNails = []
    if(!portraits) portraits = []
    let missingThumbNails = [], missingPortraits = []
    let units = await mongo.find('units', {}, {_id: 1, thumbnailName: 1, baseId: 1, nameKey: 1})
    if(units.length > 0){
      missingThumbNails = units?.filter(x=>!thumbNails.includes(x.thumbnailName+'.png'))
      missingPortraits = units?.filter(x=>!portraits.includes(x.thumbnailName+'.png'))
    }
    if(missingThumbNails?.length > 0){
      console.log('Updating '+missingThumbNails.length+' thumbnail')
      missingThumbNails.forEach((unit)=>{
        if(unit?.thumbnailName) SaveImage(assetVersion, unit.thumbnailName, 'thumbnail')
      })
    }
    if(missingPortraits?.length > 0){
      console.log('Updating '+missingPortraits.length+' portrait')
      missingPortraits.forEach((unit)=>{
        if(unit?.thumbnailName) SaveImage(assetVersion, unit.thumbnailName, 'portrait')
      })
    }
    units = null;
    console.log('Image check complete...')
  }catch(e){
    console.error(e);
  }
}
