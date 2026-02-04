import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TAXONOMY,
  validateOrganisation,
  isValidURL,
  isValidTwitterHandle,
  isValidCategory,
  isValidSubcategory,
  addToReviewQueue,
  saveReviewQueue,
  getReviewQueue,
  clearReviewQueue
} from './validator.js';

describe('Validator - URL Validation', () => {
  describe('Valid URLs', () => {
    it('should accept valid HTTPS URL', () => {
      assert.strictEqual(isValidURL('https://example.com'), true);
    });

    it('should accept valid HTTP URL', () => {
      assert.strictEqual(isValidURL('http://example.com'), true);
    });

    it('should accept URL with path', () => {
      assert.strictEqual(isValidURL('https://example.com/path/to/page'), true);
    });

    it('should accept URL with subdomain', () => {
      assert.strictEqual(isValidURL('https://www.example.com'), true);
    });

    it('should accept URL with port', () => {
      assert.strictEqual(isValidURL('https://example.com:8080'), true);
    });

    it('should accept URL with query parameters', () => {
      assert.strictEqual(isValidURL('https://example.com?param=value'), true);
    });
  });

  describe('Invalid URLs', () => {
    it('should reject URL without protocol', () => {
      assert.strictEqual(isValidURL('example.com'), false);
    });

    it('should reject URL without domain extension', () => {
      assert.strictEqual(isValidURL('https://example'), false);
    });

    it('should reject empty string', () => {
      assert.strictEqual(isValidURL(''), false);
    });

    it('should reject null', () => {
      assert.strictEqual(isValidURL(null), false);
    });

    it('should reject undefined', () => {
      assert.strictEqual(isValidURL(undefined), false);
    });

    it('should reject non-string values', () => {
      assert.strictEqual(isValidURL(123), false);
      assert.strictEqual(isValidURL({}), false);
      assert.strictEqual(isValidURL([]), false);
    });

    it('should reject invalid protocol', () => {
      assert.strictEqual(isValidURL('ftp://example.com'), false);
    });
  });
});

describe('Validator - Twitter Handle Validation', () => {
  describe('Valid Twitter Handles', () => {
    it('should accept handle with @ prefix', () => {
      assert.strictEqual(isValidTwitterHandle('@example'), true);
    });

    it('should accept handle without @ prefix', () => {
      assert.strictEqual(isValidTwitterHandle('example'), true);
    });

    it('should accept handle with numbers', () => {
      assert.strictEqual(isValidTwitterHandle('@example123'), true);
    });

    it('should accept handle with underscores', () => {
      assert.strictEqual(isValidTwitterHandle('@example_user'), true);
    });

    it('should accept single character handle', () => {
      assert.strictEqual(isValidTwitterHandle('@a'), true);
    });

    it('should accept 15 character handle (max length)', () => {
      assert.strictEqual(isValidTwitterHandle('@123456789012345'), true);
    });

    it('should accept mixed case handle', () => {
      assert.strictEqual(isValidTwitterHandle('@ExAmPlE'), true);
    });
  });

  describe('Invalid Twitter Handles', () => {
    it('should reject handle longer than 15 characters', () => {
      assert.strictEqual(isValidTwitterHandle('@1234567890123456'), false);
    });

    it('should reject handle with spaces', () => {
      assert.strictEqual(isValidTwitterHandle('@example user'), false);
    });

    it('should reject handle with special characters', () => {
      assert.strictEqual(isValidTwitterHandle('@example!'), false);
      assert.strictEqual(isValidTwitterHandle('@example#'), false);
      assert.strictEqual(isValidTwitterHandle('@example$'), false);
    });

    it('should reject handle with hyphens', () => {
      assert.strictEqual(isValidTwitterHandle('@example-user'), false);
    });

    it('should reject empty string', () => {
      assert.strictEqual(isValidTwitterHandle(''), false);
    });

    it('should reject null', () => {
      assert.strictEqual(isValidTwitterHandle(null), false);
    });

    it('should reject undefined', () => {
      assert.strictEqual(isValidTwitterHandle(undefined), false);
    });

    it('should reject non-string values', () => {
      assert.strictEqual(isValidTwitterHandle(123), false);
    });
  });
});

describe('Validator - Category Validation', () => {
  describe('Valid Categories', () => {
    it('should accept "NETWORKING & COMMUNITY"', () => {
      assert.strictEqual(isValidCategory('NETWORKING & COMMUNITY'), true);
    });

    it('should accept "TALENT & EDUCATION"', () => {
      assert.strictEqual(isValidCategory('TALENT & EDUCATION'), true);
    });

    it('should accept "FUNDING & FINANCE"', () => {
      assert.strictEqual(isValidCategory('FUNDING & FINANCE'), true);
    });

    it('should accept "SUPPORT INFRASTRUCTURE"', () => {
      assert.strictEqual(isValidCategory('SUPPORT INFRASTRUCTURE'), true);
    });

    it('should accept "GROWTH & INNOVATION"', () => {
      assert.strictEqual(isValidCategory('GROWTH & INNOVATION'), true);
    });

    it('should accept "POLICY & PUBLIC AGENCIES"', () => {
      assert.strictEqual(isValidCategory('POLICY & PUBLIC AGENCIES'), true);
    });
  });

  describe('Invalid Categories', () => {
    it('should reject category not in taxonomy', () => {
      assert.strictEqual(isValidCategory('INVALID CATEGORY'), false);
    });

    it('should reject lowercase category', () => {
      assert.strictEqual(isValidCategory('networking & community'), false);
    });

    it('should reject empty string', () => {
      assert.strictEqual(isValidCategory(''), false);
    });

    it('should reject null', () => {
      assert.strictEqual(isValidCategory(null), false);
    });

    it('should reject undefined', () => {
      assert.strictEqual(isValidCategory(undefined), false);
    });
  });
});

describe('Validator - Subcategory Validation', () => {
  describe('Valid Subcategories', () => {
    it('should accept "General Business Community & Membership"', () => {
      assert.strictEqual(isValidSubcategory('General Business Community & Membership'), true);
    });

    it('should accept "Venture Capital & Private Equity"', () => {
      assert.strictEqual(isValidSubcategory('Venture Capital & Private Equity'), true);
    });

    it('should accept "Generalist Incubators & Accelerators"', () => {
      assert.strictEqual(isValidSubcategory('Generalist Incubators & Accelerators'), true);
    });

    it('should accept "National & Regional Enterprise Agencies"', () => {
      assert.strictEqual(isValidSubcategory('National & Regional Enterprise Agencies'), true);
    });

    it('should accept subcategory from any category', () => {
      assert.strictEqual(isValidSubcategory('Universities & Research Institutions'), true);
      assert.strictEqual(isValidSubcategory('Innovation Centres (Sector-Focused)'), true);
    });
  });

  describe('Invalid Subcategories', () => {
    it('should reject subcategory not in taxonomy', () => {
      assert.strictEqual(isValidSubcategory('Invalid Subcategory'), false);
    });

    it('should reject empty string', () => {
      assert.strictEqual(isValidSubcategory(''), false);
    });

    it('should reject null', () => {
      assert.strictEqual(isValidSubcategory(null), false);
    });

    it('should reject undefined', () => {
      assert.strictEqual(isValidSubcategory(undefined), false);
    });
  });
});

describe('Validator - Organisation Validation', () => {
  describe('Valid Organisations', () => {
    it('should accept valid organisation with all required fields', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role description']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should accept organisation with valid twitter handle', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['FUNDING & FINANCE'],
        subcategories: ['Venture Capital & Private Equity'],
        roles: ['Test role'],
        twitter: '@example'
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, true);
    });

    it('should accept organisation with null twitter', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['SUPPORT INFRASTRUCTURE'],
        subcategories: ['Generalist Incubators & Accelerators'],
        roles: ['Test role'],
        twitter: null
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, true);
    });

    it('should accept organisation with multiple categories', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY', 'TALENT & EDUCATION'],
        subcategories: ['General Business Community & Membership', 'Universities & Research Institutions'],
        roles: ['Test role 1', 'Test role 2']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Invalid Organisations - Missing Required Fields', () => {
    it('should reject null organisation', () => {
      const result = validateOrganisation(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes('Organisation object is required'));
    });

    it('should reject organisation without name', () => {
      const org = {
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('name')));
    });

    it('should reject organisation with empty name', () => {
      const org = {
        name: '   ',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('name')));
    });

    it('should reject organisation without website', () => {
      const org = {
        name: 'Test Organisation',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('website')));
    });

    it('should reject organisation without country', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('country')));
    });

    it('should reject organisation without categories', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('categories')));
    });

    it('should reject organisation without subcategories', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('subcategories')));
    });

    it('should reject organisation without roles', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('roles')));
    });
  });

  describe('Invalid Organisations - Invalid Field Values', () => {
    it('should reject organisation with invalid website URL', () => {
      const org = {
        name: 'Test Organisation',
        website: 'not-a-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('website') && e.includes('invalid format')));
    });

    it('should reject organisation with invalid twitter handle', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role'],
        twitter: '@invalid-handle-with-dash'
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('twitter') && e.includes('invalid format')));
    });

    it('should reject organisation with invalid category', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['INVALID CATEGORY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('categories') && e.includes('invalid category')));
    });

    it('should reject organisation with invalid subcategory', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['Invalid Subcategory'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('subcategories') && e.includes('invalid subcategory')));
    });

    it('should reject organisation with empty categories array', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: [],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('categories') && e.includes('at least one')));
    });

    it('should reject organisation with empty subcategories array', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: [],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('subcategories') && e.includes('at least one')));
    });

    it('should reject organisation with empty roles array', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: []
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('roles') && e.includes('at least one')));
    });

    it('should reject organisation with non-array categories', () => {
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: 'NETWORKING & COMMUNITY',
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('categories') && e.includes('must be an array')));
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return all validation errors', () => {
      const org = {
        name: '',
        website: 'invalid-url',
        country: '',
        categories: 'not-an-array',
        subcategories: [],
        roles: [],
        twitter: '@invalid-handle-too-long-1234567890'
      };
      
      const result = validateOrganisation(org);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 5, 'Should have multiple errors');
    });
  });
});

