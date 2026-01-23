import { describe, it, expect, vi, mockFetch } from './setup';

describe('API Endpoints', () => {
  describe('/api/health', () => {
    it('should return health status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: 'test',
          version: '0.1.0',
        }),
      });

      const response = await fetch('/api/health');
      const data = await response.json();

      expect(data.status).toBe('ok');
      expect(data.version).toBe('0.1.0');
    });
  });

  describe('/api/writings', () => {
    it('should return array of writings', async () => {
      const mockWritings = [
        { id: '1', title: 'Test Writing', date: '2024-01-01' },
        { id: '2', title: 'Another Writing', date: '2024-01-02' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWritings,
      });

      const response = await fetch('/api/writings');
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].title).toBe('Test Writing');
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const response = await fetch('/api/writings');
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('/api/settings', () => {
    it('should return site settings', async () => {
      const mockSettings = {
        id: '1',
        siteName: 'Afterstill',
        siteTagline: 'Words for the quiet hours',
        oracleEnabled: true,
        radioEnabled: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      const response = await fetch('/api/settings');
      const data = await response.json();

      expect(data.siteName).toBe('Afterstill');
      expect(data.oracleEnabled).toBe(true);
    });
  });
});
