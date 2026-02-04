/**
 * Property-Based Tests for Graceful AI Degradation
 * 
 * **Property 20: Graceful AI Degradation**
 * **Validates: Requirements 8.4**
 * 
 * Tests that when all AI providers are exhausted, the system returns a default
 * classification that allows organisations to be saved without AI data.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { createDefaultClassification } from './multi-provider-classifier.js';

describe('Feature: scraper-improvements - Graceful AI Degradation', () => {
  it('Property 20: Graceful AI Degradation - default classification when all providers fail', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          description: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: null })
        }),
        (orgData) => {
          // Simulate all providers failing - get default classification
          const defaultClassification = createDefaultClassification(orgData);
          
          // Verify default classification structure
          expect(defaultClassification).to.exist;
          expect(defaultClassification.isEcosystemOrg).to.be.false;
          expect(defaultClassification.type).to.equal('other');
          expect(defaultClassification.category).to.equal('GROWTH & INNOVATION');
          expect(defaultClassification.subcategory).to.equal('General Entity');
          expect(defaultClassification.role_summary).to.include('pending manual classification');
          expect(defaultClassification.confidence).to.equal(0.0);
          expect(defaultClassification.provider).to.be.null;
          expect(defaultClassification.model).to.be.null;
          expect(defaultClassification.needsReview).to.be.true;
          expect(defaultClassification.degraded).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 20: Graceful AI Degradation - degraded flag is set', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl()
        }),
        (orgData) => {
          const defaultClassification = createDefaultClassification(orgData);
          
          // Verify degraded flag is set
          expect(defaultClassification.degraded).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 20: Graceful AI Degradation - needsReview is always true', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl()
        }),
        (orgData) => {
          const defaultClassification = createDefaultClassification(orgData);
          
          // Verify needsReview is always true for degraded classifications
          expect(defaultClassification.needsReview).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 20: Graceful AI Degradation - confidence is 0.0', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl()
        }),
        (orgData) => {
          const defaultClassification = createDefaultClassification(orgData);
          
          // Verify confidence is 0.0 (no AI confidence)
          expect(defaultClassification.confidence).to.equal(0.0);
        }
      ),
      { numRuns: 20 }
    );
  });
});
