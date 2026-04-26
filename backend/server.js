require('dotenv').config({ path: '../.env' })

const express = require('express')
const cors = require('cors')
const apiRoutes = require('./routes/apiRoutes')
const CONSTANTS = require('./config/constants')

const app = express()

app.use(cors())
app.use(express.json({ limit: `${CONSTANTS.MAX_IMAGE_SIZE_MB}mb` }))

app.use('/api', apiRoutes)

if (require.main === module) {
  app.listen(CONSTANTS.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server running on http://localhost:${CONSTANTS.PORT}`)
  })
}

module.exports = app