describe('Validator - TAXONOMY Constant', () => {
  it('should have all required categories', () => {
    const expectedCategories = [
      'NETWORKING & COMMUNITY',
      'TALENT & EDUCATION',
      'FUNDING & FINANCE',
      'SUPPORT INFRASTRUCTURE',
      'GROWTH & INNOVATION',
      'POLICY & PUBLIC AGENCIES'
    ];
    
    const actualCategories = Object.keys(TAXONOMY);
    assert.deepStrictEqual(actualCategories.sort(), expectedCategories.sort());
  });

  it('should have subcategories for each category', () => {
    for (const [category, subcategories] of Object.entries(TAXONOMY)) {
      assert.ok(Array.isArray(subcategories), `${category} should have array of subcategories`);
      assert.ok(subcategories.length > 0, `${category} should have at least one subcategory`);
    }
  });

  it('should have expected subcategories for NETWORKING & COMMUNITY', () => {
    const expected = [
      'General Business Community & Membership',
      'Events & Awards',
      'Sector-Specific Networks'
    ];
    assert.deepStrictEqual(TAXONOMY['NETWORKING & COMMUNITY'], expected);
  });

  it('should have expected subcategories for FUNDING & FINANCE', () => {
    const expected = [
      'Venture Capital & Private Equity',
      'Angel Syndicates & Networks',
      'Public & Development Banks',
      'Crowdfunding Platforms'
    ];
    assert.deepStrictEqual(TAXONOMY['FUNDING & FINANCE'], expected);
  });
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

import fc from 'fast-check';

describe('Property-Based Tests - Twitter Validation', () => {
  describe('Property 6: Twitter Handle Validation', () => {
    it('**Validates: Requirements 3.4, 3.5** - should validate Twitter handle pattern correctly', () => {
      // Generate random Twitter handles (valid and invalid) and verify pattern matching
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid handles with @ prefix
            fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/).map(s => `@${s}`),
            // Valid handles without @ prefix
            fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/),
            // Invalid: too long (>15 chars)
            fc.stringMatching(/^[A-Za-z0-9_]{16,30}$/),
            fc.stringMatching(/^[A-Za-z0-9_]{16,30}$/).map(s => `@${s}`),
            // Invalid: contains spaces
            fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.includes(' ')),
            // Invalid: contains special characters
            fc.oneof(
              fc.constant('@user!'),
              fc.constant('@user#name'),
              fc.constant('@user$'),
              fc.constant('@user%'),
              fc.constant('@user&'),
              fc.constant('@user*'),
              fc.constant('user@name'),
              fc.constant('@user.name'),
              fc.constant('@user-name')
            ),
            // Invalid: empty or null-like
            fc.constant(''),
            fc.constant('@'),
            fc.constant('__NULL__'),
            fc.constant('__UNDEFINED__')
          ),
          (twitterHandle) => {
            // Handle special test values
            let testValue = twitterHandle;
            if (twitterHandle === '__NULL__') testValue = null;
            if (twitterHandle === '__UNDEFINED__') testValue = undefined;
            
            // Determine if handle should be valid based on pattern
            const isExpectedValid = !!(testValue && 
              typeof testValue === 'string' && 
              /^@?[A-Za-z0-9_]{1,15}$/.test(testValue));
            
            // Test the validation function
            const result = isValidTwitterHandle(testValue);
            
            assert.strictEqual(
              result,
              isExpectedValid,
              `Expected handle "${JSON.stringify(testValue)}" to be ${isExpectedValid ? 'valid' : 'invalid'}, got ${result}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 3.4, 3.5** - should accept valid Twitter handles', () => {
      // Generate only valid Twitter handles and verify they pass validation
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid handles with @ prefix
            fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/).map(s => `@${s}`),
            // Valid handles without @ prefix
            fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/),
            // Edge cases: single character
            fc.constantFrom('@a', '@Z', '@_', '@0', 'a', 'Z', '_', '0'),
            // Edge cases: exactly 15 characters
            fc.constant('@123456789012345'),
            fc.constant('123456789012345'),
            // Mixed case and underscores
            fc.stringMatching(/^[A-Za-z0-9_]{5,15}$/).map(s => `@${s}`),
            fc.stringMatching(/^[A-Za-z0-9_]{5,15}$/)
          ),
          (validHandle) => {
            const result = isValidTwitterHandle(validHandle);
            assert.strictEqual(
              result,
              true,
              `Expected valid handle "${validHandle}" to pass validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 3.4, 3.5** - should reject invalid Twitter handles', () => {
      // Generate only invalid Twitter handles and verify they fail validation
      fc.assert(
        fc.property(
          fc.oneof(
            // Too long (>15 chars)
            fc.stringMatching(/^[A-Za-z0-9_]{16,30}$/),
            fc.stringMatching(/^[A-Za-z0-9_]{16,30}$/).map(s => `@${s}`),
            // Contains spaces
            fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.includes(' ')).map(s => `@${s}`),
            // Contains hyphens
            fc.constant('@user-name'),
            fc.constant('user-name'),
            // Contains dots
            fc.constant('@user.name'),
            fc.constant('user.name'),
            // Contains special characters
            fc.constantFrom(
              '@user!', '@user#', '@user$', '@user%', '@user&',
              '@user*', '@user()', '@user[]', '@user{}', '@user+',
              'user!', 'user#', 'user$'
            ),
            // Empty or just @
            fc.constant(''),
            fc.constant('@'),
            // Null and undefined
            fc.constant('__NULL__'),
            fc.constant('__UNDEFINED__')
          ),
          (invalidHandle) => {
            // Handle special test values
            let testValue = invalidHandle;
            if (invalidHandle === '__NULL__') testValue = null;
            if (invalidHandle === '__UNDEFINED__') testValue = undefined;
            
            const result = isValidTwitterHandle(testValue);
            assert.strictEqual(
              result,
              false,
              `Expected invalid handle "${testValue}" to fail validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 3.4, 3.5** - should handle Twitter field in organisation validation', () => {
      // Generate organisations with various Twitter handle values
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 }),
            twitter: fc.oneof(
              // Valid handles
              fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/).map(s => `@${s}`),
              fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/),
              // Invalid handles
              fc.stringMatching(/^[A-Za-z0-9_]{16,30}$/),
              fc.constant('@invalid-handle'),
              fc.constant('@user name'),
              // Null (should be accepted)
              fc.constant(null)
            )
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Check if twitter field should cause validation error
            const twitterShouldBeValid = org.twitter === null || 
              (org.twitter && /^@?[A-Za-z0-9_]{1,15}$/.test(org.twitter));
            
            const hasTwitterError = result.errors.some(e => 
              e.includes('twitter') && e.includes('invalid format')
            );
            
            if (twitterShouldBeValid) {
              assert.strictEqual(
                hasTwitterError,
                false,
                `Should not have twitter error for: ${org.twitter}`
              );
            } else {
              assert.strictEqual(
                hasTwitterError,
                true,
                `Should have twitter error for: ${org.twitter}`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 3.5** - should accept null Twitter field', () => {
      // Verify that null is explicitly accepted for optional Twitter field
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 }),
            twitter: fc.constant(null)
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should not have twitter validation error
            const hasTwitterError = result.errors.some(e => e.includes('twitter'));
            assert.strictEqual(
              hasTwitterError,
              false,
              'Null twitter field should be accepted'
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Property-Based Tests - URL Validation', () => {
  describe('Property 12: URL Format Validation', () => {
    it('**Validates: Requirements 5.1** - should reject invalid URLs', () => {
      // Generate random invalid URLs and verify validation fails
      fc.assert(
        fc.property(
          fc.oneof(
            // URLs without protocol
            fc.webUrl().map(url => url.replace(/^https?:\/\//, '')),
            // URLs without domain extension
            fc.constant('https://nodomain'),
            fc.constant('http://nodomain'),
            // Empty strings
            fc.constant(''),
            // Non-URL strings
            fc.string().filter(s => !s.includes('://') || !s.includes('.')),
            // Invalid protocols
            fc.oneof(
              fc.constant('ftp://example.com'),
              fc.constant('file://example.com'),
              fc.constant('ws://example.com')
            ),
            // Just domain without protocol
            fc.domain(),
            // Null and undefined (represented as special strings for testing)
            fc.constant('__NULL__'),
            fc.constant('__UNDEFINED__')
          ),
          (invalidUrl) => {
            // Handle special test values
            let testValue = invalidUrl;
            if (invalidUrl === '__NULL__') testValue = null;
            if (invalidUrl === '__UNDEFINED__') testValue = undefined;
            
            // Verify that invalid URLs fail validation
            const result = isValidURL(testValue);
            assert.strictEqual(
              result, 
              false, 
              `Expected URL to be invalid: ${JSON.stringify(testValue)}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.1** - should accept valid URLs', () => {
      // Generate random valid URLs and verify validation passes
      fc.assert(
        fc.property(
          fc.oneof(
            // Standard web URLs
            fc.webUrl(),
            // URLs with paths
            fc.webUrl().chain(url => 
              fc.array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 1, maxLength: 3 })
                .map(segments => `${url}/${segments.join('/')}`)
            ),
            // URLs with query parameters
            fc.webUrl().chain(url =>
              fc.record({
                key: fc.stringMatching(/^[a-z]+$/),
                value: fc.stringMatching(/^[a-z0-9]+$/)
              }).map(param => `${url}?${param.key}=${param.value}`)
            ),
            // URLs with ports
            fc.webUrl().chain(url => {
              const urlObj = new URL(url);
              return fc.integer({ min: 1000, max: 9999 })
                .map(port => `${urlObj.protocol}//${urlObj.hostname}:${port}${urlObj.pathname}`);
            }),
            // HTTP URLs (not just HTTPS)
            fc.webUrl().map(url => url.replace('https://', 'http://'))
          ),
          (validUrl) => {
            // Verify that valid URLs pass validation
            const result = isValidURL(validUrl);
            assert.strictEqual(
              result, 
              true, 
              `Expected URL to be valid: ${validUrl}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.1** - should fail validation for organisations with invalid URLs', () => {
      // Generate organisations with invalid URLs and verify validation fails
      fc.assert(
        fc.property(
          fc.record({
            name: fc.stringMatching(/^[a-zA-Z0-9\s\-&().,]{2,50}$/),
            website: fc.oneof(
              fc.constant('not-a-url'),
              fc.constant('example.com'),
              fc.constant('ftp://example.com'),
              fc.string({ minLength: 1 }).filter(s => !s.includes('://') || !s.includes('.'))
            ),
            country: fc.constant('United Arab Emirates'),
            categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 })
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should fail validation
            assert.strictEqual(result.valid, false);
            
            // Should have website error (either "required" or "invalid format")
            const hasWebsiteError = result.errors.some(e => 
              e.includes('website')
            );
            assert.strictEqual(
              hasWebsiteError, 
              true, 
              `Expected website validation error for: ${org.website}, errors: ${JSON.stringify(result.errors)}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.1** - should pass validation for organisations with valid URLs', () => {
      // Generate organisations with valid URLs and verify validation passes
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 })
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should pass validation (or fail for reasons other than website)
            const hasWebsiteError = result.errors.some(e => 
              e.includes('website') && e.includes('invalid format')
            );
            assert.strictEqual(
              hasWebsiteError, 
              false, 
              `Should not have website validation error for: ${org.website}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Property-Based Tests - Category Validation', () => {
  describe('Property 7: AI Category Validation', () => {
    it('**Validates: Requirements 4.1, 5.3** - should validate categories against allowed list', () => {
      // Generate random categories (valid and invalid) and verify only allowed categories pass validation
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid categories from TAXONOMY
            fc.constantFrom(...Object.keys(TAXONOMY)),
            // Invalid categories - random strings
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => !Object.keys(TAXONOMY).includes(s)),
            // Invalid categories - lowercase versions
            fc.constantFrom(...Object.keys(TAXONOMY)).map(c => c.toLowerCase()),
            // Invalid categories - partial matches
            fc.constantFrom(
              'NETWORKING',
              'COMMUNITY',
              'TALENT',
              'EDUCATION',
              'FUNDING',
              'FINANCE',
              'SUPPORT',
              'INFRASTRUCTURE',
              'GROWTH',
              'INNOVATION',
              'POLICY',
              'PUBLIC',
              'AGENCIES'
            ),
            // Invalid categories - typos
            fc.constantFrom(
              'NETWORKING & COMUNITY',
              'TALENT & EDUCATON',
              'FUNDING & FINACE',
              'SUPPORT INFRASTUCTURE',
              'GROWTH & INOVATION',
              'POLICY & PUBLIC AGENCES'
            ),
            // Invalid categories - empty and null-like
            fc.constant(''),
            fc.constant('__NULL__'),
            fc.constant('__UNDEFINED__')
          ),
          (category) => {
            // Handle special test values
            let testValue = category;
            if (category === '__NULL__') testValue = null;
            if (category === '__UNDEFINED__') testValue = undefined;
            
            // Determine if category should be valid
            const isExpectedValid = testValue && 
              typeof testValue === 'string' && 
              Object.keys(TAXONOMY).includes(testValue);
            
            // Test the validation function
            const result = isValidCategory(testValue);
            
            // Verify the result matches expectation
            if (isExpectedValid) {
              assert.strictEqual(
                result,
                true,
                `Expected category "${JSON.stringify(testValue)}" to be valid, got ${result}`
              );
            } else {
              assert.strictEqual(
                result,
                false,
                `Expected category "${JSON.stringify(testValue)}" to be invalid, got ${result}`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should accept only valid categories', () => {
      // Generate only valid categories and verify they pass validation
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(TAXONOMY)),
          (validCategory) => {
            const result = isValidCategory(validCategory);
            assert.strictEqual(
              result,
              true,
              `Expected valid category "${validCategory}" to pass validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should reject invalid categories', () => {
      // Generate only invalid categories and verify they fail validation
      fc.assert(
        fc.property(
          fc.oneof(
            // Random strings that are not valid categories
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => !Object.keys(TAXONOMY).includes(s)),
            // Lowercase versions
            fc.constantFrom(...Object.keys(TAXONOMY)).map(c => c.toLowerCase()),
            // Partial matches
            fc.constantFrom(
              'NETWORKING',
              'COMMUNITY',
              'TALENT',
              'EDUCATION',
              'FUNDING',
              'FINANCE'
            ),
            // Empty, null, undefined
            fc.constant(''),
            fc.constant('__NULL__'),
            fc.constant('__UNDEFINED__')
          ),
          (invalidCategory) => {
            // Handle special test values
            let testValue = invalidCategory;
            if (invalidCategory === '__NULL__') testValue = null;
            if (invalidCategory === '__UNDEFINED__') testValue = undefined;
            
            const result = isValidCategory(testValue);
            assert.strictEqual(
              result,
              false,
              `Expected invalid category "${JSON.stringify(testValue)}" to fail validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should validate categories in organisation objects', () => {
      // Generate organisations with various category values
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.oneof(
              // Valid: array with valid categories
              fc.array(fc.constantFrom(...Object.keys(TAXONOMY)), { minLength: 1, maxLength: 3 }),
              // Invalid: array with invalid categories
              fc.array(fc.string({ minLength: 1 }).filter(s => !Object.keys(TAXONOMY).includes(s)), { minLength: 1, maxLength: 2 }),
              // Invalid: array with mix of valid and invalid
              fc.tuple(
                fc.constantFrom(...Object.keys(TAXONOMY)),
                fc.string({ minLength: 1 }).filter(s => !Object.keys(TAXONOMY).includes(s))
              ).map(([valid, invalid]) => [valid, invalid]),
              // Invalid: empty array
              fc.constant([])
            ),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 })
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Check if categories should cause validation error
            const allCategoriesValid = Array.isArray(org.categories) && 
              org.categories.length > 0 &&
              org.categories.every(cat => Object.keys(TAXONOMY).includes(cat));
            
            const hasCategoryError = result.errors.some(e => 
              e.includes('categories') && (e.includes('invalid category') || e.includes('at least one'))
            );
            
            if (allCategoriesValid) {
              assert.strictEqual(
                hasCategoryError,
                false,
                `Should not have category error for: ${JSON.stringify(org.categories)}`
              );
            } else {
              assert.strictEqual(
                hasCategoryError,
                true,
                `Should have category error for: ${JSON.stringify(org.categories)}, errors: ${JSON.stringify(result.errors)}`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should reject organisations with invalid categories', () => {
      // Generate organisations with invalid categories and verify validation fails
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.oneof(
              // Invalid category strings
              fc.array(fc.string({ minLength: 1 }).filter(s => !Object.keys(TAXONOMY).includes(s)), { minLength: 1, maxLength: 2 }),
              // Empty array
              fc.constant([]),
              // Mix of valid and invalid
              fc.tuple(
                fc.constantFrom(...Object.keys(TAXONOMY)),
                fc.constant('INVALID CATEGORY')
              ).map(([valid, invalid]) => [valid, invalid])
            ),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 })
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should fail validation
            assert.strictEqual(result.valid, false);
            
            // Should have category error
            const hasCategoryError = result.errors.some(e => e.includes('categories'));
            assert.strictEqual(
              hasCategoryError,
              true,
              `Expected category validation error for: ${JSON.stringify(org.categories)}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should accept organisations with valid categories', () => {
      // Generate organisations with valid categories and verify validation passes
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
            website: fc.webUrl(),
            country: fc.constant('United Arab Emirates'),
            categories: fc.array(fc.constantFrom(...Object.keys(TAXONOMY)), { minLength: 1, maxLength: 3 }),
            subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
            roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 })
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should not have category validation error
            const hasCategoryError = result.errors.some(e => 
              e.includes('categories') && e.includes('invalid category')
            );
            assert.strictEqual(
              hasCategoryError,
              false,
              `Should not have category validation error for: ${JSON.stringify(org.categories)}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should handle all six allowed categories', () => {
      // Verify all six categories from TAXONOMY are accepted
      const expectedCategories = [
        'NETWORKING & COMMUNITY',
        'TALENT & EDUCATION',
        'FUNDING & FINANCE',
        'SUPPORT INFRASTRUCTURE',
        'GROWTH & INNOVATION',
        'POLICY & PUBLIC AGENCIES'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...expectedCategories),
          (category) => {
            const result = isValidCategory(category);
            assert.strictEqual(
              result,
              true,
              `Expected category "${category}" to be valid`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 5.3** - should be case-sensitive', () => {
      // Verify that category validation is case-sensitive
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(TAXONOMY)).chain(category =>
            fc.oneof(
              fc.constant(category.toLowerCase()),
              fc.constant(category.toUpperCase().toLowerCase()),
              fc.constant(category.charAt(0).toLowerCase() + category.slice(1))
            )
          ),
          (lowercaseCategory) => {
            // Lowercase versions should fail unless they happen to match exactly
            const result = isValidCategory(lowercaseCategory);
            const isExactMatch = Object.keys(TAXONOMY).includes(lowercaseCategory);
            
            assert.strictEqual(
              result,
              isExactMatch,
              `Expected lowercase category "${lowercaseCategory}" to ${isExactMatch ? 'pass' : 'fail'} validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Property-Based Tests - Validation Error Logging', () => {
  describe('Property 13: Validation Error Logging', () => {
    it('**Validates: Requirements 5.5** - should log specific field names and reasons for validation failures', () => {
      // Trigger validation failures and verify logs contain field names and reasons
      fc.assert(
        fc.property(
          fc.record({
            // Generate organisations with various validation failures
            name: fc.oneof(
              fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              fc.constant(''), // Invalid: empty name
              fc.constant('   '), // Invalid: whitespace only
              fc.constant(null), // Invalid: null name
              fc.constant(undefined) // Invalid: undefined name
            ),
            website: fc.oneof(
              fc.webUrl(), // Valid URL
              fc.constant('not-a-url'), // Invalid: no protocol
              fc.constant('example.com'), // Invalid: no protocol
              fc.constant('ftp://example.com'), // Invalid: wrong protocol
              fc.constant(''), // Invalid: empty
              fc.constant(null), // Invalid: null
              fc.constant(undefined) // Invalid: undefined
            ),
            country: fc.oneof(
              fc.constant('United Arab Emirates'), // Valid
              fc.constant(''), // Invalid: empty
              fc.constant('   '), // Invalid: whitespace only
              fc.constant(null), // Invalid: null
              fc.constant(undefined) // Invalid: undefined
            ),
            twitter: fc.oneof(
              fc.stringMatching(/^[A-Za-z0-9_]{1,15}$/).map(s => `@${s}`), // Valid
              fc.constant(null), // Valid: null is allowed
              fc.constant('@invalid-handle-with-dash'), // Invalid: contains dash
              fc.constant('@1234567890123456'), // Invalid: too long
              fc.constant('@user name'), // Invalid: contains space
              fc.constant('') // Invalid: empty string (should be null)
            ),
            categories: fc.oneof(
              fc.array(fc.constantFrom(...Object.keys(TAXONOMY)), { minLength: 1, maxLength: 2 }), // Valid
              fc.constant([]), // Invalid: empty array
              fc.array(fc.string({ minLength: 1 }).filter(s => !Object.keys(TAXONOMY).includes(s)), { minLength: 1, maxLength: 2 }), // Invalid: invalid categories
              fc.constant('not-an-array'), // Invalid: not an array
              fc.constant(null), // Invalid: null
              fc.constant(undefined) // Invalid: undefined
            ),
            subcategories: fc.oneof(
              fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]), // Valid
              fc.constant([]), // Invalid: empty array
              fc.array(fc.string({ minLength: 1 }).filter(s => !Object.values(TAXONOMY).flat().includes(s)), { minLength: 1, maxLength: 2 }), // Invalid: invalid subcategories
              fc.constant('not-an-array'), // Invalid: not an array
              fc.constant(null), // Invalid: null
              fc.constant(undefined) // Invalid: undefined
            ),
            roles: fc.oneof(
              fc.array(fc.string({ minLength: 5 }), { minLength: 1, maxLength: 2 }), // Valid
              fc.constant([]), // Invalid: empty array
              fc.constant('not-an-array'), // Invalid: not an array
              fc.constant(null), // Invalid: null
              fc.constant(undefined) // Invalid: undefined
            )
          }),
          (org) => {
            // Validate the organisation
            const result = validateOrganisation(org);
            
            // If validation failed, verify error messages contain field names and reasons
            if (!result.valid) {
              assert.ok(result.errors.length > 0, 'Should have at least one error');
              
              // Check each error message
              for (const error of result.errors) {
                // Error should be a non-empty string
                assert.ok(typeof error === 'string', 'Error should be a string');
                assert.ok(error.length > 0, 'Error should not be empty');
                
                // Error should contain a field name (one of the known fields)
                const knownFields = ['name', 'website', 'country', 'twitter', 'categories', 'subcategories', 'roles', 'Organisation'];
                const containsFieldName = knownFields.some(field => error.includes(field));
                assert.ok(
                  containsFieldName,
                  `Error message should contain a field name: "${error}"`
                );
                
                // Error should contain a reason (descriptive text about what's wrong)
                // Common reason keywords: required, invalid, format, array, empty, must
                const reasonKeywords = ['required', 'invalid', 'format', 'array', 'empty', 'must', 'contains', 'at least'];
                const containsReason = reasonKeywords.some(keyword => error.toLowerCase().includes(keyword));
                assert.ok(
                  containsReason,
                  `Error message should contain a reason: "${error}"`
                );
              }
              
              // Verify specific field errors are logged correctly
              
              // Name errors
              if (!org.name || typeof org.name !== 'string' || org.name.trim().length === 0) {
                const hasNameError = result.errors.some(e => e.includes('name'));
                assert.ok(hasNameError, 'Should have name error when name is invalid');
              }
              
              // Website errors
              if (!org.website) {
                const hasWebsiteError = result.errors.some(e => e.includes('website') && e.includes('required'));
                assert.ok(hasWebsiteError, 'Should have website required error');
              } else if (typeof org.website === 'string' && !/^https?:\/\/.+\..+/.test(org.website)) {
                const hasWebsiteError = result.errors.some(e => e.includes('website') && e.includes('invalid format'));
                assert.ok(hasWebsiteError, 'Should have website format error');
              }
              
              // Country errors
              if (!org.country || typeof org.country !== 'string' || org.country.trim().length === 0) {
                const hasCountryError = result.errors.some(e => e.includes('country') && e.includes('required'));
                assert.ok(hasCountryError, 'Should have country error when country is invalid');
              }
              
              // Twitter errors (only if not null/undefined)
              if (org.twitter !== null && org.twitter !== undefined) {
                if (typeof org.twitter === 'string' && org.twitter !== '' && !/^@?[A-Za-z0-9_]{1,15}$/.test(org.twitter)) {
                  const hasTwitterError = result.errors.some(e => e.includes('twitter') && e.includes('invalid format'));
                  assert.ok(hasTwitterError, `Should have twitter format error for: ${org.twitter}`);
                }
              }
              
              // Categories errors
              if (!Array.isArray(org.categories)) {
                const hasCategoriesError = result.errors.some(e => e.includes('categories') && e.includes('must be an array'));
                assert.ok(hasCategoriesError, 'Should have categories array error');
              } else if (org.categories.length === 0) {
                const hasCategoriesError = result.errors.some(e => e.includes('categories') && e.includes('at least one'));
                assert.ok(hasCategoriesError, 'Should have categories empty error');
              } else {
                // Check for invalid category items
                const invalidCategories = org.categories.filter(cat => !Object.keys(TAXONOMY).includes(cat));
                if (invalidCategories.length > 0) {
                  for (const invalidCat of invalidCategories) {
                    const hasCategoryError = result.errors.some(e => 
                      e.includes('categories') && 
                      e.includes('invalid category') && 
                      e.includes(invalidCat)
                    );
                    assert.ok(hasCategoryError, `Should have error for invalid category: ${invalidCat}`);
                  }
                }
              }
              
              // Subcategories errors
              if (!Array.isArray(org.subcategories)) {
                const hasSubcategoriesError = result.errors.some(e => e.includes('subcategories') && e.includes('must be an array'));
                assert.ok(hasSubcategoriesError, 'Should have subcategories array error');
              } else if (org.subcategories.length === 0) {
                const hasSubcategoriesError = result.errors.some(e => e.includes('subcategories') && e.includes('at least one'));
                assert.ok(hasSubcategoriesError, 'Should have subcategories empty error');
              } else {
                // Check for invalid subcategory items
                const allValidSubcategories = Object.values(TAXONOMY).flat();
                const invalidSubcategories = org.subcategories.filter(sub => !allValidSubcategories.includes(sub));
                if (invalidSubcategories.length > 0) {
                  for (const invalidSub of invalidSubcategories) {
                    const hasSubcategoryError = result.errors.some(e => 
                      e.includes('subcategories') && 
                      e.includes('invalid subcategory') && 
                      e.includes(invalidSub)
                    );
                    assert.ok(hasSubcategoryError, `Should have error for invalid subcategory: ${invalidSub}`);
                  }
                }
              }
              
              // Roles errors
              if (!Array.isArray(org.roles)) {
                const hasRolesError = result.errors.some(e => e.includes('roles') && e.includes('must be an array'));
                assert.ok(hasRolesError, 'Should have roles array error');
              } else if (org.roles.length === 0) {
                const hasRolesError = result.errors.some(e => e.includes('roles') && e.includes('at least one'));
                assert.ok(hasRolesError, 'Should have roles empty error');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.5** - should log field name for each validation failure', () => {
      // Test that each type of validation failure includes the field name
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid name
            fc.record({
              name: fc.constant(''),
              website: fc.webUrl(),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 })
            }),
            // Invalid website
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.constant('not-a-url'),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 })
            }),
            // Invalid country
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.webUrl(),
              country: fc.constant(''),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 })
            }),
            // Invalid twitter
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.webUrl(),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 }),
              twitter: fc.constant('@invalid-handle-with-dash')
            }),
            // Invalid categories
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.webUrl(),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constant([]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 })
            }),
            // Invalid subcategories
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.webUrl(),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constant([]),
              roles: fc.array(fc.string({ minLength: 5 }), { minLength: 1 })
            }),
            // Invalid roles
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-&().,]+$/.test(s)),
              website: fc.webUrl(),
              country: fc.constant('United Arab Emirates'),
              categories: fc.constantFrom(...Object.keys(TAXONOMY)).map(c => [c]),
              subcategories: fc.constantFrom(...Object.values(TAXONOMY).flat()).map(s => [s]),
              roles: fc.constant([])
            })
          ),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should fail validation
            assert.strictEqual(result.valid, false, 'Validation should fail');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
            
            // Each error should contain a field name
            for (const error of result.errors) {
              const knownFields = ['name', 'website', 'country', 'twitter', 'categories', 'subcategories', 'roles'];
              const containsFieldName = knownFields.some(field => error.includes(field));
              assert.ok(
                containsFieldName,
                `Error "${error}" should contain a field name`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.5** - should log specific reason for each validation failure', () => {
      // Test that each type of validation failure includes a specific reason
      fc.assert(
        fc.property(
          fc.record({
            name: fc.oneof(
              fc.constant(''), // Empty name
              fc.constant('   ') // Whitespace only
            ),
            website: fc.oneof(
              fc.constant('not-a-url'), // Invalid format
              fc.constant('example.com'), // Missing protocol
              fc.constant('') // Empty/required
            ),
            country: fc.oneof(
              fc.constant(''), // Empty
              fc.constant('   ') // Whitespace only
            ),
            twitter: fc.oneof(
              fc.constant('@invalid-handle-with-dash'), // Invalid format (dash)
              fc.constant('@1234567890123456'), // Too long
              fc.constant('@user name') // Contains space
            ),
            categories: fc.oneof(
              fc.constant([]), // Empty array
              fc.constant(['INVALID CATEGORY']), // Invalid category
              fc.constant('not-an-array') // Not an array
            ),
            subcategories: fc.oneof(
              fc.constant([]), // Empty array
              fc.constant(['Invalid Subcategory']), // Invalid subcategory
              fc.constant('not-an-array') // Not an array
            ),
            roles: fc.oneof(
              fc.constant([]), // Empty array
              fc.constant('not-an-array') // Not an array
            )
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should fail validation
            assert.strictEqual(result.valid, false, 'Validation should fail');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
            
            // Each error should contain a specific reason
            for (const error of result.errors) {
              // Should contain descriptive reason keywords
              const reasonKeywords = [
                'required',
                'invalid',
                'format',
                'array',
                'empty',
                'must',
                'contains',
                'at least',
                'non-empty'
              ];
              
              const containsReason = reasonKeywords.some(keyword => 
                error.toLowerCase().includes(keyword)
              );
              
              assert.ok(
                containsReason,
                `Error "${error}" should contain a descriptive reason`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.5** - should log multiple errors when multiple fields are invalid', () => {
      // Test that all validation failures are logged, not just the first one
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constant(''), // Invalid
            website: fc.constant('not-a-url'), // Invalid
            country: fc.constant(''), // Invalid
            categories: fc.constant([]), // Invalid
            subcategories: fc.constant([]), // Invalid
            roles: fc.constant([]) // Invalid
          }),
          (org) => {
            const result = validateOrganisation(org);
            
            // Should fail validation
            assert.strictEqual(result.valid, false, 'Validation should fail');
            
            // Should have multiple errors (at least 6 for the 6 invalid fields)
            assert.ok(result.errors.length >= 6, `Should have at least 6 errors, got ${result.errors.length}`);
            
            // Should have error for each invalid field
            assert.ok(result.errors.some(e => e.includes('name')), 'Should have name error');
            assert.ok(result.errors.some(e => e.includes('website')), 'Should have website error');
            assert.ok(result.errors.some(e => e.includes('country')), 'Should have country error');
            assert.ok(result.errors.some(e => e.includes('categories')), 'Should have categories error');
            assert.ok(result.errors.some(e => e.includes('subcategories')), 'Should have subcategories error');
            assert.ok(result.errors.some(e => e.includes('roles')), 'Should have roles error');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Validator - Review Queue Mechanism', () => {
  // Clear review queue before each test
  it('should start with empty review queue', () => {
    clearReviewQueue();
    const queue = getReviewQueue();
    assert.strictEqual(queue.length, 0);
  });

  describe('addToReviewQueue', () => {
    it('should add organisation to review queue with errors', () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const errors = ['website has invalid format'];
      
      addToReviewQueue(org, errors);
      
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 1);
      assert.deepStrictEqual(queue[0].organisation, org);
      assert.deepStrictEqual(queue[0].errors, errors);
      assert.strictEqual(queue[0].status, 'pending_review');
      assert.ok(queue[0].timestamp instanceof Date);
    });

    it('should add multiple organisations to review queue', () => {
      clearReviewQueue();
      
      const org1 = {
        name: 'Org 1',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Role 1']
      };
      
      const org2 = {
        name: 'Org 2',
        website: 'https://example.com',
        country: '',
        categories: [],
        subcategories: [],
        roles: []
      };
      
      addToReviewQueue(org1, ['website has invalid format']);
      addToReviewQueue(org2, ['country is required', 'categories must contain at least one category']);
      
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 2);
      assert.strictEqual(queue[0].organisation.name, 'Org 1');
      assert.strictEqual(queue[1].organisation.name, 'Org 2');
    });

    it('should include timestamp for each review queue item', () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const beforeTime = new Date();
      addToReviewQueue(org, ['website has invalid format']);
      const afterTime = new Date();
      
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 1);
      assert.ok(queue[0].timestamp >= beforeTime);
      assert.ok(queue[0].timestamp <= afterTime);
    });

    it('should set status to pending_review', () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      addToReviewQueue(org, ['website has invalid format']);
      
      const queue = getReviewQueue();
      assert.strictEqual(queue[0].status, 'pending_review');
    });
  });

  describe('getReviewQueue', () => {
    it('should return empty array when queue is empty', () => {
      clearReviewQueue();
      const queue = getReviewQueue();
      assert.ok(Array.isArray(queue));
      assert.strictEqual(queue.length, 0);
    });

    it('should return all items in review queue', () => {
      clearReviewQueue();
      
      const org1 = { name: 'Org 1', website: 'invalid' };
      const org2 = { name: 'Org 2', website: 'invalid' };
      
      addToReviewQueue(org1, ['error 1']);
      addToReviewQueue(org2, ['error 2']);
      
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 2);
    });
  });

  describe('clearReviewQueue', () => {
    it('should clear all items from review queue', () => {
      clearReviewQueue();
      
      const org = { name: 'Test Org', website: 'invalid' };
      addToReviewQueue(org, ['error']);
      
      assert.strictEqual(getReviewQueue().length, 1);
      
      clearReviewQueue();
      
      assert.strictEqual(getReviewQueue().length, 0);
    });

    it('should allow adding items after clearing', () => {
      clearReviewQueue();
      
      const org1 = { name: 'Org 1', website: 'invalid' };
      addToReviewQueue(org1, ['error 1']);
      
      clearReviewQueue();
      
      const org2 = { name: 'Org 2', website: 'invalid' };
      addToReviewQueue(org2, ['error 2']);
      
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 1);
      assert.strictEqual(queue[0].organisation.name, 'Org 2');
    });
  });

  describe('saveReviewQueue', () => {
    it('should return null when queue is empty', async () => {
      clearReviewQueue();
      const result = await saveReviewQueue();
      assert.strictEqual(result, null);
    });

    it('should save review queue to JSON file when queue has items', async () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      addToReviewQueue(org, ['website has invalid format']);
      
      const filepath = await saveReviewQueue();
      
      // Should return a filepath
      assert.ok(filepath);
      assert.ok(filepath.includes('review_queue_'));
      assert.ok(filepath.endsWith('.json'));
      
      // Verify file exists and contains correct data
      const fs = await import('fs');
      assert.ok(fs.existsSync(filepath));
      
      const fileContent = fs.readFileSync(filepath, 'utf-8');
      const savedQueue = JSON.parse(fileContent);
      
      assert.strictEqual(savedQueue.length, 1);
      assert.strictEqual(savedQueue[0].organisation.name, 'Test Organisation');
      assert.deepStrictEqual(savedQueue[0].errors, ['website has invalid format']);
      assert.strictEqual(savedQueue[0].status, 'pending_review');
      
      // Clean up test file
      fs.unlinkSync(filepath);
    });

    it('should save multiple items to review queue file', async () => {
      clearReviewQueue();
      
      const org1 = {
        name: 'Org 1',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Role 1']
      };
      
      const org2 = {
        name: 'Org 2',
        website: 'https://example.com',
        country: '',
        categories: [],
        subcategories: [],
        roles: []
      };
      
      addToReviewQueue(org1, ['website has invalid format']);
      addToReviewQueue(org2, ['country is required', 'categories must contain at least one category']);
      
      const filepath = await saveReviewQueue();
      
      // Verify file contains both items
      const fs = await import('fs');
      const fileContent = fs.readFileSync(filepath, 'utf-8');
      const savedQueue = JSON.parse(fileContent);
      
      assert.strictEqual(savedQueue.length, 2);
      assert.strictEqual(savedQueue[0].organisation.name, 'Org 1');
      assert.strictEqual(savedQueue[1].organisation.name, 'Org 2');
      
      // Clean up test file
      fs.unlinkSync(filepath);
    });

    it('should create unique filenames based on timestamp', async () => {
      clearReviewQueue();
      
      const org = { name: 'Test Org', website: 'invalid' };
      addToReviewQueue(org, ['error']);
      
      const filepath1 = await saveReviewQueue();
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      clearReviewQueue();
      addToReviewQueue(org, ['error']);
      
      const filepath2 = await saveReviewQueue();
      
      // Filenames should be different
      assert.notStrictEqual(filepath1, filepath2);
      
      // Clean up test files
      const fs = await import('fs');
      fs.unlinkSync(filepath1);
      fs.unlinkSync(filepath2);
    });
  });

  describe('Integration with validateOrganisation', () => {
    it('should add failed validation to review queue', () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'invalid-url',
        country: 'United Arab Emirates',
        categories: ['INVALID CATEGORY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      
      // Validation should fail
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
      
      // Add to review queue
      if (!result.valid) {
        addToReviewQueue(org, result.errors);
      }
      
      // Verify it's in the queue
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 1);
      assert.deepStrictEqual(queue[0].organisation, org);
      assert.deepStrictEqual(queue[0].errors, result.errors);
    });

    it('should not add successful validation to review queue', () => {
      clearReviewQueue();
      
      const org = {
        name: 'Test Organisation',
        website: 'https://example.com',
        country: 'United Arab Emirates',
        categories: ['NETWORKING & COMMUNITY'],
        subcategories: ['General Business Community & Membership'],
        roles: ['Test role']
      };
      
      const result = validateOrganisation(org);
      
      // Validation should pass
      assert.strictEqual(result.valid, true);
      
      // Should not add to review queue
      if (!result.valid) {
        addToReviewQueue(org, result.errors);
      }
      
      // Queue should be empty
      const queue = getReviewQueue();
      assert.strictEqual(queue.length, 0);
    });
  });
});
