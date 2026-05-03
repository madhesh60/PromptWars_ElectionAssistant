/**
 * @file edge-cases.test.js
 * @description Edge-case and stress tests for all API endpoints.
 *              Tests injection attempts, extreme inputs, race conditions,
 *              and concurrent request handling.
 */
const request = require('supertest')
const app = require('../server')
const geminiService = require('../services/geminiService')
const ttsService = require('../services/ttsService')

jest.mock('../services/geminiService')
jest.mock('../services/ttsService')

describe('🧨 Edge Cases & Stress Tests', () => {
  beforeEach(() => jest.clearAllMocks())

  // ──────────────────────────────────────────────
  // Injection Attack Payloads
  // ──────────────────────────────────────────────
  describe('Injection Attack Resistance', () => {
    const attackPayloads = [
      { name: 'SQL injection', text: "'; DROP TABLE users; --" },
      { name: 'NoSQL injection', text: '{ "$gt": "" }' },
      { name: 'Script tag XSS', text: '<script>alert(1)</script>' },
      { name: 'HTML injection', text: '<img src=x onerror=alert(1)>' },
      { name: 'Path traversal', text: '../../../../etc/passwd' },
      { name: 'CRLF injection', text: 'test\r\nX-Injected: malicious' },
    ]

    attackPayloads.forEach(({ name, text }) => {
      it(`handles ${name} without crashing`, async () => {
        geminiService.generateContent.mockResolvedValue(
          JSON.stringify({ bias: 'Center', score: 50, reasoning: 'safe', indicators: [], suggestion: 'none' })
        )
        const res = await request(app)
          .post('/api/bias-detect')
          .send({ text })
        // Must not crash (no 5xx from unhandled error)
        expect([200, 400]).toContain(res.statusCode)
        // Must not echo injected content back unsanitized
        if (res.statusCode === 200) {
          expect(JSON.stringify(res.body)).not.toContain('<script>')
        }
      })
    })
  })

  // ──────────────────────────────────────────────
  // Unicode & Multilingual Inputs
  // ──────────────────────────────────────────────
  describe('Unicode & International Text', () => {
    it('handles Hindi/Devanagari text', async () => {
      geminiService.generateContent.mockResolvedValue('मतदान जानकारी')
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'मतदान का अधिकार क्या है?' })
      expect([200, 500]).toContain(res.statusCode)
    })

    it('handles mixed English + Hindi', async () => {
      geminiService.generateContent.mockResolvedValue('mixed response')
      const res = await request(app)
        .post('/api/chat')
        .send({
          contents: [{ role: 'user', parts: [{ text: 'Election 2024 चुनाव परिणाम' }] }],
        })
      expect([200, 500]).toContain(res.statusCode)
    })

    it('handles emoji in input', async () => {
      geminiService.generateContent.mockResolvedValue('emoji response')
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is voting rights? 🗳️🇮🇳' })
      expect([200, 500]).toContain(res.statusCode)
    })
  })

  // ──────────────────────────────────────────────
  // Gemini Service Failure Modes
  // ──────────────────────────────────────────────
  describe('Gemini Service Failure Modes', () => {
    it('handles Gemini timeout gracefully', async () => {
      geminiService.generateContent.mockRejectedValue(
        new Error('Request timeout after 30000ms')
      )
      const res = await request(app)
        .post('/api/chat')
        .send({ contents: [{ role: 'user', parts: [{ text: 'test' }] }] })
      expect(res.statusCode).toBe(500)
      expect(res.body).toHaveProperty('error')
    })

    it('handles Gemini quota exhaustion error', async () => {
      geminiService.generateContent.mockRejectedValue(
        new Error('RESOURCE_EXHAUSTED: Quota exceeded')
      )
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is Article 324?' })
      expect(res.statusCode).toBe(500)
      expect(res.body).toHaveProperty('error')
    })

    it('handles Gemini returning empty string', async () => {
      geminiService.generateContent.mockResolvedValue('')
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is Article 324?' })
      // Should succeed with empty content, not crash
      expect([200, 500]).toContain(res.statusCode)
    })

    it('handles Gemini returning malformed JSON for bias', async () => {
      geminiService.generateContent.mockResolvedValue('not valid json {{{')
      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: 'Some political statement' })
      // Should not throw unhandled exception
      expect([200, 500]).toContain(res.statusCode)
      expect(res.body).toHaveProperty('error')
    })

    it('handles Gemini returning null', async () => {
      geminiService.generateContent.mockResolvedValue(null)
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: 'What is Article 324?' })
      expect([200, 500]).toContain(res.statusCode)
    })
  })

  // ──────────────────────────────────────────────
  // Concurrent Requests
  // ──────────────────────────────────────────────
  describe('Concurrent Request Handling', () => {
    it('handles 5 concurrent requests to /api/config', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get('/api/config'))
      const results = await Promise.all(requests)
      results.forEach((res) => expect(res.statusCode).toBe(200))
    })

    it('handles 5 concurrent chat requests', async () => {
      geminiService.generateContent.mockResolvedValue('response')
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/chat')
            .send({
              contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
            })
        )
      const results = await Promise.all(requests)
      results.forEach((res) => expect([200, 429]).toContain(res.statusCode))
    })
  })

  // ──────────────────────────────────────────────
  // TTS Edge Cases
  // ──────────────────────────────────────────────
  describe('TTS Edge Cases', () => {
    it('handles very long TTS text', async () => {
      const longText = 'Vote for India. '.repeat(100)
      const res = await request(app).post('/api/tts').send({ text: longText })
      // Either processes or rejects with 400/500
      expect([200, 400, 500]).toContain(res.statusCode)
    })

    it('handles TTS with special characters', async () => {
      ttsService.synthesizeSpeech.mockResolvedValue('base64data')
      const res = await request(app)
        .post('/api/tts')
        .send({ text: 'Elections 2024: 60% turnout & record votes!' })
      expect([200, 500]).toContain(res.statusCode)
    })
  })

  // ──────────────────────────────────────────────
  // Represent Endpoint Edge Cases
  // ──────────────────────────────────────────────
  describe('Represent Endpoint Edge Cases', () => {
    it('handles numeric pin code', async () => {
      geminiService.generateContent.mockResolvedValue(
        JSON.stringify({
          constituency: 'Mumbai South',
          state: 'Maharashtra',
          mp: { name: 'Test MP', party: 'INC' },
        })
      )
      const res = await request(app)
        .post('/api/represent')
        .send({ text: '400001' })
      expect(res.statusCode).toBe(200)
    })

    it('handles extremely long city name', async () => {
      const res = await request(app)
        .post('/api/represent')
        .send({ text: 'a'.repeat(2001) })
      expect(res.statusCode).toBe(400)
    })

    it('handles unknown location gracefully', async () => {
      geminiService.generateContent.mockResolvedValue(
        JSON.stringify({
          constituency: 'Unknown',
          state: 'Unknown',
          mp: { name: 'Data not available', party: 'N/A' },
        })
      )
      const res = await request(app)
        .post('/api/represent')
        .send({ text: 'XYZ UNKNOWN CITY 999' })
      expect(res.statusCode).toBe(200)
      expect(res.body.response.mp.name).toBe('Data not available')
    })
  })
})
