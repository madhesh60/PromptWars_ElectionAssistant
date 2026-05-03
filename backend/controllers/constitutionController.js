const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Handles Constitution Q&A requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getConstitutionAnswer = async (req, res) => {
  try {
    const { text } = req.body
    if (!text) {
      return res
        .status(400)
        .json({ error: CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED })
    }

    const prompt = `You are a constitutional law expert specializing in the Indian Constitution and Election Laws.
Answer the following question with:
- Clear, accurate explanation
- Relevant Article numbers or Section references
- Any landmark Supreme Court judgments if applicable
- Keep it concise but thorough

Question: "${text}"`

    const responseText = await geminiService.generateContent(prompt)
    res.json({ response: responseText })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = { getConstitutionAnswer }
