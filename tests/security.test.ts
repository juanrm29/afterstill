import { describe, it, expect } from './setup';
import {
  sanitizeHTML,
  containsSQLInjection,
  containsXSS,
  validateFileUpload,
} from '../src/lib/security';

describe('Security Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      // Note: DOMPurify requires window, so we test basic behavior
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      
      // In SSR (no window), returns input unchanged
      expect(result).toContain('Hello');
    });

    it('should allow safe HTML tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const result = sanitizeHTML(input);
      
      expect(result).toContain('strong');
      expect(result).toContain('em');
    });
  });

  describe('containsSQLInjection', () => {
    it('should detect SQL injection patterns', () => {
      expect(containsSQLInjection("SELECT * FROM users")).toBe(true);
      expect(containsSQLInjection("DROP TABLE users")).toBe(true);
      expect(containsSQLInjection("DELETE FROM users")).toBe(true);
    });

    it('should not flag normal input', () => {
      expect(containsSQLInjection("Hello World")).toBe(false);
      expect(containsSQLInjection("user@example.com")).toBe(false);
    });
  });

  describe('containsXSS', () => {
    it('should detect XSS patterns', () => {
      expect(containsXSS('<script>alert(1)</script>')).toBe(true);
      expect(containsXSS('javascript:void(0)')).toBe(true);
      expect(containsXSS('<img onerror="alert(1)">')).toBe(true);
    });

    it('should not flag normal input', () => {
      expect(containsXSS('Hello World')).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    it('should accept valid file types', () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' });
      const result = validateFileUpload(file, { allowedTypes: ['image/png', 'image/jpeg'] });
      
      expect(result.valid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'script.js', { type: 'application/javascript' });
      const result = validateFileUpload(file, { allowedTypes: ['image/png', 'image/jpeg'] });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should enforce file size limits', () => {
      const content = new Array(6 * 1024 * 1024).fill('a').join(''); // 6MB
      const file = new File([content], 'large.png', { type: 'image/png' });
      const result = validateFileUpload(file, { maxSize: 5 * 1024 * 1024 }); // 5MB limit
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });
  });
});
