/**
 * Enhanced Scraper Module
 * 
 * Implements multi-strategy data extraction from web pages using:
 * - Open Graph meta tags
 * - Standard HTML meta tags
 * - Semantic HTML elements
 * - JSON-LD structured data
 * - Microdata
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 8.1, 8.2, 9.1, 9.2
 */

/**
 * Error summary tracker for scraping runs
 * Tracks all errors encountered during scraping for reporting
 */
export class ErrorSummary {
  constructor() {
    this.pageLoadErrors = [];
    this.extractionWarnings = [];
    this.httpErrors = [];
  }

  /**
   * Add a page load error
   * @param {string} url - URL that failed to load
   * @param {string} reason - Error reason
   */
  addPageLoadError(url, reason) {
    this.pageLoadErrors.push({ url, reason, timestamp: new Date() });
  }

  /**
   * Add an extraction warning
   * @param {string} url - URL where extraction failed
   * @param {string} field - Field that failed to extract
   * @param {string} reason - Error reason
   */
  addExtractionWarning(url, field, reason) {
    this.extractionWarnings.push({ url, field, reason, timestamp: new Date() });
  }

  /**
   * Add an HTTP error
   * @param {string} url - URL that returned error
   * @param {number} statusCode - HTTP status code
   * @param {string} statusText - HTTP status text
   */
  addHttpError(url, statusCode, statusText) {
    this.httpErrors.push({ url, statusCode, statusText, timestamp: new Date() });
  }

  /**
   * Get summary report
   * @returns {Object} Summary report object
   */
  getSummary() {
    return {
      pageLoadErrors: this.pageLoadErrors,
      extractionWarnings: this.extractionWarnings,
      httpErrors: this.httpErrors,
      totalErrors: this.pageLoadErrors.length + this.httpErrors.length,
      totalWarnings: this.extractionWarnings.length
    };
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n=== Scraper Error Summary ===');
    console.log(`Total HTTP Errors: ${this.httpErrors.length}`);
    console.log(`Total Page Load Errors: ${this.pageLoadErrors.length}`);
    console.log(`Total Extraction Warnings: ${this.extractionWarnings.length}`);
    
    if (this.httpErrors.length > 0) {
      console.log('\nHTTP Errors:');
      this.httpErrors.forEach(err => {
        console.log(`  - ${err.url}: ${err.statusCode} ${err.statusText}`);
      });
    }
    
    if (this.pageLoadErrors.length > 0) {
      console.log('\nPage Load Errors:');
      this.pageLoadErrors.forEach(err => {
        console.log(`  - ${err.url}: ${err.reason}`);
      });
    }
    
    if (this.extractionWarnings.length > 0) {
      console.log('\nExtraction Warnings:');
      this.extractionWarnings.forEach(warn => {
        console.log(`  - ${warn.url} [${warn.field}]: ${warn.reason}`);
      });
    }
    
    console.log('=============================\n');
  }
}

/**
 * Retry wrapper for page.goto with exponential backoff
 * Attempts up to 3 times with delays of 1s, 2s, 4s
 * Handles HTTP error codes 403/429/503 by logging and returning null
 * 
 * Usage example:
 * ```javascript
 * const browser = await chromium.launch();
 * const page = await browser.newPage();
 * const errorSummary = new ErrorSummary();
 * const response = await retryPageGoto(page, 'https://example.com', { 
 *   waitUntil: 'domcontentloaded', 
 *   timeout: 30000 
 * }, errorSummary);
 * if (response) {
 *   // Page loaded successfully
 *   const data = await scrapeOrganisation('https://example.com', page);
 * } else {
 *   // All retry attempts failed or HTTP error encountered
 *   console.error('Failed to load page');
 * }
 * ```
 * 
 * @param {Page} page - Playwright page object
 * @param {string} url - URL to navigate to
 * @param {Object} options - Navigation options (waitUntil, timeout, etc.)
 * @param {ErrorSummary} errorSummary - Error summary tracker (optional)
 * @returns {Promise<Response|null>} Navigation response or null on failure
 * Requirements: 8.1, 8.2
 */
