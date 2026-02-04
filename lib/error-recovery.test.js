/**
 * Property-Based Test for Error Recovery
 * Tests Property 18: Error Recovery Continuation
 * Requirements: 8.2
 * 
 * This test verifies that when HTTP errors (403/429/503) occur,
 * the scraper logs the error and continues processing without stopping.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { chromium } from 'playwright';
import fc from 'fast-check';
import { retryPageGoto, ErrorSummary, scrapeOrganisation } from './enhanced-scraper.js';

describe('Property-Based Tests - Error Recovery', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  /**
   * Property 18: Error Recovery Continuation
   * **Validates: Requirements 8.2**
   * 
   * For any page returning 403/429/503 status codes, the scraper SHALL log
   * the error and continue to the next URL without stopping the entire run.
   * 
   * This property verifies:
   * 1. HTTP errors are logged correctly
   * 2. The scraper returns null for failed URLs
   * 3. The scraper can continue processing subsequent URLs
   * 4. Error summary tracks all errors
   */
  it('Property 18: Error Recovery Continuation', async () => {
    // Feature: scraper-improvements, Property 18: Error recovery continuation
    
    // Generator for HTTP error status codes
    const httpErrorCodeGen = fc.constantFrom(403, 429, 503);
    
    // Generator for URL lists with mixed success/failure
    // Each URL can either succeed or fail with an HTTP error
    const urlResultGen = fc.record({
      url: fc.webUrl(),
      shouldFail: fc.boolean(),
      errorCode: httpErrorCodeGen
    });
    
    // Generate a list of 3-10 URLs to process
    const urlListGen = fc.array(urlResultGen, { minLength: 3, maxLength: 10 });
    
    await fc.assert(
      fc.asyncProperty(urlListGen, async (urlResults) => {
        const errorSummary = new ErrorSummary();
        const processedUrls = [];
        const failedUrls = [];
        const successfulUrls = [];
        
        // Process each URL in the list
        for (const urlResult of urlResults) {
          const context = await browser.newContext();
          const page = await context.newPage();
          
          try {
            // Mock page.goto to simulate success or HTTP error
            page.goto = async (url, options) => {
              if (urlResult.shouldFail) {
                // Simulate HTTP error response
                return {
                  ok: false,
                  status: () => urlResult.errorCode,
                  statusText: () => {
                    switch (urlResult.errorCode) {
                      case 403: return 'Forbidden';
                      case 429: return 'Too Many Requests';
                      case 503: return 'Service Unavailable';
                      default: return 'Error';
                    }
                  }
                };
              } else {
                // Simulate successful response
                return {
                  ok: true,
                  status: () => 200,
                  statusText: () => 'OK'
                };
              }
            };
            
            // Attempt to load the page
            const response = await retryPageGoto(page, urlResult.url, {}, errorSummary);
            
            // Track that we processed this URL (didn't stop)
            processedUrls.push(urlResult.url);
            
            if (response === null) {
              // URL failed
              failedUrls.push(urlResult.url);
            } else {
              // URL succeeded - we can continue to scrape
              successfulUrls.push(urlResult.url);
              
              // Verify we can still scrape after errors
              // (This demonstrates continuation)
              const data = await scrapeOrganisation(urlResult.url, page);
              assert.ok(data !== null, 'Should be able to scrape after errors');
              assert.strictEqual(data.website, urlResult.url);
            }
            
          } finally {
            await context.close();
          }
        }
        
        // Property 1: All URLs should be processed (no early termination)
        assert.strictEqual(
          processedUrls.length,
          urlResults.length,
          'Should process all URLs without stopping on errors'
        );
        
        // Property 2: Failed URLs should return null
        const expectedFailures = urlResults.filter(r => r.shouldFail).length;
        assert.strictEqual(
          failedUrls.length,
          expectedFailures,
          'All failed URLs should return null'
        );
        
        // Property 3: Successful URLs should be processed
        const expectedSuccesses = urlResults.filter(r => !r.shouldFail).length;
        assert.strictEqual(
          successfulUrls.length,
          expectedSuccesses,
          'All successful URLs should be processed'
        );
        
        // Property 4: Error summary should track all HTTP errors
        const summary = errorSummary.getSummary();
        assert.strictEqual(
          summary.httpErrors.length,
          expectedFailures,
          'Error summary should track all HTTP errors'
        );
        
        // Property 5: Each HTTP error should be logged with correct details
        for (let i = 0; i < expectedFailures; i++) {
          const failedUrlResult = urlResults.filter(r => r.shouldFail)[i];
          const loggedError = summary.httpErrors.find(e => e.url === failedUrlResult.url);
          
          assert.ok(
            loggedError !== undefined,
            `HTTP error for ${failedUrlResult.url} should be logged`
          );
          
          assert.strictEqual(
            loggedError.statusCode,
            failedUrlResult.errorCode,
            `Logged error should have correct status code`
          );
        }
        
        // Property 6: Scraper should continue after encountering errors
        // This is demonstrated by the fact that we processed all URLs
        // even if some failed early in the list
        const hasEarlyFailure = urlResults.length > 1 && urlResults[0].shouldFail;
        const hasLaterSuccess = urlResults.length > 1 && 
          urlResults.slice(1).some(r => !r.shouldFail);
        
        if (hasEarlyFailure && hasLaterSuccess) {
          // If we had an early failure and later success, verify we processed both
          const firstUrl = urlResults[0].url;
          const laterSuccessUrl = urlResults.slice(1).find(r => !r.shouldFail).url;
          
          assert.ok(
            processedUrls.includes(firstUrl),
            'Should process URL that failed'
          );
          assert.ok(
            processedUrls.includes(laterSuccessUrl),
            'Should continue to process URLs after failure'
          );
        }
      }),
      { numRuns: 10 }  // Reduced for faster execution as requested
    );
  });

  /**
   * Additional test: Verify error recovery with specific error sequences
   * Tests that the scraper handles various error patterns correctly
   */
  it('Property 18 (variant): Error recovery with specific patterns', async () => {
    // Feature: scraper-improvements, Property 18: Error recovery patterns
    
    // Generator for error patterns: sequences of success/failure
    const errorPatternGen = fc.constantFrom(
      [true, false, false],      // Fail first, then succeed
      [false, true, false],      // Succeed, fail, succeed
      [false, false, true],      // Succeed twice, then fail
      [true, true, false],       // Fail twice, then succeed
      [true, true, true],        // All failures
      [false, false, false]      // All successes
    );
    
    await fc.assert(
      fc.asyncProperty(errorPatternGen, async (pattern) => {
        const errorSummary = new ErrorSummary();
        const results = [];
        
        // Process URLs according to the pattern
        for (let i = 0; i < pattern.length; i++) {
          const shouldFail = pattern[i];
          const url = `https://test-${i}.example.com`;
          
          const context = await browser.newContext();
          const page = await context.newPage();
          
          try {
            // Mock page.goto
            page.goto = async (url, options) => {
              if (shouldFail) {
                return {
                  ok: false,
                  status: () => 403,
                  statusText: () => 'Forbidden'
                };
              } else {
                return {
                  ok: true,
                  status: () => 200,
                  statusText: () => 'OK'
                };
              }
            };
            
            const response = await retryPageGoto(page, url, {}, errorSummary);
            results.push({
              url,
              success: response !== null,
              expectedToFail: shouldFail
            });
            
          } finally {
            await context.close();
          }
        }
        
        // Verify all URLs were processed
        assert.strictEqual(
          results.length,
          pattern.length,
          'Should process all URLs in the pattern'
        );
        
        // Verify each result matches expectations
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const expectedToFail = pattern[i];
          
          assert.strictEqual(
            result.success,
            !expectedToFail,
            `URL ${i} should ${expectedToFail ? 'fail' : 'succeed'}`
          );
        }
        
        // Verify error summary
        const expectedErrors = pattern.filter(f => f).length;
        assert.strictEqual(
          errorSummary.getSummary().httpErrors.length,
          expectedErrors,
          'Error summary should match expected error count'
        );
      }),
      { numRuns: 15 }  // Reduced for faster execution as requested
    );
  });
});
