const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Detects political bias in a given statement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const analyzeBias = async (req, res) => {
  try {
    const { text } = req.body
    if (!text) {
      return res.status(400).json({ error: CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED })
    }

    const prompt = `You are a political bias analyst. Analyze the following statement/headline for political bias in the Indian political context.
Respond in this EXACT JSON format only, no markdown fences:
{
  "bias": "Left" or "Center-Left" or "Center" or "Center-Right" or "Right",
  "score": (number from 0 to 100, where 0=far left, 50=center, 100=far right),
  "reasoning": "2-3 sentences explaining why",
  "indicators": ["list", "of", "bias", "indicators"],
  "suggestion": "How to make this more neutral"
}

Statement: "${text}"`

    const rawResponse = await geminiService.generateContent(prompt)
    const cleaned = rawResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const data = JSON.parse(cleaned)

    res.json({ response: data })
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = { analyzeBias }
