const request = require('supertest')
const app = require('../server')
const geminiService = require('../services/geminiService')
const ttsService = require('../services/ttsService')

jest.mock('../services/geminiService')
jest.mock('../services/ttsService')

describe('Other API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/config', () => {
    it('returns config status', async () => {
      const response = await request(app).get('/api/config')
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe('secure')
    })
  })

  describe('GET /api/election-data', () => {
    it('returns election data', async () => {
      const mockData = JSON.stringify([{ id: 1, phase: 'Phase 1' }])
      geminiService.generateContent.mockResolvedValue(mockData)
      const response = await request(app).get('/api/election-data')
      expect(response.statusCode).toBe(200)
      expect(response.body[0].phase).toBe('Phase 1')
    })
    it('handles errors', async () => {
      geminiService.generateContent.mockRejectedValue(new Error('fail'))
      const response = await request(app).get('/api/election-data')
      expect(response.statusCode).toBe(500)
    })
  })

  describe('POST /api/gemini', () => {
    it('returns gemini proxy text', async () => {
      geminiService.generateContent.mockResolvedValue('text response')
      const response = await request(app).post('/api/gemini').send({ prompt: 'test' })
      expect(response.statusCode).toBe(200)
      expect(response.body.response).toBe('text response')
    })
    it('handles missing prompt', async () => {
      const response = await request(app).post('/api/gemini').send({})
      expect(response.statusCode).toBe(400)
    })
    it('handles file attachments', async () => {
      geminiService.generateContent.mockResolvedValue('file context')
      const response = await request(app)
        .post('/api/gemini')
        .send({ prompt: 'test', fileContent: 'data' })
      expect(response.statusCode).toBe(200)
      expect(response.body.response).toBe('file context')
    })
  })

  describe('POST /api/gemini-vision', () => {
    it('returns vision result', async () => {
      geminiService.generateContent.mockResolvedValue('vision response')
      const response = await request(app)
        .post('/api/gemini-vision')
        .send({ imageBase64: 'abc', prompt: 'test' })
      expect(response.statusCode).toBe(200)
      expect(response.body.response).toBe('vision response')
    })
    it('handles missing required fields', async () => {
      const response = await request(app).post('/api/gemini-vision').send({ prompt: 'test' })
      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/tts', () => {
    it('returns audio data', async () => {
      ttsService.synthesizeSpeech.mockResolvedValue('base64audio')
      const response = await request(app).post('/api/tts').send({ text: 'test' })
      expect(response.statusCode).toBe(200)
      expect(response.body.audioContent).toBe('base64audio')
    })
    it('handles missing text', async () => {
      const response = await request(app).post('/api/tts').send({})
      expect(response.statusCode).toBe(400)
    })
    it('handles errors', async () => {
      ttsService.synthesizeSpeech.mockRejectedValue(new Error('tts fail'))
      const response = await request(app).post('/api/tts').send({ text: 'test' })
      expect(response.statusCode).toBe(500)
    })
  })
})
