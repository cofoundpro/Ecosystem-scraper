/**
 * Property-Based Tests for Retry Logic
 * Tests Property 17: Retry with Exponential Backoff
 * Requirements: 8.1
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { chromium } from 'playwright';
import fc from 'fast-check';
import { retryPageGoto } from './enhanced-scraper.js';

describe('Property-Based Tests - Retry Logic', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  /**
   * Property 17: Retry with Exponential Backoff
   * **Validates: Requirements 8.1**
   * 
   * For any page load failure, the scraper SHALL retry up to 3 times
   * with delays of 1s, 2s, and 4s before giving up.
   */
  it('Property 17: Retry with Exponential Backoff', async () => {
    // Feature: scraper-improvements, Property 17: Retry with exponential backoff
    
    // Generator for number of failures before success (0-3)
    // 0 = success on first try
    // 1 = fail once, succeed on second try
    // 2 = fail twice, succeed on third try
    // 3 = fail all three times
    const failureCountGen = fc.integer({ min: 0, max: 3 });
    
    // Generator for different error types
    const errorTypeGen = fc.constantFrom(
      'Network error',
      'Timeout',
      'Connection refused',
      'DNS lookup failed',
      'ERR_CONNECTION_RESET'
    );
    
    const testCaseGen = fc.record({
      failureCount: failureCountGen,
      errorType: errorTypeGen
    });

    await fc.assert(
      fc.asyncProperty(testCaseGen, async ({ failureCount, errorType }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          let attemptCount = 0;
          const attemptTimes = [];
          
          // Mock page.goto to fail specified number of times
          page.goto = async (url, options) => {
            attemptCount++;
            attemptTimes.push(Date.now());
            
            if (attemptCount <= failureCount) {
              throw new Error(errorType);
            }
            
            // Success case - return a mock response
            return { ok: true, status: 200 };
          };
          
          const url = 'https://test-url.test';
          const response = await retryPageGoto(page, url);
          
          // Property 1: Should attempt exactly the right number of times
          if (failureCount < 3) {
            // Should succeed after (failureCount + 1) attempts
            assert.strictEqual(
              attemptCount,
              failureCount + 1,
              `Should attempt ${failureCount + 1} times when failing ${failureCount} times`
            );
            assert.ok(response !== null, 'Should return response on eventual success');
          } else {
            // Should fail after exactly 3 attempts
            assert.strictEqual(
              attemptCount,
              3,
              'Should attempt exactly 3 times before giving up'
            );
            assert.strictEqual(response, null, 'Should return null after all attempts fail');
          }
          
          // Property 2: Should implement exponential backoff delays
          if (attemptCount > 1) {
            // Verify delays between attempts
            const expectedDelays = [1000, 2000, 4000];
            
            for (let i = 1; i < attemptCount; i++) {
              const actualDelay = attemptTimes[i] - attemptTimes[i - 1];
              const expectedDelay = expectedDelays[i - 1];
              
              // Allow 200ms tolerance for execution overhead
              assert.ok(
                actualDelay >= expectedDelay && actualDelay < expectedDelay + 200,
                `Delay ${i} should be ~${expectedDelay}ms, was ${actualDelay}ms`
              );
            }
          }
          
          // Property 3: Should not retry more than 3 times
          assert.ok(
            attemptCount <= 3,
            'Should never attempt more than 3 times'
          );
          
        } finally {
          await context.close();
        }
      }),
      { numRuns: 20 }  // Reduced due to timing-sensitive nature and browser overhead
    );
  });
});
