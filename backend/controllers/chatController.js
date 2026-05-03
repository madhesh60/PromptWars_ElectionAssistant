const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Handles chat requests and maintains conversation context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleChat = async (req, res) => {
  try {
    const { contents } = req.body
    if (!contents) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.CONTENTS_REQUIRED })
    }

    const responseText = await geminiService.generateContent({ contents })
    res.json({ response: responseText })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = { handleChat }
