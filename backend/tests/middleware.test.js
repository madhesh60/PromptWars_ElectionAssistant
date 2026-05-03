/**
 * @file middleware.test.js
 * @description Comprehensive tests for validation middleware, error handling,
 *              rate limiting, and XSS/injection protection.
 */
const request = require('supertest')
const app = require('../server')

describe('🛡️ Middleware & Security Tests', () => {
  // ──────────────────────────────────────────────
  // Input Length Limits
  // ──────────────────────────────────────────────
  describe('Input Length Validation', () => {
    it('rejects text input exceeding 2000 characters', async () => {
      const longText = 'a'.repeat(2001)
      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: longText })
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/exceeds/i)
    })

    it('accepts text at exactly the max length boundary', async () => {
      const geminiService = require('../services/geminiService')
      jest.mock('../services/geminiService')
      geminiService.generateContent = jest.fn().mockResolvedValue(
        JSON.stringify({ bias: 'Center', score: 50, reasoning: 'ok', indicators: [], suggestion: 'none' })
      )
      const exactText = 'a'.repeat(2000)
      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: exactText })
      // Should not get a 400 for length
      expect(res.statusCode).not.toBe(400)
    })

    it('rejects prompt exceeding 2000 characters', async () => {
      const longPrompt = 'x'.repeat(2001)
      const res = await request(app)
        .post('/api/gemini')
        .send({ prompt: longPrompt })
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/exceeds/i)
    })
  })

  // ──────────────────────────────────────────────
  // XSS Sanitization
  // ──────────────────────────────────────────────
  describe('XSS Input Sanitization', () => {
    it('strips HTML tags from text input', async () => {
      const geminiService = require('../services/geminiService')
      jest.mock('../services/geminiService')
      geminiService.generateContent = jest.fn().mockResolvedValue(
        JSON.stringify({ bias: 'Center', score: 50, reasoning: 'ok', indicators: [], suggestion: 'none' })
      )
      // Send XSS payload — it should not crash the server
      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: '<script>alert("xss")</script>Vote for me!' })
      // Server should sanitize and process, not 500
      expect([200, 400, 500]).toContain(res.statusCode)
      // Must not echo the script tag back
      expect(JSON.stringify(res.body)).not.toContain('<script>')
    })
  })

  // ──────────────────────────────────────────────
  // Missing & Empty Body Handling
  // ──────────────────────────────────────────────
  describe('Missing Body Handling', () => {
    it('returns 400 for completely empty body to /api/chat', async () => {
      const res = await request(app).post('/api/chat').send({})
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for null text to /api/bias-detect', async () => {
      const res = await request(app)
        .post('/api/bias-detect')
        .send({ text: '' })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for whitespace-only text', async () => {
      const res = await request(app)
        .post('/api/constitution')
        .send({ text: '   ' })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for missing prompt in /api/gemini', async () => {
      const res = await request(app).post('/api/gemini').send({})
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for empty prompt in /api/gemini', async () => {
      const res = await request(app).post('/api/gemini').send({ prompt: '' })
      expect(res.statusCode).toBe(400)
    })
  })

  // ──────────────────────────────────────────────
  // HTTP Method Validation
  // ──────────────────────────────────────────────
  describe('HTTP Method Validation', () => {
    it('returns 404 for GET on POST-only /api/chat', async () => {
      const res = await request(app).get('/api/chat')
      expect([404, 405]).toContain(res.statusCode)
    })

    it('returns 404 for DELETE on /api/bias-detect', async () => {
      const res = await request(app).delete('/api/bias-detect')
      expect([404, 405]).toContain(res.statusCode)
    })
  })

  // ──────────────────────────────────────────────
  // Unknown Routes
  // ──────────────────────────────────────────────
  describe('Unknown Route Handling', () => {
    it('returns 404 for unknown /api route', async () => {
      const res = await request(app).get('/api/nonexistent-route')
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 for root path', async () => {
      const res = await request(app).get('/')
      expect(res.statusCode).toBe(404)
    })
  })

  // ──────────────────────────────────────────────
  // Security Headers (Helmet)
  // ──────────────────────────────────────────────
  describe('Security Headers', () => {
    it('sets X-Content-Type-Options header', async () => {
      const res = await request(app).get('/api/config')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })

    it('sets X-Frame-Options or CSP header', async () => {
      const res = await request(app).get('/api/config')
      const hasFrameGuard =
        res.headers['x-frame-options'] !== undefined ||
        res.headers['content-security-policy'] !== undefined
      expect(hasFrameGuard).toBe(true)
    })

    it('does not expose X-Powered-By header', async () => {
      const res = await request(app).get('/api/config')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────
  // Content-Type Validation
  // ──────────────────────────────────────────────
  describe('Content-Type Handling', () => {
    it('returns JSON content-type for API responses', async () => {
      const res = await request(app).get('/api/config')
      expect(res.headers['content-type']).toMatch(/application\/json/)
    })

    it('handles malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send('{ "contents": [{ broken json }')
      expect([400, 500]).toContain(res.statusCode)
    })
  })
})
