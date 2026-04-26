const geminiService = require('../services/geminiService')
const ttsService = require('../services/ttsService')

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => 'mocked gemini response'
            }
          })
        })
      }
    })
  }
})

describe('Services Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('geminiService', () => {
    it('generates content successfully', async () => {
      const response = await geminiService.generateContent('test prompt')
      expect(response).toBe('mocked gemini response')
    })
  })

  describe('ttsService', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    afterEach(() => {
      global.fetch.mockClear()
      delete global.fetch
    })

    it('synthesizes speech successfully', async () => {
      process.env.GOOGLE_TTS_API_KEY = 'test-key'
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ audioContent: 'base64audio' })
      })

      const audio = await ttsService.synthesizeSpeech('test text')
      expect(audio).toBe('base64audio')
    })

    it('throws error if API key is missing', async () => {
      delete process.env.GOOGLE_TTS_API_KEY
      await expect(ttsService.synthesizeSpeech('test')).rejects.toThrow('TTS API key not configured.')
    })

    it('throws error if response has no audioContent', async () => {
      process.env.GOOGLE_TTS_API_KEY = 'test-key'
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({})
      })

      await expect(ttsService.synthesizeSpeech('test')).rejects.toThrow('Failed to generate TTS audio from API response.')
    })
  })
})
