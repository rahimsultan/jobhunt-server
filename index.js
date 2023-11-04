const express = require('express')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000



app.use(cookieParser())


app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })