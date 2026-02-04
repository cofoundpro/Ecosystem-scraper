/**
 * Property-Based Tests for Required Field Validation
 * 
 * **Property 2: Required Field Validation**
 * **Validates: Requirements 1.4, 5.6**
 * 
 * Tests that documents missing required fields fail validation and are not saved.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { validateOrganisation } from './validator.js';

describe('Feature: scraper-improvements - Required Field Validation', () => {
  it('Property 2: Required Field Validation - missing name fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          website: fc.webUrl(),
          country: fc.constant('United Arab Emirates'),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 })
        }),
        (orgData) => {
          // Omit name field
          const result = validateOrganisation(orgData);
          
          // Verify validation fails
          expect(result.valid).to.be.false;
          expect(result.errors.some(err => err.includes('name'))).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 2: Required Field Validation - missing website fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          country: fc.constant('United Arab Emirates'),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 })
        }),
        (orgData) => {
          // Omit website field
          const result = validateOrganisation(orgData);
          
          // Verify validation fails
          expect(result.valid).to.be.false;
          expect(result.errors.some(err => err.includes('website'))).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 2: Required Field Validation - missing country fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 })
        }),
        (orgData) => {
          // Omit country field
          const result = validateOrganisation(orgData);
          
          // Verify validation fails
          expect(result.valid).to.be.false;
          expect(result.errors.some(err => err.includes('country'))).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 2: Required Field Validation - missing categories fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          country: fc.constant('United Arab Emirates'),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 })
        }),
        (orgData) => {
          // Omit categories field
          const result = validateOrganisation(orgData);
          
          // Verify validation fails
          expect(result.valid).to.be.false;
          expect(result.errors.some(err => err.includes('categories'))).to.be.true;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 2: Required Field Validation - all required fields present passes', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          country: fc.constant('United Arab Emirates'),
          categories: fc.constant(['GROWTH & INNOVATION']),
          subcategories: fc.constant(['General Entity']),
          roles: fc.array(fc.string({ minLength: 10 }), { minLength: 1 })
        }),
        (orgData) => {
          const result = validateOrganisation(orgData);
          
          // Verify validation passes when all required fields present
          expect(result.valid).to.be.true;
          expect(result.errors).to.be.empty;
        }
      ),
      { numRuns: 20 }
    );
  });
});
