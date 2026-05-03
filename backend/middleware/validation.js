/**
 * @file validation.js
 * @description Production-grade input validation & sanitisation middleware.
 *  - Strips HTML/script tags including attribute values
 *  - Enforces character limits
 *  - Validates required fields with clear error messages
 *  - Guards against prototype pollution via JSON key check
 */
const CONSTANTS = require('../config/constants')

const MAX_LENGTH = CONSTANTS.MAX_INPUT_LENGTH || 2000

/**
 * Strips all HTML tags AND their attribute content to prevent XSS.
 * @param {*} input
 * @returns {string}
 */
const stripHtml = (input) => {
  if (typeof input !== 'string') return String(input).trim()
  // Remove entire dangerous tag blocks including their inner content
  let safe = input.replace(/<(script|style|iframe|object|embed|svg)[^>]*>[\s\S]*?<\/\1>/gi, '')
  // Remove dangerous event handler attributes (onerror=..., onclick=..., etc.)
  safe = safe.replace(/\s*on\w+\s*=\s*(['"]?)[^'">\s]*\1/gi, '')
  // Remove all remaining HTML tags
  safe = safe.replace(/<[^>]*>?/gm, '')
  return safe.trim()
}

/**
 * Checks if a raw parsed body has prototype-polluting keys.
 * Uses Object.prototype.hasOwnProperty to avoid own-property false positives.
 * @param {Object} body
 * @returns {boolean}
 */
const hasPrototypePollution = (body) => {
  if (!body || typeof body !== 'object') return false
  // Check own keys only
  const keys = Object.keys(body)
  return keys.some((k) => k === '__proto__' || k === 'constructor' || k === 'prototype')
}

/**
 * Sanitises and validates a text field.
 * Returns an error string on failure, or null on success.
 * Mutates obj[key] in place with sanitised value.
 *
 * @param {Object} obj       - Object containing the field
 * @param {string} key       - Field key name
 * @param {string} errorMsg  - Error message if field is missing/empty
 * @returns {string|null}
 */
const sanitiseField = (obj, key, errorMsg) => {
  if (obj[key] === undefined || obj[key] === null) return errorMsg
  const value = stripHtml(String(obj[key]).trim())
  if (!value) return errorMsg
  if (value.length > MAX_LENGTH) return `Input exceeds ${MAX_LENGTH} characters`
  obj[key] = value
  return null
}

/**
 * Express middleware: validates and sanitises all inbound request bodies.
 */
const validateInput = (req, res, next) => {
  // ── Guard against prototype pollution ──────────────────────────────────────
  if (hasPrototypePollution(req.body)) {
    return res.status(400).json({ error: 'Invalid input detected.' })
  }

  // ── Chat endpoint: req.body.contents ──────────────────────────────────────
  if (req.body.contents !== undefined) {
    if (!Array.isArray(req.body.contents) || req.body.contents.length === 0) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.CONTENTS_REQUIRED })
    }
    for (const msg of req.body.contents) {
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.text !== undefined) {
            const err = sanitiseField(part, 'text', CONSTANTS.ERROR_MESSAGES.CONTENTS_REQUIRED)
            if (err) return res.status(400).json({ error: err })
          }
        }
      }
    }
    return next()
  }

  // ── Text-based endpoints ───────────────────────────────────────────────────
  if (req.body.text !== undefined) {
    const err = sanitiseField(req.body, 'text', CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED)
    if (err) return res.status(400).json({ error: err })
    return next()
  }

  // ── Gemini prompt endpoint ─────────────────────────────────────────────────
  if (req.body.prompt !== undefined) {
    const err = sanitiseField(req.body, 'prompt', CONSTANTS.ERROR_MESSAGES.PROMPT_REQUIRED)
    if (err) return res.status(400).json({ error: err })
    return next()
  }

  // ── Vision endpoint: requires imageBase64 ─────────────────────────────────
  if (req.body.imageBase64 !== undefined || req.body.mimeType !== undefined) {
    if (!req.body.imageBase64 || !req.body.prompt) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.VISION_REQ_MISSING })
    }
    return next()
  }

  // ── No recognised fields: pass through (let controller decide) ────────────
  next()
}

module.exports = { validateInput, stripHtml, sanitiseField }
