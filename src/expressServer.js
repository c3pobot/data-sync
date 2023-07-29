'use strict'
const { gameData } = require('./updateData/buildGameData/gameData')
const express = require('express')
const bodyParser = require('body-parser');
const compression = require('compression');
const app = express()
const PORT = process.env.PORT || 3000
app.use(bodyParser.json({
  limit: '500MB',
  verify: (req, res, buf)=>{
    req.rawBody = buf.toString()
  }
}))
app.use(compression());
app.get('/healthz', (req, res)=>{
  res.status(200).json({res: 'ok'})
})
app.get('/version', (req, res)=>{
  try{
    res.status(200).json({version: gameData.version })
  }catch(e){
    console.error(e)
    res.sendStatus(400)
  }
})
app.get('/updateData', (req, res)=>{
  try{
    DataUpdate(true)
    res.sendStatus(200)
  }catch(e){
    console.error(e)
    res.sendStatus(400)
  }
})
const server = app.listen(PORT, ()=>{
  console.log('datasync server is listening on '+ server.address().port)
})
