/**
 * Unit Tests for Enhanced Scraper
 * Tests multi-strategy extraction functions
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { chromium } from 'playwright';
import {
  extractName,
  extractDescription,
  extractTwitter,
  extractStructuredData,
  scrapeOrganisation
} from './enhanced-scraper.js';

// Helper function to create a page with HTML content
async function createPageWithHTML(browser, html) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent(html);
  return { page, context };
}

describe('Enhanced Scraper - extractName', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should extract name from og:title meta tag', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Example Organization" />
          <title>Example Organization | Home</title>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Organization');
    await context.close();
  });

  it('should extract name from title tag when og:title is missing', async () => {
    const html = `
      <html>
        <head>
          <title>Example Organization | Home</title>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Organization');
    await context.close();
  });

  it('should clean title by removing content after pipe separator', async () => {
    const html = `
      <html>
        <head>
          <title>Example Org | Welcome to our site</title>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Org');
    await context.close();
  });

  it('should clean title by removing content after dash separator', async () => {
    const html = `
      <html>
        <head>
          <title>Example Org - Home Page</title>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Org');
    await context.close();
  });

  it('should extract name from h1 when title is missing', async () => {
    const html = `
      <html>
        <head></head>
        <body>
          <h1>Example Organization</h1>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Organization');
    await context.close();
  });

  it('should extract name from JSON-LD when other methods fail', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example Organization from JSON-LD"
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, 'Example Organization from JSON-LD');
    await context.close();
  });

  it('should return null when no name can be extracted', async () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const name = await extractName(page);
    assert.strictEqual(name, null);
    await context.close();
  });
});

describe('Enhanced Scraper - extractDescription', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should extract description from meta description tag', async () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="This is a test organization providing services." />
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is a test organization providing services.');
    await context.close();
  });

  it('should extract description from og:description when meta description is missing', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:description" content="This is from Open Graph description tag." />
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is from Open Graph description tag.');
    await context.close();
  });

  it('should extract description from first paragraph when meta tags are missing', async () => {
    const html = `
      <html>
        <head></head>
        <body>
          <p>This is a substantial paragraph with enough content to be considered a description.</p>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is a substantial paragraph with enough content to be considered a description.');
    await context.close();
  });

  it('should skip short paragraphs (less than 20 chars)', async () => {
    const html = `
      <html>
        <head></head>
        <body>
          <p>Short</p>
          <p>This is a longer paragraph that should be extracted as the description.</p>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is a longer paragraph that should be extracted as the description.');
    await context.close();
  });

  it('should extract description from JSON-LD when other methods fail', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example Org",
            "description": "This is a description from JSON-LD structured data."
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is a description from JSON-LD structured data.');
    await context.close();
  });

  it('should return null when no description can be extracted', async () => {
    const html = `
      <html>
        <head></head>
        <body><p>Short</p></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, null);
    await context.close();
  });

  it('should reject meta description if too short (less than 20 chars)', async () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="Too short" />
          <meta property="og:description" content="This is a longer description from Open Graph." />
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const description = await extractDescription(page);
    assert.strictEqual(description, 'This is a longer description from Open Graph.');
    await context.close();
  });
});

describe('Enhanced Scraper - extractTwitter', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should extract Twitter handle from twitter.com link', async () => {
    const html = `
      <html>
        <body>
          <a href="https://twitter.com/exampleorg">Follow us on Twitter</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@exampleorg');
    await context.close();
  });

  it('should extract Twitter handle from x.com link', async () => {
    const html = `
      <html>
        <body>
          <a href="https://x.com/exampleorg">Follow us on X</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@exampleorg');
    await context.close();
  });

  it('should extract Twitter handle from link with trailing slash', async () => {
    const html = `
      <html>
        <body>
          <a href="https://twitter.com/exampleorg/">Twitter</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@exampleorg');
    await context.close();
  });

  it('should extract Twitter handle from social media section', async () => {
    const html = `
      <html>
        <body>
          <div class="footer-social">
            <a href="https://twitter.com/exampleorg">Twitter</a>
          </div>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@exampleorg');
    await context.close();
  });

  it('should extract Twitter handle from JSON-LD sameAs array', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example Org",
            "sameAs": [
              "https://facebook.com/exampleorg",
              "https://twitter.com/exampleorg",
              "https://linkedin.com/company/exampleorg"
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@exampleorg');
    await context.close();
  });

  it('should validate Twitter handle pattern and reject invalid handles', async () => {
    const html = `
      <html>
        <body>
          <a href="https://twitter.com/this-is-invalid-handle-too-long">Twitter</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, null);
    await context.close();
  });

  it('should accept handles with underscores and numbers', async () => {
    const html = `
      <html>
        <body>
          <a href="https://twitter.com/example_org123">Twitter</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, '@example_org123');
    await context.close();
  });

  it('should return null when no Twitter link is found', async () => {
    const html = `
      <html>
        <body>
          <a href="https://facebook.com/exampleorg">Facebook</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const twitter = await extractTwitter(page);
    assert.strictEqual(twitter, null);
    await context.close();
  });
});

describe('Enhanced Scraper - extractStructuredData', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should extract JSON-LD Organization data', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example Organization",
            "description": "A test organization",
            "url": "https://example.com",
            "sameAs": ["https://twitter.com/example"]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await extractStructuredData(page);
    assert.strictEqual(data.name, 'Example Organization');
    assert.strictEqual(data.description, 'A test organization');
    assert.strictEqual(data.url, 'https://example.com');
    assert.deepStrictEqual(data.sameAs, ['https://twitter.com/example']);
    await context.close();
  });

  it('should handle JSON-LD array with Organization type', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          [
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Example Site"
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Example Organization"
            }
          ]
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await extractStructuredData(page);
    assert.strictEqual(data.name, 'Example Organization');
    await context.close();
  });

  it('should extract microdata Organization', async () => {
    const html = `
      <html>
        <body>
          <div itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Example Organization</span>
            <span itemprop="description">A test organization</span>
            <a itemprop="sameAs" href="https://twitter.com/example">Twitter</a>
          </div>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await extractStructuredData(page);
    assert.strictEqual(data.name, 'Example Organization');
    assert.strictEqual(data.description, 'A test organization');
    assert.ok(Array.isArray(data.sameAs));
    assert.strictEqual(data.sameAs[0], 'https://twitter.com/example');
    await context.close();
  });

  it('should return null when no structured data is found', async () => {
    const html = `
      <html>
        <head></head>
        <body><p>No structured data here</p></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await extractStructuredData(page);
    assert.strictEqual(data, null);
    await context.close();
  });

  it('should handle malformed JSON-LD gracefully', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          { invalid json here }
          </script>
        </head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await extractStructuredData(page);
    assert.strictEqual(data, null);
    await context.close();
  });
});

describe('Enhanced Scraper - scrapeOrganisation', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should extract complete organization data', async () => {
    const html = `
      <html>
        <head>
          <title>Example Organization | Home</title>
          <meta name="description" content="We are a leading organization in the UAE." />
        </head>
        <body>
          <a href="https://twitter.com/exampleorg">Twitter</a>
        </body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await scrapeOrganisation('https://example.com', page);
    
    assert.strictEqual(data.name, 'Example Organization');
    assert.strictEqual(data.website, 'https://example.com');
    assert.strictEqual(data.description, 'We are a leading organization in the UAE.');
    assert.strictEqual(data.twitter, '@exampleorg');
    assert.strictEqual(data.country, 'United Arab Emirates');
    
    await context.close();
  });

  it('should set fields to null when extraction fails', async () => {
    const html = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await scrapeOrganisation('https://example.com', page);
    
    assert.strictEqual(data.name, null);
    assert.strictEqual(data.website, 'https://example.com');
    assert.strictEqual(data.description, null);
    assert.strictEqual(data.twitter, null);
    assert.strictEqual(data.country, 'United Arab Emirates');
    
    await context.close();
  });

  it('should always set country to United Arab Emirates', async () => {
    const html = `
      <html>
        <head><title>Test Org</title></head>
        <body></body>
      </html>
    `;
    const { page, context } = await createPageWithHTML(browser, html);
    const data = await scrapeOrganisation('https://example.com', page);
    
    assert.strictEqual(data.country, 'United Arab Emirates');
    
    await context.close();
  });
});

/**
 * Property-Based Tests for Enhanced Scraper
 * Using fast-check to verify universal properties
 */

