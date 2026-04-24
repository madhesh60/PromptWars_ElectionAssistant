const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Looks up local representatives for a given location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getRepresentatives = async (req, res) => {
  try {
    const { text } = req.body
    if (!text) {
      return res
        .status(400)
        .json({ error: CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED })
    }

    const prompt = `You are an Indian political data expert. The user wants to know who represents them.
Given the city/area/pin code below, provide the following information in this EXACT JSON format (no markdown fences):
{
  "constituency": "Name of Lok Sabha constituency",
  "state": "State name",
  "mp": {
    "name": "Full name of current MP",
    "party": "Party name",
    "partyAbbr": "Party abbreviation",
    "image": "",
    "elected": "Year elected",
    "margin": "Winning margin",
    "keyPromises": ["promise 1", "promise 2", "promise 3"],
    "attendance": "Parliament attendance percentage",
    "questionsAsked": "Number of questions asked in parliament",
    "debatesParticipated": "Number of debates"
  },
  "mla": {
    "name": "State MLA name (if known)",
    "party": "Party name",
    "constituency": "Assembly constituency name"
  }
}

Location: "${text}"`

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

module.exports = { getRepresentatives }
