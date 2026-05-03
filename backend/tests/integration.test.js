/**
 * @file integration.test.js
 * @description Full integration tests that validate the entire request lifecycle
 *              including validation → controller → service → response pipeline.
 */
const request = require('supertest')
const app = require('../server')
const geminiService = require('../services/geminiService')
const ttsService = require('../services/ttsService')
const CONSTANTS = require('../config/constants')

jest.mock('../services/geminiService')
jest.mock('../services/ttsService')

describe('🔗 Integration Tests — Full Request Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-integration-key'
  })

  // ──────────────────────────────────────────────
  // Chat Pipeline
  // ──────────────────────────────────────────────
  describe('POST /api/chat — full pipeline', () => {
    it('processes a multi-turn conversation', async () => {
      geminiService.generateContent
        .mockResolvedValueOnce('First response')
        .mockResolvedValueOnce('Second response')

      const turn1 = await request(app)
        .post('/api/chat')
        .send({
          contents: [{ role: 'user', parts: [{ text: 'Who is the PM of India?' }] }],
        })
      expect(turn1.statusCode).toBe(200)
      expect(turn1.body.response).toBe('First response')

      const turn2 = await request(app)
        .post('/api/chat')
        .send({
          contents: [
            { role: 'user', parts: [{ text: 'Who is the PM of India?' }] },
            { role: 'model', parts: [{ text: 'First response' }] },
            { role: 'user', parts: [{ text: 'What is their party?' }] },
          ],
        })
      expect(turn2.statusCode).toBe(200)
      expect(turn2.body.response).toBe('Second response')
    })

    it('rejects chat with empty parts', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          contents: [{ role: 'user', parts: [{ text: '' }] }],
        })
      expect(res.statusCode).toBe(400)
    })

    it('returns consistent response structure', async () => {
      geminiService.generateContent.mockResolvedValue('Structured answer')
      const res = await request(app)
        .post('/api/chat')
        .send({
          contents: [{ role: 'user', parts: [{ text: 'What is EVM?' }] }],
        })
      expect(res.body).toEqual({ response: 'Structured answer' })
    })
  })

  // ──────────────────────────────────────────────
  // Bias Detect Pipeline
  // ──────────────────────────────────────────────
  describe('POST /api/bias-detect — full pipeline', () => {
    it('returns fully structured bias object', async () => {
      const biasObj = {
        bias: 'Right',
        score: 75,
        reasoning: 'Statement favors one party',
        indicators: ['partisan language'],
        suggestion: 'Use neutral phrasing',
      }
      geminiService.generateContent.mockResolvedValue(JSON.stringify(biasObj))

      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: 'Only BJP can save India.' })

      expect(res.statusCode).toBe(200)
      expect(res.body.response).toMatchObject({
        bias: expect.any(String),
        score: expect.any(Number),
        reasoning: expect.any(String),
      })
    })

    it('handles Left, Center, Right bias labels', async () => {
      for (const bias of ['Left', 'Center', 'Right']) {
        geminiService.generateContent.mockResolvedValue(
          JSON.stringify({ bias, score: 50, reasoning: 'test', indicators: [], suggestion: '' })
        )
        const res = await request(app)
          .post('/api/bias-detect')
          .send({ text: 'Some political statement' })
        expect(res.statusCode).toBe(200)
        expect(res.body.response.bias).toBe(bias)
      }
    })
  })

  // ──────────────────────────────────────────────
  // Constitution Pipeline
  // ──────────────────────────────────────────────
  describe('POST /api/constitution — full pipeline', () => {
    it('returns answer for Article 324 question', async () => {
      geminiService.generateContent.mockResolvedValue(
        'Article 324 vests superintendence of elections in the Election Commission of India.'
      )
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is Article 324?' })

      expect(res.statusCode).toBe(200)
      expect(res.body.response).toContain('Election Commission')
    })

    it('returns answer for voting age question', async () => {
      geminiService.generateContent.mockResolvedValue(
        'Article 326 grants the right to vote to all citizens above 18 years.'
      )
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is the voting age in India?' })

      expect(res.statusCode).toBe(200)
      expect(res.body.response).toContain('18')
    })
  })

  // ──────────────────────────────────────────────
  // Config Endpoint
  // ──────────────────────────────────────────────
  describe('GET /api/config', () => {
    it('returns status: secure and correct structure', async () => {
      const res = await request(app).get('/api/config')
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('status', 'secure')
    })

    it('responds within acceptable time (<500ms)', async () => {
      const start = Date.now()
      await request(app).get('/api/config')
      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })
  })

  // ──────────────────────────────────────────────
  // Vision Endpoint
  // ──────────────────────────────────────────────
  describe('POST /api/gemini-vision', () => {
    it('requires both imageBase64 and prompt', async () => {
      const res = await request(app).post('/api/gemini-vision').send({ imageBase64: 'abc123' }) // missing prompt
      expect(res.statusCode).toBe(400)
    })

    it('processes valid vision request', async () => {
      geminiService.generateContent.mockResolvedValue('I see a ballot paper.')
      const res = await request(app).post('/api/gemini-vision').send({
        imageBase64: 'base64encodeddata',
        prompt: 'What is in this image?',
      })
      expect(res.statusCode).toBe(200)
      expect(res.body.response).toBe('I see a ballot paper.')
    })
  })

  // ──────────────────────────────────────────────
  // Gemini Proxy Endpoint
  // ──────────────────────────────────────────────
  describe('POST /api/gemini', () => {
    it('proxies text prompts to Gemini', async () => {
      geminiService.generateContent.mockResolvedValue('Proxied Gemini response')
      const res = await request(app)
        .post('/api/gemini')
        .send({ prompt: 'Explain NOTA in elections' })
      expect(res.statusCode).toBe(200)
      expect(res.body.response).toBe('Proxied Gemini response')
    })

    it('proxies with file content attached', async () => {
      geminiService.generateContent.mockResolvedValue('File analysed')
      const res = await request(app).post('/api/gemini').send({
        prompt: 'Summarise this manifesto',
        fileContent: 'We promise free education for all...',
        fileName: 'manifesto.txt',
      })
      expect(res.statusCode).toBe(200)
    })
  })

  // ──────────────────────────────────────────────
  // Error Response Structure
  // ──────────────────────────────────────────────
  describe('Consistent Error Response Structure', () => {
    it('all 400 errors have an error field', async () => {
      const endpoints = [
        { method: 'post', url: '/api/chat', body: {} },
        { method: 'post', url: '/api/bias-detect', body: { text: '' } },
        { method: 'post', url: '/api/represent', body: { text: '' } },
        { method: 'post', url: '/api/constitution', body: { text: '' } },
        { method: 'post', url: '/api/gemini', body: {} },
      ]

      for (const ep of endpoints) {
        const res = await request(app)[ep.method](ep.url).send(ep.body)
        expect(res.statusCode).toBe(400)
        expect(res.body).toHaveProperty('error')
        expect(typeof res.body.error).toBe('string')
      }
    })

    it('all 500 errors have an error field', async () => {
      geminiService.generateContent.mockRejectedValue(new Error('Gemini down'))
      const res = await request(app).post('/api/constitution').send({ text: 'test question' })
      expect(res.statusCode).toBe(500)
      expect(res.body).toHaveProperty('error')
    })
  })
})