import fc from 'fast-check';

describe('Property-Based Tests - Enhanced Scraper', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  /**
   * Property 3: Multi-Strategy Extraction Success
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * For any web page containing organization data (name, description, social links)
   * in any supported location (meta tags, structured data, HTML elements),
   * the scraper SHALL successfully extract that data.
   */
  it('Property 3: Multi-Strategy Extraction Success', async () => {
    // Feature: scraper-improvements, Property 3: Multi-strategy extraction
    
    // Define generators for different data placement strategies
    const nameStrategyGen = fc.constantFrom(
      'og:title',      // Open Graph meta tag
      'title',         // Page title tag
      'h1',            // H1 element
      'json-ld'        // JSON-LD structured data
    );

    const descriptionStrategyGen = fc.constantFrom(
      'meta-description',  // Meta description tag
      'og:description',    // Open Graph description
      'paragraph',         // First paragraph
      'json-ld'           // JSON-LD structured data
    );

    const twitterStrategyGen = fc.constantFrom(
      'anchor-twitter',    // Anchor tag with twitter.com
      'anchor-x',          // Anchor tag with x.com
      'social-section',    // Social media section
      'json-ld'           // JSON-LD sameAs
    );

    // Generate random organization data
    // Note: We trim the strings because the extraction functions trim their results
    // Also filter out strings that would be cleaned away by title cleaning (only separators)
    const orgDataGen = fc.record({
      name: fc.string({ minLength: 2, maxLength: 100 })
        .map(s => s.trim())
        .filter(s => {
          if (s.length === 0) return false;
          // Filter out strings that consist only of separator characters
          // These would be cleaned away when using title strategy
          const cleanedByTitle = s.split('|')[0].split('-')[0].split('–')[0].trim();
          return cleanedByTitle.length > 0;
        }),
      description: fc.string({ minLength: 21, maxLength: 200 })
        .map(s => s.trim())
        .filter(s => s.length > 20),
      twitter: fc.string({ minLength: 1, maxLength: 15 })
        .map(s => s.replace(/[^A-Za-z0-9_]/g, ''))
        .filter(s => s.length >= 1 && s.length <= 15)
    });

    // Generate random strategy combinations
    const testCaseGen = fc.record({
      orgData: orgDataGen,
      nameStrategy: nameStrategyGen,
      descStrategy: descriptionStrategyGen,
      twitterStrategy: twitterStrategyGen
    });

    await fc.assert(
      fc.asyncProperty(testCaseGen, async ({ orgData, nameStrategy, descStrategy, twitterStrategy }) => {
        // Build HTML based on selected strategies
        const html = buildHTMLWithStrategies(
          orgData,
          nameStrategy,
          descStrategy,
          twitterStrategy
        );

        // Create page and extract data
        const { page, context } = await createPageWithHTML(browser, html);
        
        try {
          const extractedName = await extractName(page);
          const extractedDesc = await extractDescription(page);
          const extractedTwitter = await extractTwitter(page);

          // Verify extraction succeeded
          assert.strictEqual(
            extractedName,
            orgData.name,
            `Failed to extract name using strategy: ${nameStrategy}`
          );

          assert.strictEqual(
            extractedDesc,
            orgData.description,
            `Failed to extract description using strategy: ${descStrategy}`
          );

          assert.strictEqual(
            extractedTwitter,
            `@${orgData.twitter}`,
            `Failed to extract Twitter using strategy: ${twitterStrategy}`
          );
        } finally {
          await context.close();
        }
      }),
      { numRuns: 20 }  // Reduced from 100 due to browser launch overhead
    );
  });

  /**
   * Property 5: No Data Hallucination
   * **Validates: Requirements 2.7**
   * 
   * For any scraped Organisation, all non-null field values SHALL exist in the
   * source page HTML or structured data (no generated or inferred data).
   */
  it('Property 5: No Data Hallucination', async () => {
    // Feature: scraper-improvements, Property 5: No data hallucination
    
    // Generate random organization data with more controlled characters
    // to avoid HTML escaping issues
    const orgDataGen = fc.record({
      name: fc.string({ minLength: 2, maxLength: 100 })
        .map(s => s.replace(/[<>"'&]/g, ''))  // Remove HTML special chars
        .map(s => s.trim())
        .filter(s => s.length > 0),
      description: fc.string({ minLength: 21, maxLength: 200 })
        .map(s => s.replace(/[<>"'&]/g, ''))  // Remove HTML special chars
        .map(s => s.replace(/\s+/g, ' '))     // Normalize whitespace
        .map(s => s.trim())
        .filter(s => s.length > 20),
      twitter: fc.string({ minLength: 1, maxLength: 15 })
        .map(s => s.replace(/[^A-Za-z0-9_]/g, ''))
        .filter(s => s.length >= 1 && s.length <= 15)
    });

    await fc.assert(
      fc.asyncProperty(orgDataGen, async (orgData) => {
        // Build HTML with the organization data
        const html = `
          <html>
            <head>
              <title>${escapeHtml(orgData.name)}</title>
              <meta name="description" content="${escapeHtml(orgData.description)}" />
            </head>
            <body>
              <a href="https://twitter.com/${orgData.twitter}">Twitter</a>
            </body>
          </html>
        `;

        // Create page and scrape
        const { page, context } = await createPageWithHTML(browser, html);
        
        try {
          const scrapedData = await scrapeOrganisation('https://example.com', page);
          
          // Get the raw HTML content for verification
          const pageContent = await page.content();
          
          // Verify that all non-null extracted data exists in the page source
          // The key insight: we're checking that the scraper doesn't hallucinate data
          // If data is extracted, it must have come from the page
          
          if (scrapedData.name !== null) {
            // The extracted name should match what we put in the page
            assert.strictEqual(
              scrapedData.name,
              orgData.name,
              `Extracted name "${scrapedData.name}" doesn't match source data "${orgData.name}"`
            );
          }
          
          if (scrapedData.description !== null) {
            // The extracted description should match what we put in the page
            assert.strictEqual(
              scrapedData.description,
              orgData.description,
              `Extracted description "${scrapedData.description}" doesn't match source data "${orgData.description}"`
            );
          }
          
          if (scrapedData.twitter !== null) {
            // The extracted Twitter handle should match what we put in the page
            const expectedHandle = `@${orgData.twitter}`;
            assert.strictEqual(
              scrapedData.twitter,
              expectedHandle,
              `Extracted Twitter handle "${scrapedData.twitter}" doesn't match source data "${expectedHandle}"`
            );
          }
          
          // Country is always "United Arab Emirates" - this is a constant, not extracted
          // So we don't need to verify it exists in the page source
          
          // Website is the URL we passed in, not extracted from the page
          // So we don't need to verify it exists in the page source
          
        } finally {
          await context.close();
        }
      }),
      { numRuns: 10 }  // Reduced for faster execution
    );
  });

  /**
   * Property 4: Extraction Failure Null Handling
   * **Validates: Requirements 2.6, 8.5**
   * 
   * For any web page where a specific field extraction fails,
   * the scraper SHALL set that field to null and continue extracting other fields.
   */
  it('Property 4: Extraction Failure Null Handling', async () => {
    // Feature: scraper-improvements, Property 4: Extraction failure null handling
    
    // Generator for field presence combinations
    // Each field can be present (true) or absent (false)
    const fieldPresenceGen = fc.record({
      hasName: fc.boolean(),
      hasDescription: fc.boolean(),
      hasTwitter: fc.boolean()
    }).filter(({ hasName, hasDescription, hasTwitter }) => {
      // At least one field should be missing to test failure handling
      return !hasName || !hasDescription || !hasTwitter;
    });

    // Generate random organization data
    const orgDataGen = fc.record({
      name: fc.string({ minLength: 2, maxLength: 100 })
        .map(s => s.trim())
        .filter(s => {
          if (s.length === 0) return false;
          // Filter out strings that consist only of separator characters
          // These would be cleaned away when using title strategy
          const cleanedByTitle = s.split('|')[0].split('-')[0].split('–')[0].trim();
          return cleanedByTitle.length > 0;
        }),
      description: fc.string({ minLength: 21, maxLength: 200 })
        .map(s => s.trim())
        .filter(s => s.length > 20),
      twitter: fc.string({ minLength: 1, maxLength: 15 })
        .map(s => s.replace(/[^A-Za-z0-9_]/g, ''))
        .filter(s => s.length >= 1 && s.length <= 15)
    });

    const testCaseGen = fc.record({
      orgData: orgDataGen,
      fieldPresence: fieldPresenceGen
    });

    await fc.assert(
      fc.asyncProperty(testCaseGen, async ({ orgData, fieldPresence }) => {
        // Build HTML with only the fields that should be present
        const html = buildHTMLWithPartialData(orgData, fieldPresence);

        // Create page and extract data
        const { page, context } = await createPageWithHTML(browser, html);
        
        try {
          const extractedName = await extractName(page);
          const extractedDesc = await extractDescription(page);
          const extractedTwitter = await extractTwitter(page);

          // Verify that present fields are extracted correctly
          if (fieldPresence.hasName) {
            assert.strictEqual(
              extractedName,
              orgData.name,
              'Name should be extracted when present'
            );
          } else {
            // Verify that missing fields are set to null
            assert.strictEqual(
              extractedName,
              null,
              'Name should be null when extraction fails'
            );
          }

          if (fieldPresence.hasDescription) {
            assert.strictEqual(
              extractedDesc,
              orgData.description,
              'Description should be extracted when present'
            );
          } else {
            assert.strictEqual(
              extractedDesc,
              null,
              'Description should be null when extraction fails'
            );
          }

          if (fieldPresence.hasTwitter) {
            assert.strictEqual(
              extractedTwitter,
              `@${orgData.twitter}`,
              'Twitter should be extracted when present'
            );
          } else {
            assert.strictEqual(
              extractedTwitter,
              null,
              'Twitter should be null when extraction fails'
            );
          }

          // Test the full scrapeOrganisation function to ensure it continues
          // extracting other fields even when some fail
          const scrapedData = await scrapeOrganisation('https://example.com', page);
          
          // Verify that the function completed and returned data
          assert.ok(scrapedData, 'scrapeOrganisation should return data even with failures');
          assert.strictEqual(scrapedData.website, 'https://example.com', 'Website should always be set');
          assert.strictEqual(scrapedData.country, 'United Arab Emirates', 'Country should always be set');
          
          // Verify null handling in the complete scrape result
          if (fieldPresence.hasName) {
            assert.strictEqual(scrapedData.name, orgData.name);
          } else {
            assert.strictEqual(scrapedData.name, null);
          }
          
          if (fieldPresence.hasDescription) {
            assert.strictEqual(scrapedData.description, orgData.description);
          } else {
            assert.strictEqual(scrapedData.description, null);
          }
          
          if (fieldPresence.hasTwitter) {
            assert.strictEqual(scrapedData.twitter, `@${orgData.twitter}`);
          } else {
            assert.strictEqual(scrapedData.twitter, null);
          }
        } finally {
          await context.close();
        }
      }),
      { numRuns: 30 }  // Reduced due to browser overhead, but still comprehensive
    );
  });
});

/**
 * Helper function to build HTML with only specified fields present
 */
function buildHTMLWithPartialData(orgData, fieldPresence) {
  let head = '';
  let body = '';

  // Only include name if specified
  if (fieldPresence.hasName) {
    head += `<title>${escapeHtml(orgData.name)}</title>`;
  }

  // Only include description if specified
  if (fieldPresence.hasDescription) {
    head += `<meta name="description" content="${escapeHtml(orgData.description)}" />`;
  }

  // Only include Twitter if specified
  if (fieldPresence.hasTwitter) {
    body += `<a href="https://twitter.com/${orgData.twitter}">Twitter</a>`;
  }

  return `
    <html>
      <head>${head}</head>
      <body>${body}</body>
    </html>
  `;
}

/**
 * Helper function to build HTML with data placed according to specified strategies
 */
function buildHTMLWithStrategies(orgData, nameStrategy, descStrategy, twitterStrategy) {
  let head = '';
  let body = '';

  // Place name according to strategy
  switch (nameStrategy) {
    case 'og:title':
      head += `<meta property="og:title" content="${escapeHtml(orgData.name)}" />`;
      break;
    case 'title':
      head += `<title>${escapeHtml(orgData.name)}</title>`;
      break;
    case 'h1':
      body += `<h1>${escapeHtml(orgData.name)}</h1>`;
      break;
    case 'json-ld':
      head += `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "${escapeJson(orgData.name)}"
        }
        </script>
      `;
      break;
  }

  // Place description according to strategy
  switch (descStrategy) {
    case 'meta-description':
      head += `<meta name="description" content="${escapeHtml(orgData.description)}" />`;
      break;
    case 'og:description':
      head += `<meta property="og:description" content="${escapeHtml(orgData.description)}" />`;
      break;
    case 'paragraph':
      body += `<p>${escapeHtml(orgData.description)}</p>`;
      break;
    case 'json-ld':
      // If we already have JSON-LD from name, merge it
      if (nameStrategy === 'json-ld') {
        // Replace the existing JSON-LD script
        head = head.replace(
          /"name": "[^"\\]*(?:\\.[^"\\]*)*"/,
          `"name": "${escapeJson(orgData.name)}",\n          "description": "${escapeJson(orgData.description)}"`
        );
      } else {
        head += `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "description": "${escapeJson(orgData.description)}"
          }
          </script>
        `;
      }
      break;
  }

  // Place Twitter according to strategy
  switch (twitterStrategy) {
    case 'anchor-twitter':
      body += `<a href="https://twitter.com/${orgData.twitter}">Twitter</a>`;
      break;
    case 'anchor-x':
      body += `<a href="https://x.com/${orgData.twitter}">X</a>`;
      break;
    case 'social-section':
      body += `
        <div class="footer-social">
          <a href="https://twitter.com/${orgData.twitter}">Follow us</a>
        </div>
      `;
      break;
    case 'json-ld':
      // If we already have JSON-LD, add sameAs to it
      if (nameStrategy === 'json-ld' || descStrategy === 'json-ld') {
        // Find and update existing JSON-LD
        const sameAsValue = `"sameAs": ["https://twitter.com/${orgData.twitter}"]`;
        if (head.includes('"description"')) {
          head = head.replace(
            /"description": "[^"\\]*(?:\\.[^"\\]*)*"/,
            `"description": "${escapeJson(orgData.description)}",\n          ${sameAsValue}`
          );
        } else if (head.includes('"name"')) {
          head = head.replace(
            /"name": "[^"\\]*(?:\\.[^"\\]*)*"/,
            `"name": "${escapeJson(orgData.name)}",\n          ${sameAsValue}`
          );
        }
      } else {
        head += `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "sameAs": ["https://twitter.com/${orgData.twitter}"]
          }
          </script>
        `;
      }
      break;
  }

  return `
    <html>
      <head>${head}</head>
      <body>${body}</body>
    </html>
  `;
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Helper function to escape JSON string values
 */
function escapeJson(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Unit Tests for Retry Logic with Exponential Backoff
 * Tests the retryPageGoto function
 * Requirements: 8.1
 */

import { retryPageGoto } from './enhanced-scraper.js';

describe('Enhanced Scraper - retryPageGoto', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should successfully load page on first attempt', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create a simple HTML page to navigate to
    const html = '<html><body><h1>Test Page</h1></body></html>';
    await page.setContent(html);
    const url = page.url();
    
    // Test retry function with a valid page
    const response = await retryPageGoto(page, url);
    
    assert.ok(response !== null, 'Should return response on success');
    
    await context.close();
  });

  it('should retry up to 3 times on failure', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let attemptCount = 0;
    const originalGoto = page.goto.bind(page);
    
    // Mock page.goto to fail first 2 times, succeed on 3rd
    page.goto = async (url, options) => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return originalGoto(url, options);
    };
    
    // Use a data URL that will work when we finally succeed
    const url = 'data:text/html,<html><body>Success</body></html>';
    const response = await retryPageGoto(page, url);
    
    assert.strictEqual(attemptCount, 3, 'Should attempt 3 times');
    assert.ok(response !== null, 'Should succeed on 3rd attempt');
    
    await context.close();
  });

  it('should return null after 3 failed attempts', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let attemptCount = 0;
    
    // Mock page.goto to always fail
    page.goto = async (url, options) => {
      attemptCount++;
      throw new Error('Network error');
    };
    
    const url = 'https://invalid-url-that-will-fail.test';
    const response = await retryPageGoto(page, url);
    
    assert.strictEqual(attemptCount, 3, 'Should attempt exactly 3 times');
    assert.strictEqual(response, null, 'Should return null after all attempts fail');
    
    await context.close();
  });

  it('should implement exponential backoff delays', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const attemptTimes = [];
    
    // Mock page.goto to always fail and record attempt times
    page.goto = async (url, options) => {
      attemptTimes.push(Date.now());
      throw new Error('Network error');
    };
    
    const url = 'https://invalid-url.test';
    await retryPageGoto(page, url);
    
    // Verify we have 3 attempts
    assert.strictEqual(attemptTimes.length, 3, 'Should have 3 attempts');
    
    // Verify delays between attempts (with some tolerance for execution time)
    // Expected delays: 1000ms, 2000ms
    const delay1 = attemptTimes[1] - attemptTimes[0];
    const delay2 = attemptTimes[2] - attemptTimes[1];
    
    // Allow 100ms tolerance for execution overhead
    assert.ok(delay1 >= 1000 && delay1 < 1200, `First delay should be ~1000ms, was ${delay1}ms`);
    assert.ok(delay2 >= 2000 && delay2 < 2200, `Second delay should be ~2000ms, was ${delay2}ms`);
    
    await context.close();
  });

  it('should log retry attempts', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const logs = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Capture console output
    console.log = (msg) => logs.push({ level: 'log', msg });
    console.warn = (msg) => logs.push({ level: 'warn', msg });
    console.error = (msg) => logs.push({ level: 'error', msg });
    
    // Mock page.goto to fail twice, succeed on third
    let attemptCount = 0;
    page.goto = async (url, options) => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return { ok: true, status: 200 };
    };
    
    const url = 'https://test-url.test';
    await retryPageGoto(page, url);
    
    // Restore console
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    
    // Verify logging
    const attemptLogs = logs.filter(l => l.msg.includes('Attempting to load'));
    const retryLogs = logs.filter(l => l.msg.includes('Retrying in'));
    const successLogs = logs.filter(l => l.msg.includes('Successfully loaded'));
    
    assert.strictEqual(attemptLogs.length, 3, 'Should log each attempt');
    assert.strictEqual(retryLogs.length, 2, 'Should log retry delays');
    assert.strictEqual(successLogs.length, 1, 'Should log success');
    
    await context.close();
  });

  it('should log final failure after all retries exhausted', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const logs = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Capture console output
    console.log = (msg) => logs.push({ level: 'log', msg });
    console.warn = (msg) => logs.push({ level: 'warn', msg });
    console.error = (msg) => logs.push({ level: 'error', msg });
    
    // Mock page.goto to always fail
    page.goto = async (url, options) => {
      throw new Error('Network error');
    };
    
    const url = 'https://test-url.test';
    await retryPageGoto(page, url);
    
    // Restore console
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    
    // Verify final failure is logged
    const failureLogs = logs.filter(l => l.level === 'error' && l.msg.includes('Final failure'));
    assert.strictEqual(failureLogs.length, 1, 'Should log final failure');
    assert.ok(failureLogs[0].msg.includes('3 attempts'), 'Should mention number of attempts');
    
    await context.close();
  });
});

