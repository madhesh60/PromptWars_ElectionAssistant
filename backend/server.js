require('dotenv').config({ path: '../.env' })

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const apiRoutes = require('./routes/apiRoutes')
const CONSTANTS = require('./config/constants')

const app = express()

app.use(helmet())

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many requests' },
})
app.use(limiter)

app.use(cors({
  origin: 'https://prompt-wars-election-assistant.vercel.app'
}))
app.use(express.json({ limit: `${CONSTANTS.MAX_IMAGE_SIZE_MB}mb` }))

app.use('/api', apiRoutes)

if (require.main === module) {
  app.listen(CONSTANTS.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server running on http://localhost:${CONSTANTS.PORT}`)
  })
}

module.exports = app
