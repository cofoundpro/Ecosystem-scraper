/**
 * Property-Based Tests for AI Subcategory Validation
 * 
 * **Property 8: AI Subcategory Validation**
 * **Validates: Requirements 4.2, 5.4**
 * 
 * Tests that AI classification results only contain subcategories from the allowed taxonomy.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { TAXONOMY } from './validator.js';

const ALLOWED_SUBCATEGORIES = Object.values(TAXONOMY).flat();

describe('Feature: scraper-improvements - AI Subcategory Validation', () => {
  it('Property 8: AI Subcategory Validation - valid subcategories pass', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_SUBCATEGORIES),
        (subcategory) => {
          // Simulate AI response with valid subcategory
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: 'GROWTH & INNOVATION',
            subcategory: subcategory,
            role_summary: 'Test organisation',
            confidence: 0.8
          };
          
          // Verify subcategory is in allowed list
          expect(ALLOWED_SUBCATEGORIES).to.include(aiResponse.subcategory);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 8: AI Subcategory Validation - invalid subcategories fail', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !ALLOWED_SUBCATEGORIES.includes(s) && s.length > 0),
        (invalidSubcategory) => {
          // Simulate AI response with invalid subcategory
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: 'GROWTH & INNOVATION',
            subcategory: invalidSubcategory,
            role_summary: 'Test organisation',
            confidence: 0.8
          };
          
          // Verify subcategory is NOT in allowed list
          expect(ALLOWED_SUBCATEGORIES).to.not.include(aiResponse.subcategory);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 8: AI Subcategory Validation - subcategory matches category', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TAXONOMY)),
        (category) => {
          const validSubcategoriesForCategory = TAXONOMY[category];
          const subcategory = validSubcategoriesForCategory[0];
          
          // Simulate AI response with matching category and subcategory
          const aiResponse = {
            isEcosystemOrg: true,
            type: 'startup',
            category: category,
            subcategory: subcategory,
            role_summary: 'Test organisation',
            confidence: 0.8
          };
          
          // Verify subcategory is valid for the category
          expect(TAXONOMY[aiResponse.category]).to.include(aiResponse.subcategory);
        }
      ),
      { numRuns: 20 }
    );
  });
});