export async function retryPageGoto(page, url, options = {}, errorSummary = null) {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempting to load ${url} (attempt ${attempt}/${maxAttempts})`);
      const response = await page.goto(url, options);
      
      // Check for HTTP error status codes
      if (response) {
        const status = response.status();
        
        // Handle 403 Forbidden
        if (status === 403) {
          const message = 'Access denied (403 Forbidden)';
          console.error(`${url}: ${message}`);
          if (errorSummary) {
            errorSummary.addHttpError(url, status, 'Forbidden');
          }
          return null;
        }
        
        // Handle 429 Rate Limited
        if (status === 429) {
          const message = 'Rate limited (429 Too Many Requests)';
          console.error(`${url}: ${message}`);
          if (errorSummary) {
            errorSummary.addHttpError(url, status, 'Too Many Requests');
          }
          return null;
        }
        
        // Handle 503 Service Unavailable
        if (status === 503) {
          const message = 'Service unavailable (503)';
          console.error(`${url}: ${message}`);
          if (errorSummary) {
            errorSummary.addHttpError(url, status, 'Service Unavailable');
          }
          return null;
        }
      }
      
      console.log(`Successfully loaded ${url} on attempt ${attempt}`);
      return response;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
      
      if (attempt < maxAttempts) {
        const delay = delays[attempt - 1];
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        const message = `Failed after ${maxAttempts} attempts: ${error.message}`;
        console.error(`${url}: ${message}`);
        if (errorSummary) {
          errorSummary.addPageLoadError(url, message);
        }
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Extract structured data from JSON-LD and microdata
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object|null>} Structured data object or null
 */
export async function extractStructuredData(page) {
  try {
    // Try to extract JSON-LD structured data
    const jsonLdData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          
          // Handle both single objects and arrays
          const items = Array.isArray(data) ? data : [data];
          
          // Look for Organization schema
          for (const item of items) {
            if (item['@type'] === 'Organization' || 
                (Array.isArray(item['@type']) && item['@type'].includes('Organization'))) {
              return {
                name: item.name || null,
                description: item.description || null,
                sameAs: item.sameAs || null,
                url: item.url || null
              };
            }
          }
        } catch (e) {
          // Skip malformed JSON
          continue;
        }
      }
      
      return null;
    });
    
    if (jsonLdData) {
      return jsonLdData;
    }
    
    // Try to extract microdata (basic support)
    const microdataOrg = await page.evaluate(() => {
      const orgElement = document.querySelector('[itemtype*="schema.org/Organization"]');
      if (!orgElement) return null;
      
      const getName = () => {
        const nameEl = orgElement.querySelector('[itemprop="name"]');
        return nameEl ? nameEl.textContent.trim() : null;
      };
      
      const getDescription = () => {
        const descEl = orgElement.querySelector('[itemprop="description"]');
        return descEl ? descEl.textContent.trim() : null;
      };
      
      const getSameAs = () => {
        const links = Array.from(orgElement.querySelectorAll('[itemprop="sameAs"]'));
        return links.length > 0 ? links.map(l => l.href || l.textContent.trim()) : null;
      };
      
      return {
        name: getName(),
        description: getDescription(),
        sameAs: getSameAs(),
        url: null
      };
    });
    
    return microdataOrg;
    
  } catch (error) {
    console.warn(`Structured data extraction failed: ${error.message}`);
    return null;
  }
}

/**
 * Check if title is invalid (error pages, access denied, etc.)
 * @param {string} title - Page title to check
 * @returns {boolean} True if title is invalid
 */
function isInvalidTitle(title) {
  if (!title || title.trim().length === 0) return true;
  
  const lowerTitle = title.toLowerCase().trim();
  const invalidPatterns = [
    'access denied',
    'forbidden',
    '403',
    '404',
    '500',
    'error',
    'not found',
    'page not found',
    'unauthorized',
    '401',
    'bad request',
    '400',
    'service unavailable',
    '503',
    'gateway timeout',
    '504',
    'too many requests',
    '429'
  ];
  
  return invalidPatterns.some(pattern => lowerTitle.includes(pattern));
}

/**
 * Extract root domain from URL
 * @param {string} url - Full URL
 * @returns {string} Root domain URL (e.g., https://www.difc.com/)
 */
function extractRootDomain(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/`;
  } catch (error) {
    console.warn(`Failed to extract root domain from ${url}: ${error.message}`);
    return url;
  }
}

