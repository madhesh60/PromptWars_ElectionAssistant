const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

/**
 * Fetches election schedule data using Gemini
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getElectionData = async (req, res) => {
  try {
    const prompt = `
      You are a data extractor. Provide the official schedule of the 2024 Indian General Elections (Lok Sabha Elections).
      Return ONLY a valid JSON array. No markdown.
      Each object: "id", "phase", "date" (YYYY-MM-DD), "description", "timestamp" (epoch ms).
    `
    const rawText = await geminiService.generateContent(prompt)
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const electionData = JSON.parse(cleanedText)
    res.json(electionData)
  } catch (error) {
    res.status(500).json({
      error: CONSTANTS.ERROR_MESSAGES.GENERIC,
      details: error.message,
    })
  }
}

module.exports = { getElectionData }