/**
 * Property-Based Tests for Retry Logic
 * Using fast-check to verify retry behavior properties
 */

describe('Property-Based Tests - Retry Logic', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  /**
   * Property 17: Retry with Exponential Backoff
   * **Validates: Requirements 8.1**
   * 
   * For any page load failure, the scraper SHALL retry up to 3 times
   * with delays of 1s, 2s, and 4s before giving up.
   */
  it('Property 17: Retry with Exponential Backoff', async () => {
    // Feature: scraper-improvements, Property 17: Retry with exponential backoff
    
    // Generator for number of failures before success (0-3)
    // 0 = success on first try
    // 1 = fail once, succeed on second try
    // 2 = fail twice, succeed on third try
    // 3 = fail all three times
    const failureCountGen = fc.integer({ min: 0, max: 3 });
    
    // Generator for different error types
    const errorTypeGen = fc.constantFrom(
      'Network error',
      'Timeout',
      'Connection refused',
      'DNS lookup failed',
      'ERR_CONNECTION_RESET'
    );
    
    const testCaseGen = fc.record({
      failureCount: failureCountGen,
      errorType: errorTypeGen
    });

    await fc.assert(
      fc.asyncProperty(testCaseGen, async ({ failureCount, errorType }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          let attemptCount = 0;
          const attemptTimes = [];
          const originalGoto = page.goto.bind(page);
          
          // Mock page.goto to fail specified number of times
          page.goto = async (url, options) => {
            attemptCount++;
            attemptTimes.push(Date.now());
            
            if (attemptCount <= failureCount) {
              throw new Error(errorType);
            }
            
            // Success case - use data URL
            return originalGoto('data:text/html,<html><body>Success</body></html>', options);
          };
          
          const url = 'https://test-url.test';
          const response = await retryPageGoto(page, url);
          
          // Property 1: Should attempt exactly the right number of times
          if (failureCount < 3) {
            // Should succeed after (failureCount + 1) attempts
            assert.strictEqual(
              attemptCount,
              failureCount + 1,
              `Should attempt ${failureCount + 1} times when failing ${failureCount} times`
            );
            assert.ok(response !== null, 'Should return response on eventual success');
          } else {
            // Should fail after exactly 3 attempts
            assert.strictEqual(
              attemptCount,
              3,
              'Should attempt exactly 3 times before giving up'
            );
            assert.strictEqual(response, null, 'Should return null after all attempts fail');
          }
          
          // Property 2: Should implement exponential backoff delays
          if (attemptCount > 1) {
            // Verify delays between attempts
            const expectedDelays = [1000, 2000, 4000];
            
            for (let i = 1; i < attemptCount; i++) {
              const actualDelay = attemptTimes[i] - attemptTimes[i - 1];
              const expectedDelay = expectedDelays[i - 1];
              
              // Allow 200ms tolerance for execution overhead
              assert.ok(
                actualDelay >= expectedDelay && actualDelay < expectedDelay + 200,
                `Delay ${i} should be ~${expectedDelay}ms, was ${actualDelay}ms`
              );
            }
          }
          
          // Property 3: Should not retry more than 3 times
          assert.ok(
            attemptCount <= 3,
            'Should never attempt more than 3 times'
          );
          
        } finally {
          await context.close();
        }
      }),
      { numRuns: 20 }  // Reduced due to timing-sensitive nature and browser overhead
    );
  });
});

