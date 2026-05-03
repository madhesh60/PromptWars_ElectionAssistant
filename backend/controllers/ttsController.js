const ttsService = require('../services/ttsService')
const CONSTANTS = require('../config/constants')

/**
 * Handles Text-To-Speech requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const synthesizeAudio = async (req, res) => {
  try {
    const { text } = req.body
    if (!text) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED })
    }

    const audioContent = await ttsService.synthesizeSpeech(text)
    res.json({ audioContent })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = { synthesizeAudio }
