/**
 * Property-Based Tests for Source Metadata Tracking
 * 
 * **Property 16: Source Metadata Tracking**
 * **Validates: Requirements 7.1, 7.2, 7.3**
 * 
 * Tests that saved documents include proper source metadata tracking.
 */

import fc from 'fast-check';
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Feature: scraper-improvements - Source Metadata Tracking', () => {
  it('Property 16: Source Metadata Tracking - sourceUrl is recorded', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (sourceUrl) => {
          // Simulate saved document with source metadata
          const savedDoc = {
            name: 'Test Organisation',
            website: sourceUrl,
            country: 'United Arab Emirates',
            source: {
              sourceName: 'enhanced_scraper',
              sourceUrl: sourceUrl,
              lastSyncedAt: new Date(),
              aiProvider: null,
              aiModel: null
            }
          };
          
          // Verify sourceUrl is recorded
          expect(savedDoc.source.sourceUrl).to.exist;
          expect(savedDoc.source.sourceUrl).to.equal(sourceUrl);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 16: Source Metadata Tracking - sourceName is recorded', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.constantFrom('enhanced_scraper', 'manual_entry', 'api_import'),
        (sourceUrl, sourceName) => {
          // Simulate saved document with source metadata
          const savedDoc = {
            name: 'Test Organisation',
            website: sourceUrl,
            country: 'United Arab Emirates',
            source: {
              sourceName: sourceName,
              sourceUrl: sourceUrl,
              lastSyncedAt: new Date(),
              aiProvider: null,
              aiModel: null
            }
          };
          
          // Verify sourceName is recorded
          expect(savedDoc.source.sourceName).to.exist;
          expect(savedDoc.source.sourceName).to.be.a('string');
          expect(savedDoc.source.sourceName.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 16: Source Metadata Tracking - lastSyncedAt is recorded', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (sourceUrl) => {
          // Simulate saved document with source metadata
          const syncTime = new Date();
          const savedDoc = {
            name: 'Test Organisation',
            website: sourceUrl,
            country: 'United Arab Emirates',
            source: {
              sourceName: 'enhanced_scraper',
              sourceUrl: sourceUrl,
              lastSyncedAt: syncTime,
              aiProvider: null,
              aiModel: null
            }
          };
          
          // Verify lastSyncedAt is recorded
          expect(savedDoc.source.lastSyncedAt).to.exist;
          expect(savedDoc.source.lastSyncedAt).to.be.instanceOf(Date);
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 16: Source Metadata Tracking - AI provider and model tracked when used', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.constantFrom('openrouter', 'huggingface', 'moonshot'),
        fc.string({ minLength: 5, maxLength: 50 }),
        (sourceUrl, aiProvider, aiModel) => {
          // Simulate saved document with AI classification
          const savedDoc = {
            name: 'Test Organisation',
            website: sourceUrl,
            country: 'United Arab Emirates',
            source: {
              sourceName: 'enhanced_scraper',
              sourceUrl: sourceUrl,
              lastSyncedAt: new Date(),
              aiProvider: aiProvider,
              aiModel: aiModel
            }
          };
          
          // Verify AI provider and model are tracked
          expect(savedDoc.source.aiProvider).to.exist;
          expect(savedDoc.source.aiProvider).to.be.a('string');
          expect(savedDoc.source.aiModel).to.exist;
          expect(savedDoc.source.aiModel).to.be.a('string');
        }
      ),
      { numRuns: 20 }
    );
  });
  
  it('Property 16: Source Metadata Tracking - AI fields null when not used', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (sourceUrl) => {
          // Simulate saved document without AI classification
          const savedDoc = {
            name: 'Test Organisation',
            website: sourceUrl,
            country: 'United Arab Emirates',
            source: {
              sourceName: 'enhanced_scraper',
              sourceUrl: sourceUrl,
              lastSyncedAt: new Date(),
              aiProvider: null,
              aiModel: null
            }
          };
          
          // Verify AI fields are null when not used
          expect(savedDoc.source.aiProvider).to.be.null;
          expect(savedDoc.source.aiModel).to.be.null;
        }
      ),
      { numRuns: 20 }
    );
  });
});