/**
 * Unit Tests for HTTP Error Handling
 * Tests handling of 403/429/503 status codes
 * Requirements: 8.2
 */

import { ErrorSummary } from './enhanced-scraper.js';

describe('Enhanced Scraper - HTTP Error Handling', () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await browser.close();
  });

  it('should handle 403 Forbidden and return null', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errorSummary = new ErrorSummary();
    
    // Mock page.goto to return 403 response
    page.goto = async (url, options) => {
      return {
        ok: false,
        status: () => 403,
        statusText: () => 'Forbidden'
      };
    };
    
    const url = 'https://test-url.test';
    const response = await retryPageGoto(page, url, {}, errorSummary);
    
    assert.strictEqual(response, null, 'Should return null for 403');
    assert.strictEqual(errorSummary.httpErrors.length, 1, 'Should record HTTP error');
    assert.strictEqual(errorSummary.httpErrors[0].statusCode, 403);
    assert.strictEqual(errorSummary.httpErrors[0].url, url);
    
    await context.close();
  });

  it('should handle 429 Rate Limited and return null', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errorSummary = new ErrorSummary();
    
    // Mock page.goto to return 429 response
    page.goto = async (url, options) => {
      return {
        ok: false,
        status: () => 429,
        statusText: () => 'Too Many Requests'
      };
    };
    
    const url = 'https://test-url.test';
    const response = await retryPageGoto(page, url, {}, errorSummary);
    
    assert.strictEqual(response, null, 'Should return null for 429');
    assert.strictEqual(errorSummary.httpErrors.length, 1, 'Should record HTTP error');
    assert.strictEqual(errorSummary.httpErrors[0].statusCode, 429);
    
    await context.close();
  });

  it('should handle 503 Service Unavailable and return null', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errorSummary = new ErrorSummary();
    
    // Mock page.goto to return 503 response
    page.goto = async (url, options) => {
      return {
        ok: false,
        status: () => 503,
        statusText: () => 'Service Unavailable'
      };
    };
    
    const url = 'https://test-url.test';
    const response = await retryPageGoto(page, url, {}, errorSummary);
    
    assert.strictEqual(response, null, 'Should return null for 503');
    assert.strictEqual(errorSummary.httpErrors.length, 1, 'Should record HTTP error');
    assert.strictEqual(errorSummary.httpErrors[0].statusCode, 503);
    
    await context.close();
  });

  it('should allow successful requests with 200 status', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errorSummary = new ErrorSummary();
    
    // Mock page.goto to return 200 response
    page.goto = async (url, options) => {
      return {
        ok: true,
        status: () => 200,
        statusText: () => 'OK'
      };
    };
    
    const url = 'https://test-url.test';
    const response = await retryPageGoto(page, url, {}, errorSummary);
    
    assert.ok(response !== null, 'Should return response for 200');
    assert.strictEqual(response.status(), 200);
    assert.strictEqual(errorSummary.httpErrors.length, 0, 'Should not record error for 200');
    
    await context.close();
  });

  it('should not retry on HTTP error codes 403/429/503', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errorSummary = new ErrorSummary();
    
    let attemptCount = 0;
    
    // Mock page.goto to return 403 response
    page.goto = async (url, options) => {
      attemptCount++;
      return {
        ok: false,
        status: () => 403,
        statusText: () => 'Forbidden'
      };
    };
    
    const url = 'https://test-url.test';
    const response = await retryPageGoto(page, url, {}, errorSummary);
    
    assert.strictEqual(attemptCount, 1, 'Should only attempt once for HTTP errors');
    assert.strictEqual(response, null, 'Should return null');
    
    await context.close();
  });
});