/**
 * Extract organization name using multiple strategies
 * Priority: root domain title > og:title > h1 > JSON-LD
 * @param {Page} page - Playwright page object
 * @param {string} url - Current page URL
 * @param {Browser} browser - Playwright browser instance (optional, for root domain fetching)
 * @returns {Promise<string|null>} Organization name or null
 */
export async function extractName(page, url, browser = null) {
  try {
    // Strategy 1: Try to get root domain title
    const rootDomain = extractRootDomain(url);
    
    // If we're not already on the root domain, navigate to it
    if (rootDomain !== url && browser) {
      try {
        console.log(`   🌐 Fetching root domain title from: ${rootDomain}`);
        
        // Create a new page from the browser (not from page.context())
        const rootPage = await browser.newPage();
        
        // Wait longer for page to load completely
        await rootPage.goto(rootDomain, { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        });
        
        // Wait a bit more for dynamic content
        await rootPage.waitForTimeout(2000);
        
        const rootTitle = await rootPage.title();
        await rootPage.close();
        
        if (rootTitle && rootTitle.trim().length > 0) {
          // Check if title is invalid (error page, access denied, etc.)
          if (isInvalidTitle(rootTitle)) {
            console.log(`   ❌ Invalid title detected: "${rootTitle}" - skipping`);
            return null;
          }
          
          console.log(`   ✅ Using root domain title: ${rootTitle.trim()}`);
          return rootTitle.trim();
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch root domain title: ${error.message}`);
        // Continue to fallback strategies
      }
    } else {
      // We're already on root domain, use current page title
      const pageTitle = await page.title();
      if (pageTitle && pageTitle.trim().length > 0) {
        // Check if title is invalid
        if (isInvalidTitle(pageTitle)) {
          console.log(`   ❌ Invalid title detected: "${pageTitle}" - skipping`);
          return null;
        }
        return pageTitle.trim();
      }
    }
    
    // Strategy 2: Try Open Graph title from current page
    const ogTitle = await page.evaluate(() => {
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      return ogTitleMeta ? ogTitleMeta.content.trim() : null;
    });
    
    if (ogTitle && ogTitle.length > 0 && !isInvalidTitle(ogTitle)) {
      return ogTitle;
    }
    
    // Strategy 3: Try first H1 element from current page
    const h1Text = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : null;
    });
    
    if (h1Text && h1Text.length > 0 && !isInvalidTitle(h1Text)) {
      return h1Text;
    }
    
    // Strategy 4: Try JSON-LD structured data from current page
    const structuredData = await extractStructuredData(page);
    if (structuredData && structuredData.name && !isInvalidTitle(structuredData.name)) {
      return structuredData.name;
    }
    
    // All strategies failed
    return null;
    
  } catch (error) {
    console.warn(`Name extraction failed: ${error.message}`);
    return null;
  }
}

/**
 * Extract organization description using multiple strategies
 * Priority: meta description > og:description > first p > JSON-LD
 * @param {Page} page - Playwright page object
 * @returns {Promise<string|null>} Organization description or null
 */
export async function extractDescription(page) {
  try {
    // Strategy 1: Try meta description tag
    const metaDescription = await page.evaluate(() => {
      const metaDesc = document.querySelector('meta[name="description"]');
      return metaDesc ? metaDesc.content.trim() : null;
    });
    
    if (metaDescription && metaDescription.length > 20) {
      return metaDescription;
    }
    
    // Strategy 2: Try Open Graph description
    const ogDescription = await page.evaluate(() => {
      const ogDesc = document.querySelector('meta[property="og:description"]');
      return ogDesc ? ogDesc.content.trim() : null;
    });
    
    if (ogDescription && ogDescription.length > 20) {
      return ogDescription;
    }
    
    // Strategy 3: Try first substantial paragraph
    const firstParagraph = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      for (const p of paragraphs) {
        const text = p.textContent.trim();
        if (text.length > 20) {
          return text;
        }
      }
      return null;
    });
    
    if (firstParagraph && firstParagraph.length > 20) {
      return firstParagraph;
    }
    
    // Strategy 4: Try JSON-LD structured data
    const structuredData = await extractStructuredData(page);
    if (structuredData && structuredData.description && structuredData.description.length > 20) {
      return structuredData.description;
    }
    
    // All strategies failed
    return null;
    
  } catch (error) {
    console.warn(`Description extraction failed: ${error.message}`);
    return null;
  }
}

/**
 * Extract Twitter handle using multiple strategies
 * Validates handle matches pattern @[A-Za-z0-9_]{1,15}
 * @param {Page} page - Playwright page object
 * @returns {Promise<string|null>} Twitter handle (with @) or null
 */
export async function extractTwitter(page) {
  try {
    // Strategy 1: Search for Twitter/X links in anchor tags
    const twitterFromLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]'));
      
      for (const link of links) {
        const href = link.href;
        // Extract handle from URL patterns like:
        // https://twitter.com/username
        // https://x.com/username
        // https://twitter.com/intent/user?screen_name=username
        
        const match = href.match(/(?:twitter\.com|x\.com)\/(?:intent\/user\?screen_name=)?([A-Za-z0-9_]{1,15})(?:\/|$|\?)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return null;
    });
    
    if (twitterFromLinks) {
      const handle = twitterFromLinks.startsWith('@') ? twitterFromLinks : `@${twitterFromLinks}`;
      // Validate pattern
      if (/^@[A-Za-z0-9_]{1,15}$/.test(handle)) {
        return handle;
      }
    }
    
    // Strategy 2: Search in social media sections (common class names)
    const twitterFromSocial = await page.evaluate(() => {
      const socialSections = document.querySelectorAll(
        '[class*="social"], [class*="footer-social"], [class*="connect"], [id*="social"]'
      );
      
      for (const section of socialSections) {
        const links = section.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
        for (const link of links) {
          const href = link.href;
          const match = href.match(/(?:twitter\.com|x\.com)\/(?:intent\/user\?screen_name=)?([A-Za-z0-9_]{1,15})(?:\/|$|\?)/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
      
      return null;
    });
    
    if (twitterFromSocial) {
      const handle = twitterFromSocial.startsWith('@') ? twitterFromSocial : `@${twitterFromSocial}`;
      if (/^@[A-Za-z0-9_]{1,15}$/.test(handle)) {
        return handle;
      }
    }
    
    // Strategy 3: Try JSON-LD structured data sameAs array
    const structuredData = await extractStructuredData(page);
    if (structuredData && structuredData.sameAs) {
      const sameAsArray = Array.isArray(structuredData.sameAs) 
        ? structuredData.sameAs 
        : [structuredData.sameAs];
      
      for (const url of sameAsArray) {
        if (typeof url === 'string' && (url.includes('twitter.com') || url.includes('x.com'))) {
          const match = url.match(/(?:twitter\.com|x\.com)\/(?:intent\/user\?screen_name=)?([A-Za-z0-9_]{1,15})(?:\/|$|\?)/);
          if (match && match[1]) {
            const handle = `@${match[1]}`;
            if (/^@[A-Za-z0-9_]{1,15}$/.test(handle)) {
              return handle;
            }
          }
        }
      }
    }
    
    // All strategies failed or no valid handle found
    return null;
    
  } catch (error) {
    console.warn(`Twitter extraction failed: ${error.message}`);
    return null;
  }
}

/**
 * Main scraping orchestrator
 * Extracts comprehensive organization data from a web page
 * @param {string} url - URL to scrape
 * @param {Page} page - Playwright page object (already navigated)
 * @param {Browser} browser - Playwright browser instance (for root domain fetching)
 * @returns {Promise<Object>} Organization data object
 */
export async function scrapeOrganisation(url, page, browser = null) {
  try {
    const data = {
      name: await extractName(page, url, browser),
      website: url,
      description: await extractDescription(page),
      twitter: await extractTwitter(page),
      country: "United Arab Emirates",
      structuredData: await extractStructuredData(page)
    };
    
    return data;
    
  } catch (error) {
    console.error(`Failed to scrape ${url}: ${error.message}`);
    // Return minimal data with nulls
    return {
      name: null,
      website: url,
      description: null,
      twitter: null,
      country: "United Arab Emirates",
      structuredData: null
    };
  }
}
