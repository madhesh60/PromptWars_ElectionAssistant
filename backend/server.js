/**
 * @file server.js
 * @description Production-grade Express server with:
 *  - Helmet security headers
 *  - HPP (HTTP Parameter Pollution) protection
 *  - XSS sanitization
 *  - CORS with strict origin allowlist
 *  - Rate limiting (global + per-route)
 *  - Request size limits
 *  - Graceful shutdown handler
 *  - 404 catch-all
 *  - Centralised error handler
 */
require('dotenv').config({ path: '../.env' })

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const apiRoutes = require('./routes/apiRoutes')
const CONSTANTS = require('./config/constants')

const app = express()

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)
// XSS protection is handled per-field in validation middleware

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const isTest = process.env.NODE_ENV === 'test'

// ── Advanced Custom Security Middleware ──────────────────────────────────────
app.use((req, res, next) => {
  // 1. Strict Content-Type check for POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('application/json')) {
      return res
        .status(415)
        .json({ error: 'Unsupported Media Type: Only application/json is allowed' })
    }
  }

  // 2. HTTP Parameter Pollution (HPP) Guard for Express 5+
  // Reject requests with array-based query parameters where a string is expected
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        return res.status(400).json({ error: 'HTTP Parameter Pollution detected.' })
      }
    }
  }

  // 3. Prevent TRACE/TRACK methods (XST)
  if (['TRACE', 'TRACK'].includes(req.method)) {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  next()
})

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: isTest ? 10000 : 60, // Effectively disabled in test mode
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 15, // Effectively disabled in test mode
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait 60 seconds.' },
})

app.use(globalLimiter)

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://prompt-wars-election-assistant.vercel.app',
  ...(process.env.NODE_ENV === 'test' ? ['http://localhost:3000'] : []),
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl in dev/test)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
)

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: `${CONSTANTS.MAX_IMAGE_SIZE_MB}mb` }))

// ── Routes ────────────────────────────────────────────────────────────────────
// Apply strict rate limit to AI-heavy routes
app.use('/api/chat', strictLimiter)
app.use('/api/bias-detect', strictLimiter)
app.use('/api/constitution', strictLimiter)
app.use('/api/represent', strictLimiter)
app.use('/api/gemini', strictLimiter)
app.use('/api/gemini-vision', strictLimiter)

app.use('/api', apiRoutes)

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Centralised Error Handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[Server Error]', err.message)
  res.status(err.status || 500).json({
    error: CONSTANTS.ERROR_MESSAGES.GENERIC,
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  })
})

// ── Server Boot + Graceful Shutdown ───────────────────────────────────────────
if (require.main === module) {
  const server = app.listen(CONSTANTS.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Backend running on http://localhost:${CONSTANTS.PORT}`)
  })

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — graceful shutdown...`)
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Server closed')
      process.exit(0)
    })
    // Force-kill after 10 s if hanging
    setTimeout(() => process.exit(1), 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[UnhandledRejection]', reason)
  })

  process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('[UncaughtException]', err)
    process.exit(1)
  })
}

module.exports = app
