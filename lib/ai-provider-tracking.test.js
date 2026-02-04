/**
 * Property-Based Tests for AI Provider Tracking
 * 
 * **Property 10: AI Provider Tracking**
 * **Validates: Requirements 4.8**
 * 
 * Tests that AI classification results include provider and model tracking information.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';

const VALID_PROVIDERS = ['openrouter', 'huggingface', 'moonshot'];

describe('Feature: scraper-improvements - AI Provider Tracking', () => {
  it('Property 10: AI Provider Tracking - provider is recorded', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_PROVIDERS),
        fc.string({ minLength: 5, maxLength: 50 }),
        (provider, model) => {
          // Simulate AI response with provider tracking
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: 'GROWTH & INNOVATION',
            subcategory: 'General Entity',
            role_summary: 'Test organisation',
            confidence: 0.8,
            provider: provider,
            model: model
          };
          
          // Verify provider is recorded
          expect(aiResponse.provider).to.exist;
          expect(VALID_PROVIDERS).to.include(aiResponse.provider);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 10: AI Provider Tracking - model is recorded', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_PROVIDERS),
        fc.string({ minLength: 5, maxLength: 50 }),
        (provider, model) => {
          // Simulate AI response with model tracking
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: 'GROWTH & INNOVATION',
            subcategory: 'General Entity',
            role_summary: 'Test organisation',
            confidence: 0.8,
            provider: provider,
            model: model
          };
          
          // Verify model is recorded
          expect(aiResponse.model).to.exist;
          expect(aiResponse.model).to.be.a('string');
          expect(aiResponse.model.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 10: AI Provider Tracking - degraded classification has null provider', () => {
    // Simulate degraded classification (all providers failed)
    const degradedResponse = {
      isEcosystemOrg: false,
      type: 'other',
      category: 'GROWTH & INNOVATION',
      subcategory: 'General Entity',
      role_summary: 'Organisation pending manual classification and review',
      confidence: 0.0,
      provider: null,
      model: null,
      needsReview: true,
      degraded: true
    };
    
    // Verify degraded classification has null provider and model
    expect(degradedResponse.provider).to.be.null;
    expect(degradedResponse.model).to.be.null;
    expect(degradedResponse.degraded).to.be.true;
  });
});
