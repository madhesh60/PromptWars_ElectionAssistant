const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Handles generic Gemini text prompts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const handleGeminiText = async (req, res) => {
  try {
    const { prompt, fileContent, fileName } = req.body
    if (!prompt) {
      return res
        .status(400)
        .json({ error: CONSTANTS.ERROR_MESSAGES.PROMPT_REQUIRED })
    }

    let fullPrompt = prompt
    if (fileContent) {
      const name = fileName || 'document'
      fullPrompt += `\n\n--- Attached File: ${name} ---\n${fileContent}\n--- End of File ---`
    }

    const responseText = await geminiService.generateContent(fullPrompt)
    res.json({ response: responseText })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

/**
 * Handles Gemini Vision requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const handleGeminiVision = async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body
    if (!imageBase64 || !prompt) {
      return res
        .status(400)
        .json({ error: CONSTANTS.ERROR_MESSAGES.VISION_REQ_MISSING })
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/png',
      },
    }

    const responseText = await geminiService.generateContent([
      prompt,
      imagePart,
    ])
    res.json({ response: responseText })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = {
  handleGeminiText,
  handleGeminiVision,
}
