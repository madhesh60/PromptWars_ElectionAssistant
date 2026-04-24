/**
 * Application Constants
 * Contains all hardcoded strings, URLs, configuration limits, etc.
 */
const CONSTANTS = {
  PORT: process.env.PORT || 3000,
  GEMINI_MODEL: 'gemini-2.0-flash',
  MAX_INPUT_LENGTH: 2000,
  MAX_IMAGE_SIZE_MB: 50,
  TTS_URL: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  TTS_LANGUAGE_CODE: 'en-IN',
  TTS_VOICE_NAME: 'en-IN-Standard-D',
  TTS_AUDIO_ENCODING: 'MP3',
  ERROR_MESSAGES: {
    GENERIC: 'Something went wrong',
    PROMPT_REQUIRED: 'Prompt is required.',
    CONTENTS_REQUIRED: 'Contents are required.',
    TEXT_REQUIRED: 'Text is required.',
    TTS_KEY_MISSING: 'TTS API key not configured.',
    VISION_REQ_MISSING: 'imageBase64 and prompt are required.',
    FETCH_ELECTION_DATA_FAILED: 'Failed to fetch election data.',
    GEMINI_FAILED: 'Gemini request failed.',
    CHAT_FAILED: 'Gemini chat request failed.',
    TTS_FAILED: 'TTS request failed.',
    VISION_FAILED: 'Gemini Vision request failed.',
  },
}

module.exports = CONSTANTS
