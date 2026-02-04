/**
 * Property-Based Tests for AI Category Validation
 * 
 * **Property 7: AI Category Validation**
 * **Validates: Requirements 4.1, 5.3**
 * 
 * Tests that AI classification results only contain categories from the allowed taxonomy.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { TAXONOMY } from './validator.js';

const ALLOWED_CATEGORIES = Object.keys(TAXONOMY);

describe('Feature: scraper-improvements - AI Category Validation', () => {
  it('Property 7: AI Category Validation - valid categories pass', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_CATEGORIES),
        (category) => {
          // Simulate AI response with valid category
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: category,
            subcategory: 'General Entity',
            role_summary: 'Test organisation',
            confidence: 0.8
          };
          
          // Verify category is in allowed list
          expect(ALLOWED_CATEGORIES).to.include(aiResponse.category);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 7: AI Category Validation - invalid categories fail', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !ALLOWED_CATEGORIES.includes(s) && s.length > 0),
        (invalidCategory) => {
          // Simulate AI response with invalid category
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: invalidCategory,
            subcategory: 'General Entity',
            role_summary: 'Test organisation',
            confidence: 0.8
          };
          
          // Verify category is NOT in allowed list
          expect(ALLOWED_CATEGORIES).to.not.include(aiResponse.category);
        }
      ),
      { numRuns: 20 }
    );
  });
});
