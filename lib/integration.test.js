/**
 * Integration Tests for End-to-End Flow
 * 
 * Tests the complete scraping, classification, validation, and save flow.
 * Requirements: Full integration testing
 */

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { chromium } from 'playwright';

describe('Feature: scraper-improvements - End-to-End Integration', () => {
  let browser;
  let page;
  
  before(async function() {
    this.timeout(30000);
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });
  
  after(async function() {
    if (page) await page.close();
    if (browser) await browser.close();
  });
  
  it('Integration: Full scraping flow with mock page', async function() {
    this.timeout(10000);
    
    // Create a mock HTML page with organisation data
    const mockHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Organisation | UAE Startup</title>
          <meta name="description" content="A leading startup incubator in Dubai providing support to entrepreneurs">
          <meta property="og:title" content="Test Organisation">
          <meta property="og:description" content="A leading startup incubator in Dubai">
        </head>
        <body>
          <h1>Test Organisation</h1>
          <p>A leading startup incubator in Dubai providing support to entrepreneurs and startups.</p>
          <footer>
            <a href="https://twitter.com/testorg">Twitter</a>
            <a href="https://linkedin.com/company/testorg">LinkedIn</a>
          </footer>
        </body>
      </html>
    `;
    
    // Set page content
    await page.setContent(mockHTML);
    
    // Import scraper functions
    const { extractName, extractDescription, extractTwitter } = await import('./enhanced-scraper.js');
    
    // Test extraction
    const name = await extractName(page);
    const description = await extractDescription(page);
    const twitter = await extractTwitter(page);
    
    // Verify extraction results
    expect(name).to.exist;
    expect(name).to.include('Test Organisation');
    
    expect(description).to.exist;
    expect(description.length).to.be.greaterThan(20);
    
    expect(twitter).to.exist;
    expect(twitter).to.equal('@testorg');
  });
  
  it('Integration: Multi-provider AI fallback simulation', async function() {
    this.timeout(5000);
    
    // Import AI classifier
    const { createDefaultClassification } = await import('./multi-provider-classifier.js');
    
    // Simulate all providers failing - should get default classification
    const orgData = {
      name: 'Test Organisation',
      website: 'https://test.org',
      description: 'A test organisation'
    };
    
    const defaultClassification = createDefaultClassification(orgData);
    
    // Verify graceful degradation
    expect(defaultClassification).to.exist;
    expect(defaultClassification.degraded).to.be.true;
    expect(defaultClassification.needsReview).to.be.true;
    expect(defaultClassification.confidence).to.equal(0.0);
    expect(defaultClassification.provider).to.be.null;
    expect(defaultClassification.model).to.be.null;
  });
  
  it('Integration: Validation and review queue', async function() {
    // Import validator
    const { validateOrganisation, addToReviewQueue, getReviewQueue, clearReviewQueue } = await import('./validator.js');
    
    // Clear review queue
    clearReviewQueue();
    
    // Test valid organisation
    const validOrg = {
      name: 'Valid Organisation',
      website: 'https://valid.org',
      country: 'United Arab Emirates',
      categories: ['GROWTH & INNOVATION'],
      subcategories: ['General Entity'],
      roles: ['Test role for validation'],
      twitter: '@validorg',
      description: 'A valid organisation for testing'
    };
    
    const validResult = validateOrganisation(validOrg);
    expect(validResult.valid).to.be.true;
    expect(validResult.errors).to.be.empty;
    
    // Test invalid organisation (missing required field)
    const invalidOrg = {
      name: 'Invalid Organisation',
      // Missing website
      country: 'United Arab Emirates',
      categories: ['GROWTH & INNOVATION'],
      subcategories: ['General Entity'],
      roles: ['Test role']
    };
    
    const invalidResult = validateOrganisation(invalidOrg);
    expect(invalidResult.valid).to.be.false;
    expect(invalidResult.errors.length).to.be.greaterThan(0);
    
    // Add to review queue
    addToReviewQueue(invalidOrg, invalidResult.errors);
    
    // Verify review queue
    const queue = getReviewQueue();
    expect(queue.length).to.equal(1);
    expect(queue[0].organisation.name).to.equal('Invalid Organisation');
    expect(queue[0].errors).to.deep.equal(invalidResult.errors);
    expect(queue[0].status).to.equal('pending_review');
    
    // Clean up
    clearReviewQueue();
  });
  
  it('Integration: Error handling and recovery', async function() {
    this.timeout(10000);
    
    // Import error handling
    const { ErrorSummary } = await import('./enhanced-scraper.js');
    
    const errorSummary = new ErrorSummary();
    
    // Simulate various errors
    errorSummary.addPageLoadError('https://failed.com', 'Timeout after 3 retries');
    errorSummary.addHttpError('https://forbidden.com', 403, 'Forbidden');
    errorSummary.addExtractionWarning('https://nodata.com', 'twitter', 'No Twitter link found');
    
    // Verify error tracking
    const summary = errorSummary.getSummary();
    expect(summary.pageLoadErrors.length).to.equal(1);
    expect(summary.httpErrors.length).to.equal(1);
    expect(summary.extractionWarnings.length).to.equal(1);
    expect(summary.totalErrors).to.equal(2);
    expect(summary.totalWarnings).to.equal(1);
  });
  
  it('Integration: Null handling throughout pipeline', async function() {
    // Test that null values are preserved throughout the pipeline
    
    const orgData = {
      name: 'Test Organisation',
      website: 'https://test.org',
      country: 'United Arab Emirates',
      categories: ['GROWTH & INNOVATION'],
      subcategories: ['General Entity'],
      roles: ['Test role'],
      twitter: null,  // Explicitly null
      description: null  // Explicitly null
    };
    
    // Import validator
    const { validateOrganisation } = await import('./validator.js');
    
    // Validate (should pass with null values)
    const result = validateOrganisation(orgData);
    expect(result.valid).to.be.true;
    
    // Verify null values are preserved
    expect(orgData.twitter).to.be.null;
    expect(orgData.twitter).to.not.equal('');
    expect(orgData.twitter).to.not.be.undefined;
    
    expect(orgData.description).to.be.null;
    expect(orgData.description).to.not.equal('');
    expect(orgData.description).to.not.be.undefined;
  });
});
