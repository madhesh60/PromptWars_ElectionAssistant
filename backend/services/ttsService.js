const CONSTANTS = require('../config/constants')

/**
 * Synthesizes text to speech using Google TTS API.
 * @param {string} text - The text to synthesize.
 * @returns {Promise<string>} - The base64 encoded audio content.
 */
async function synthesizeSpeech(text) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY
  if (!apiKey) {
    throw new Error(CONSTANTS.ERROR_MESSAGES.TTS_KEY_MISSING)
  }

  const url = `${CONSTANTS.TTS_URL}?key=${apiKey}`
  const payload = {
    input: { text },
    voice: {
      languageCode: CONSTANTS.TTS_LANGUAGE_CODE,
      name: CONSTANTS.TTS_VOICE_NAME,
    },
    audioConfig: { audioEncoding: CONSTANTS.TTS_AUDIO_ENCODING },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (data.audioContent) {
    return data.audioContent
  }

  throw new Error('Failed to generate TTS audio from API response.')
}

module.exports = {
  synthesizeSpeech,
}
