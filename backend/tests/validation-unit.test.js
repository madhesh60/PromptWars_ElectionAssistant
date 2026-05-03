/**
 * @file validation-unit.test.js
 * @description Unit tests for the validation middleware helper functions.
 */
const { stripHtml, sanitiseField } = require('../middleware/validation')

describe('🔬 Validation Utility Unit Tests', () => {
  // ──────────────────────────────────────────────
  // stripHtml
  // ──────────────────────────────────────────────
  describe('stripHtml()', () => {
    it('removes script tags', () => {
      expect(stripHtml('<script>alert(1)</script>Hello')).toBe('Hello')
    })

    it('removes img onerror tags', () => {
      const result = stripHtml('<img src=x onerror=alert(1)>')
      // The onerror attribute value is removed, then the tag is removed
      expect(result).toBe('')
    })

    it('removes anchor href tags', () => {
      expect(stripHtml('<a href="evil.com">Click</a>')).toBe('Click')
    })

    it('preserves plain text', () => {
      expect(stripHtml('Vote for India 2024')).toBe('Vote for India 2024')
    })

    it('handles non-string input by converting to string', () => {
      expect(stripHtml(123)).toBe('123')
      expect(stripHtml(null)).toBe('null')
    })

    it('trims whitespace', () => {
      expect(stripHtml('  hello  ')).toBe('hello')
    })

    it('removes nested HTML', () => {
      expect(stripHtml('<div><p>Test</p></div>')).toBe('Test')
    })

    it('handles empty string', () => {
      expect(stripHtml('')).toBe('')
    })
  })

  // ──────────────────────────────────────────────
  // sanitiseField
  // ──────────────────────────────────────────────
  describe('sanitiseField()', () => {
    it('returns error message when field is missing', () => {
      const obj = {}
      const result = sanitiseField(obj, 'text', 'Text is required.')
      expect(result).toBe('Text is required.')
    })

    it('returns error message when field is empty string', () => {
      const obj = { text: '' }
      const result = sanitiseField(obj, 'text', 'Text is required.')
      expect(result).toBe('Text is required.')
    })

    it('returns error message when field is whitespace only', () => {
      const obj = { text: '   ' }
      const result = sanitiseField(obj, 'text', 'Text is required.')
      expect(result).toBe('Text is required.')
    })

    it('returns length error when field exceeds 2000 chars', () => {
      const obj = { text: 'a'.repeat(2001) }
      const result = sanitiseField(obj, 'text', 'Text required')
      expect(result).toMatch(/exceeds/i)
    })

    it('sanitises the field in place on success', () => {
      const obj = { text: '<b>Hello</b>' }
      const result = sanitiseField(obj, 'text', 'required')
      expect(result).toBeNull()
      expect(obj.text).toBe('Hello')
    })

    it('returns null for valid field', () => {
      const obj = { text: 'Valid election question' }
      const result = sanitiseField(obj, 'text', 'required')
      expect(result).toBeNull()
    })

    it('converts numeric values to strings', () => {
      const obj = { text: 12345 }
      const result = sanitiseField(obj, 'text', 'required')
      expect(result).toBeNull()
      expect(obj.text).toBe('12345')
    })
  })
})
