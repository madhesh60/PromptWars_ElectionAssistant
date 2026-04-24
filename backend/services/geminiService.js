const { GoogleGenerativeAI } = require('@google/generative-ai')
const CONSTANTS = require('../config/constants')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Generates content using the Gemini model.
 * @param {string|Object|Array} payload - The text prompt, array of parts, or {contents} object.
 * @returns {Promise<string>} - The generated text response.
 */
async function generateContent(payload) {
  const model = genAI.getGenerativeModel({ model: CONSTANTS.GEMINI_MODEL })
  const result = await model.generateContent(payload)
  return result.response.text()
}

module.exports = {
  generateContent,
}
