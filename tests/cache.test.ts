import { describe, it, expect, beforeEach } from './setup';
import { memoryCache } from '../src/lib/cache';

describe('MemoryCache', () => {
  beforeEach(() => {
    memoryCache.clear();
  });

  it('should store and retrieve values', () => {
    memoryCache.set('key1', 'value1');
    
    expect(memoryCache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    expect(memoryCache.get('nonexistent')).toBeNull();
  });

  it('should respect TTL', async () => {
    memoryCache.set('key1', 'value1', 100); // 100ms TTL
    
    expect(memoryCache.get('key1')).toBe('value1');
    
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(memoryCache.get('key1')).toBeNull();
  });

  it('should delete values', () => {
    memoryCache.set('key1', 'value1');
    memoryCache.delete('key1');
    
    expect(memoryCache.get('key1')).toBeNull();
  });

  it('should clear all values', () => {
    memoryCache.set('key1', 'value1');
    memoryCache.set('key2', 'value2');
    memoryCache.clear();
    
    expect(memoryCache.get('key1')).toBeNull();
    expect(memoryCache.get('key2')).toBeNull();
  });
});
