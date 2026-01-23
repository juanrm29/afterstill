import { describe, it, expect } from './setup';
import { debounce, throttle } from '../src/lib/performance';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      let callCount = 0;
      const fn = debounce(() => { callCount++; }, 100);
      
      fn();
      fn();
      fn();
      
      // Should not have been called yet
      expect(callCount).toBe(0);
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have been called once
      expect(callCount).toBe(1);
    });

    it('should pass arguments to debounced function', async () => {
      let receivedArgs: unknown[] = [];
      const fn = debounce((...args: unknown[]) => { receivedArgs = args; }, 100);
      
      fn('a', 'b', 'c');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(receivedArgs).toEqual(['a', 'b', 'c']);
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', async () => {
      let callCount = 0;
      const fn = throttle(() => { callCount++; }, 100);
      
      fn(); // Should execute immediately
      fn(); // Should be throttled
      fn(); // Should be throttled
      
      expect(callCount).toBe(1);
      
      // Wait for throttle to reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      fn(); // Should execute
      expect(callCount).toBe(2);
    });
  });
});
