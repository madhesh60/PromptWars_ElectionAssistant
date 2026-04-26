const CONSTANTS = require('../config/constants')

const MAX_LENGTH = CONSTANTS.MAX_INPUT_LENGTH || 2000

const stripHtml = (html) => {
  if (typeof html !== 'string') return html
  return html.replace(/<[^>]*>?/gm, '')
}

const validateInput = (req, res, next) => {
  // Validate chat endpoint (req.body.contents)
  if (req.body.contents && Array.isArray(req.body.contents)) {
    for (let msg of req.body.contents) {
      if (msg.parts && Array.isArray(msg.parts)) {
        for (let part of msg.parts) {
          if (part.text !== undefined) {
            let text = String(part.text).trim()
            if (!text) {
              return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.CONTENTS_REQUIRED })
            }
            if (text.length > MAX_LENGTH) {
              return res.status(400).json({ error: `Input exceeds ${MAX_LENGTH} characters` })
            }
            part.text = stripHtml(text)
          }
        }
      }
    }
  }

  // Validate other endpoints (req.body.text)
  if (req.body.text !== undefined) {
    let text = String(req.body.text).trim()
    if (!text) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED })
    }
    if (text.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Input exceeds ${MAX_LENGTH} characters` })
    }
    req.body.text = stripHtml(text)
  }

  // Handle generic prompts in gemini endpoint if needed
  if (req.body.prompt !== undefined) {
    let text = String(req.body.prompt).trim()
    if (!text) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.PROMPT_REQUIRED })
    }
    if (text.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Input exceeds ${MAX_LENGTH} characters` })
    }
    req.body.prompt = stripHtml(text)
  }

  next()
}

module.exports = { validateInput }