describe('ErrorSummary Class', () => {
  it('should track page load errors', () => {
    const errorSummary = new ErrorSummary();
    
    errorSummary.addPageLoadError('https://example.com', 'Timeout');
    errorSummary.addPageLoadError('https://example2.com', 'Network error');
    
    const summary = errorSummary.getSummary();
    assert.strictEqual(summary.pageLoadErrors.length, 2);
    assert.strictEqual(summary.pageLoadErrors[0].url, 'https://example.com');
    assert.strictEqual(summary.pageLoadErrors[0].reason, 'Timeout');
  });

  it('should track extraction warnings', () => {
    const errorSummary = new ErrorSummary();
    
    errorSummary.addExtractionWarning('https://example.com', 'twitter', 'Not found');
    
    const summary = errorSummary.getSummary();
    assert.strictEqual(summary.extractionWarnings.length, 1);
    assert.strictEqual(summary.extractionWarnings[0].field, 'twitter');
  });

  it('should track HTTP errors', () => {
    const errorSummary = new ErrorSummary();
    
    errorSummary.addHttpError('https://example.com', 403, 'Forbidden');
    errorSummary.addHttpError('https://example2.com', 429, 'Too Many Requests');
    
    const summary = errorSummary.getSummary();
    assert.strictEqual(summary.httpErrors.length, 2);
    assert.strictEqual(summary.httpErrors[0].statusCode, 403);
    assert.strictEqual(summary.httpErrors[1].statusCode, 429);
  });

  it('should calculate total errors and warnings', () => {
    const errorSummary = new ErrorSummary();
    
    errorSummary.addPageLoadError('https://example.com', 'Timeout');
    errorSummary.addHttpError('https://example2.com', 403, 'Forbidden');
    errorSummary.addExtractionWarning('https://example3.com', 'twitter', 'Not found');
    
    const summary = errorSummary.getSummary();
    assert.strictEqual(summary.totalErrors, 2); // pageLoadErrors + httpErrors
    assert.strictEqual(summary.totalWarnings, 1); // extractionWarnings
  });

  it('should print summary to console', () => {
    const errorSummary = new ErrorSummary();
    const logs = [];
    
    // Capture console output
    const originalLog = console.log;
    console.log = (msg) => logs.push(msg);
    
    errorSummary.addHttpError('https://example.com', 403, 'Forbidden');
    errorSummary.addPageLoadError('https://example2.com', 'Timeout');
    errorSummary.addExtractionWarning('https://example3.com', 'twitter', 'Not found');
    
    errorSummary.printSummary();
    
    // Restore console
    console.log = originalLog;
    
    // Verify output
    assert.ok(logs.some(l => l.includes('Scraper Error Summary')));
    assert.ok(logs.some(l => l.includes('Total HTTP Errors: 1')));
    assert.ok(logs.some(l => l.includes('Total Page Load Errors: 1')));
    assert.ok(logs.some(l => l.includes('Total Extraction Warnings: 1')));
  });
});

