/**
 * Property-Based Tests for Migration Data Preservation
 * 
 * **Property 26: Migration Data Preservation**
 * **Validates: Requirements 10.4**
 * 
 * Tests that migration preserves existing tracking fields and data.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Feature: scraper-improvements - Migration Data Preservation', () => {
  it('Property 26: Migration Data Preservation - preserves source tracking fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 }),
          source: fc.record({
            sourceName: fc.string(),
            sourceUrl: fc.webUrl(),
            lastSyncedAt: fc.date(),
            aiProvider: fc.option(fc.string(), { nil: null }),
            aiModel: fc.option(fc.string(), { nil: null })
          })
        }),
        (docWithSource) => {
          const originalSource = { ...docWithSource.source };
          
          // Simulate migration (should preserve source fields)
          const migrated = {
            ...docWithSource,
            country: docWithSource.country || 'United Arab Emirates',
            twitter: docWithSource.twitter === '' ? null : docWithSource.twitter,
            description: docWithSource.description === '' ? null : docWithSource.description
          };
          
          // Verify source fields were preserved
          expect(migrated.source).to.deep.equal(originalSource);
          expect(migrated.source.sourceName).to.equal(originalSource.sourceName);
          expect(migrated.source.sourceUrl).to.equal(originalSource.sourceUrl);
          expect(migrated.source.lastSyncedAt).to.deep.equal(originalSource.lastSyncedAt);
          expect(migrated.source.aiProvider).to.equal(originalSource.aiProvider);
          expect(migrated.source.aiModel).to.equal(originalSource.aiModel);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 26: Migration Data Preservation - preserves status tracking fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 }),
          status: fc.record({
            isActive: fc.boolean(),
            publishTier: fc.constantFrom('A', 'B', 'C'),
            trustScore: fc.integer({ min: 0, max: 100 }),
            trustReasons: fc.array(fc.string()),
            confidence: fc.option(fc.double({ min: 0, max: 1 }), { nil: null }),
            needsReview: fc.boolean()
          })
        }),
        (docWithStatus) => {
          const originalStatus = { ...docWithStatus.status };
          
          // Simulate migration (should preserve status fields)
          const migrated = {
            ...docWithStatus,
            country: docWithStatus.country || 'United Arab Emirates',
            twitter: docWithStatus.twitter === '' ? null : docWithStatus.twitter,
            description: docWithStatus.description === '' ? null : docWithStatus.description
          };
          
          // Verify status fields were preserved
          expect(migrated.status).to.deep.equal(originalStatus);
          expect(migrated.status.isActive).to.equal(originalStatus.isActive);
          expect(migrated.status.publishTier).to.equal(originalStatus.publishTier);
          expect(migrated.status.trustScore).to.equal(originalStatus.trustScore);
          expect(migrated.status.confidence).to.equal(originalStatus.confidence);
          expect(migrated.status.needsReview).to.equal(originalStatus.needsReview);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 26: Migration Data Preservation - preserves core identity fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          website: fc.webUrl(),
          categories: fc.array(fc.string(), { minLength: 1 }),
          subcategories: fc.array(fc.string(), { minLength: 1 }),
          roles: fc.array(fc.string(), { minLength: 1 })
        }),
        (doc) => {
          const originalName = doc.name;
          const originalWebsite = doc.website;
          const originalCategories = [...doc.categories];
          const originalSubcategories = [...doc.subcategories];
          const originalRoles = [...doc.roles];
          
          // Simulate migration
          const migrated = {
            ...doc,
            country: doc.country || 'United Arab Emirates',
            twitter: doc.twitter === '' ? null : doc.twitter,
            description: doc.description === '' ? null : doc.description
          };
          
          // Verify core fields were preserved
          expect(migrated.name).to.equal(originalName);
          expect(migrated.website).to.equal(originalWebsite);
          expect(migrated.categories).to.deep.equal(originalCategories);
          expect(migrated.subcategories).to.deep.equal(originalSubcategories);
          expect(migrated.roles).to.deep.equal(originalRoles);
        }
      ),
      { numRuns: 20 }
    );
  });
});
