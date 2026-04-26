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
              return res.status(400).json({ error: 'Input cannot be empty' })
            }
            if (text.length > 2000) {
              return res.status(400).json({ error: 'Input exceeds 2000 characters' })
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
      return res.status(400).json({ error: 'Text cannot be empty' })
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Input exceeds 2000 characters' })
    }
    req.body.text = stripHtml(text)
  }

  // Handle generic prompts in gemini endpoint if needed
  if (req.body.prompt !== undefined) {
    let text = String(req.body.prompt).trim()
    if (!text) {
      return res.status(400).json({ error: 'Prompt cannot be empty' })
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Input exceeds 2000 characters' })
    }
    req.body.prompt = stripHtml(text)
  }

  next()
}

module.exports = { validateInput }