/**
 * Property-Based Tests for HTTP Error Handling
 * Using fast-check to verify error recovery properties
 */

describe('Property-Based Tests - HTTP Error Handling', () => {
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
   */
  it('Property 18: Error Recovery Continuation', async () => {
    // Feature: scraper-improvements, Property 18: Error recovery continuation
    
    // Generator for HTTP error status codes
    const errorStatusGen = fc.constantFrom(403, 429, 503);
    
    // Generator for status text
    const statusTextGen = fc.record({
      403: fc.constant('Forbidden'),
      429: fc.constant('Too Many Requests'),
      503: fc.constant('Service Unavailable')
    });
    
    // Generator for URLs
    const urlGen = fc.webUrl();
    
    const testCaseGen = fc.record({
      statusCode: errorStatusGen,
      url: urlGen
    });

    await fc.assert(
      fc.asyncProperty(testCaseGen, async ({ statusCode, url }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const errorSummary = new ErrorSummary();
        
        try {
          let attemptCount = 0;
          
          // Mock page.goto to return error status
          page.goto = async (targetUrl, options) => {
            attemptCount++;
            return {
              ok: false,
              status: () => statusCode,
              statusText: () => {
                if (statusCode === 403) return 'Forbidden';
                if (statusCode === 429) return 'Too Many Requests';
                if (statusCode === 503) return 'Service Unavailable';
                return 'Error';
              }
            };
          };
          
          const response = await retryPageGoto(page, url, {}, errorSummary);
          
          // Property 1: Should return null for error status codes
          assert.strictEqual(
            response,
            null,
            `Should return null for status ${statusCode}`
          );
          
          // Property 2: Should only attempt once (no retries for HTTP errors)
          assert.strictEqual(
            attemptCount,
            1,
            `Should not retry for HTTP error ${statusCode}`
          );
          
          // Property 3: Should log the error in error summary
          assert.strictEqual(
            errorSummary.httpErrors.length,
            1,
            'Should record exactly one HTTP error'
          );
          
          assert.strictEqual(
            errorSummary.httpErrors[0].statusCode,
            statusCode,
            'Should record correct status code'
          );
          
          assert.strictEqual(
            errorSummary.httpErrors[0].url,
            url,
            'Should record correct URL'
          );
          
          // Property 4: Function should complete without throwing
          // (This is implicitly tested by reaching this point)
          
        } finally {
          await context.close();
        }
      }),
      { numRuns: 30 }  // Test with various combinations
    );
  });

  /**
   * Test that scraper continues processing multiple URLs even when some fail
   */
  it('Property 18 Extended: Scraper continues with multiple URLs', async () => {
    // Feature: scraper-improvements, Property 18: Error recovery continuation
    
    // Generator for a list of URLs with mixed success/failure
    const urlListGen = fc.array(
      fc.record({
        url: fc.webUrl(),
        statusCode: fc.oneof(
          fc.constant(200),  // Success
          fc.constantFrom(403, 429, 503)  // Errors
        )
      }),
      { minLength: 3, maxLength: 10 }
    );

    await fc.assert(
      fc.asyncProperty(urlListGen, async (urlList) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const errorSummary = new ErrorSummary();
        
        try {
          const results = [];
          
          // Process each URL
          for (const { url, statusCode } of urlList) {
            // Mock page.goto to return specified status
            page.goto = async (targetUrl, options) => {
              if (statusCode === 200) {
                return {
                  ok: true,
                  status: () => 200,
                  statusText: () => 'OK'
                };
              } else {
                return {
                  ok: false,
                  status: () => statusCode,
                  statusText: () => {
                    if (statusCode === 403) return 'Forbidden';
                    if (statusCode === 429) return 'Too Many Requests';
                    if (statusCode === 503) return 'Service Unavailable';
                    return 'Error';
                  }
                };
              }
            };
            
            const response = await retryPageGoto(page, url, {}, errorSummary);
            results.push({ url, response, statusCode });
          }
          
          // Property 1: Should process all URLs (not stop on first error)
          assert.strictEqual(
            results.length,
            urlList.length,
            'Should process all URLs even when some fail'
          );
          
          // Property 2: Successful URLs should return response
          const successfulUrls = urlList.filter(u => u.statusCode === 200);
          const successfulResults = results.filter(r => r.response !== null);
          assert.strictEqual(
            successfulResults.length,
            successfulUrls.length,
            'All successful URLs should return response'
          );
          
          // Property 3: Failed URLs should return null
          const failedUrls = urlList.filter(u => u.statusCode !== 200);
          const failedResults = results.filter(r => r.response === null);
          assert.strictEqual(
            failedResults.length,
            failedUrls.length,
            'All failed URLs should return null'
          );
          
          // Property 4: Error summary should contain all HTTP errors
          assert.strictEqual(
            errorSummary.httpErrors.length,
            failedUrls.length,
            'Error summary should contain all HTTP errors'
          );
          
        } finally {
          await context.close();
        }
      }),
      { numRuns: 20 }  // Reduced due to multiple URL processing
    );
  });
});
