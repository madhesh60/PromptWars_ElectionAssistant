const request = require('supertest')
const app = require('../server')
const geminiService = require('../services/geminiService')
const CONSTANTS = require('../config/constants')

// Mock the Gemini Service so we don't hit the real API
jest.mock('../services/geminiService')

describe('API Endpoints Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  describe('POST /api/chat', () => {
    it('returns a response when given a question', async () => {
      geminiService.generateContent.mockResolvedValue('Hello, this is a mock chat response.')
      const response = await request(app)
        .post('/api/chat')
        .send({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })

      expect(response.statusCode).toBe(200)
      expect(response.body.response).toBe('Hello, this is a mock chat response.')
    })

    it('returns 400 when contents are missing (empty request)', async () => {
      const response = await request(app).post('/api/chat').send({})
      expect(response.statusCode).toBe(400)
      expect(response.body.error).toBe(CONSTANTS.ERROR_MESSAGES.CONTENTS_REQUIRED)
    })
  })

  describe('POST /api/bias-detect', () => {
    it('returns Left/Center/Right for a valid statement', async () => {
      const mockResult = JSON.stringify({
        bias: 'Center',
        score: 50,
        reasoning: 'Neutral statement',
        indicators: [],
        suggestion: 'None',
      })
      geminiService.generateContent.mockResolvedValue(mockResult)
      
      const response = await request(app)
        .post('/api/bias-detect')
        .send({ text: 'This is a normal sentence.' })

      expect(response.statusCode).toBe(200)
      expect(response.body.response.bias).toBe('Center')
    })

    it('returns 400 when an empty string is sent', async () => {
      const response = await request(app).post('/api/bias-detect').send({ text: '' })
      expect(response.statusCode).toBe(400)
      expect(response.body.error).toBe(CONSTANTS.ERROR_MESSAGES.TEXT_REQUIRED)
    })
  })

  describe('POST /api/represent', () => {
    it('returns a representative when given a city', async () => {
      const mockResult = JSON.stringify({
        constituency: 'Test Constituency',
        state: 'Test State',
        mp: { name: 'Test MP', party: 'Party A' }
      })
      geminiService.generateContent.mockResolvedValue(mockResult)
      
      const response = await request(app)
        .post('/api/represent')
        .send({ text: 'Mumbai' })

      expect(response.statusCode).toBe(200)
      expect(response.body.response.constituency).toBe('Test Constituency')
    })

    it('handles typos in city name smoothly (simulated Gemini response)', async () => {
      // If a typo is sent, Gemini would typically try to correct it or return a not found msg
      const mockResult = JSON.stringify({
        constituency: 'Unknown',
        state: 'Unknown',
        mp: { name: 'Not Found due to typo', party: 'N/A' }
      })
      geminiService.generateContent.mockResolvedValue(mockResult)
      
      const response = await request(app)
        .post('/api/represent')
        .send({ text: 'Mumbbbaaiii' })

      expect(response.statusCode).toBe(200)
      expect(response.body.response.mp.name).toBe('Not Found due to typo')
    })
  })

  describe('POST /api/constitution', () => {
    it('returns a law-based answer', async () => {
      geminiService.generateContent.mockResolvedValue('Article 324 relates to the Election Commission.')
      const response = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is the election commission?' })

      expect(response.statusCode).toBe(200)
      expect(response.body.response).toContain('Article 324')
    })
  })

  describe('Missing API Key Edge Case (Error handling)', () => {
    it('returns 500 when Gemini API throws an error (simulating missing key / network fail)', async () => {
      // Simulate Gemini failure
      geminiService.generateContent.mockRejectedValue(new Error('API key not valid. Please pass a valid API key.'))
      
      const response = await request(app)
        .post('/api/constitution')
        .send({ text: 'Test' })

      expect(response.statusCode).toBe(500)
      expect(response.body.error).toBe(CONSTANTS.ERROR_MESSAGES.GENERIC)
      expect(response.body.details).toContain('API key not valid')
    })
  })
})
