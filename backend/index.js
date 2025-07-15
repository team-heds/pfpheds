require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json())

app.get('/api/ping', (req, res) => {
  res.send('pingpong')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Backend OK sur le port ${PORT}`))

