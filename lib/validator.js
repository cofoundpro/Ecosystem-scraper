/**
 * Validation Layer for Organisation Data
 * 
 * Validates organisation data before database save to prevent dirty data entry.
 * Implements validation rules from Requirements 5.1-5.5.
 */

// Taxonomy of allowed categories and subcategories
const TAXONOMY = {
  "NETWORKING & COMMUNITY": [
    "General Business Community & Membership",
    "Events & Awards",
    "Sector-Specific Networks"
  ],
  "TALENT & EDUCATION": [
    "Universities & Research Institutions",
    "Training & Skills Development",
    "Entrepreneurship Education"
  ],
  "FUNDING & FINANCE": [
    "Venture Capital & Private Equity",
    "Angel Syndicates & Networks",
    "Public & Development Banks",
    "Crowdfunding Platforms"
  ],
  "SUPPORT INFRASTRUCTURE": [
    "Generalist Incubators & Accelerators",
    "Coworking & Workspace Providers",
    "Business Support Services"
  ],
  "GROWTH & INNOVATION": [
    "Innovation Centres (Sector-Focused)",
    "Corporate Innovation Programs",
    "Technology Transfer Offices"
  ],
  "POLICY & PUBLIC AGENCIES": [
    "National & Regional Enterprise Agencies",
    "Local Government Authorities",
    "Regulatory Bodies"
  ]
};

/**
 * Validates a URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL format
 */
function isValidURL(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Pattern: https?://.+\..+
  const urlPattern = /^https?:\/\/.+\..+/;
  return urlPattern.test(url);
}

/**
 * Validates a Twitter handle format
 * @param {string} handle - Twitter handle to validate
 * @returns {boolean} - True if valid Twitter handle format
 */
function isValidTwitterHandle(handle) {
  if (!handle || typeof handle !== 'string') return false;
  
  // Pattern: @?[A-Za-z0-9_]{1,15}
  const twitterPattern = /^@?[A-Za-z0-9_]{1,15}$/;
  return twitterPattern.test(handle);
}

/**
 * Validates a category against the TAXONOMY
 * @param {string} category - Category to validate
 * @returns {boolean} - True if category is in TAXONOMY
 */
function isValidCategory(category) {
  if (!category || typeof category !== 'string') return false;
  return Object.keys(TAXONOMY).includes(category);
}

/**
 * Validates a subcategory against the TAXONOMY
 * @param {string} subcategory - Subcategory to validate
 * @returns {boolean} - True if subcategory is in TAXONOMY
 */
function isValidSubcategory(subcategory) {
  if (!subcategory || typeof subcategory !== 'string') return false;
  
  // Check if subcategory exists in any category's subcategory list
  const allSubcategories = Object.values(TAXONOMY).flat();
  return allSubcategories.includes(subcategory);
}

/**
 * Validates an organisation object before database save
 * @param {Object} org - Organisation object to validate
 * @returns {Object} - Validation result with valid flag and errors array
 */
function validateOrganisation(org) {
  const errors = [];
  
  // Validate required fields exist
  if (!org) {
    return {
      valid: false,
      errors: ['Organisation object is required']
    };
  }
  
  // Validate name (required)
  if (!org.name || typeof org.name !== 'string' || org.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }
  
  // Validate website (required, must be valid URL format)
  if (!org.website) {
    errors.push('website is required');
  } else if (!isValidURL(org.website)) {
    errors.push('website has invalid format (must match pattern: https?://.+\\..+)');
  }
  
  // Validate country (required)
  if (!org.country || typeof org.country !== 'string' || org.country.trim().length === 0) {
    errors.push('country is required');
  }
  
  // Validate twitter (optional, but if present must be valid format)
  if (org.twitter !== null && org.twitter !== undefined) {
    if (!isValidTwitterHandle(org.twitter)) {
      errors.push('twitter has invalid format (must match pattern: @?[A-Za-z0-9_]{1,15})');
    }
  }
  
  // Validate categories (required, must be array with at least one valid category)
  if (!Array.isArray(org.categories)) {
    errors.push('categories must be an array');
  } else if (org.categories.length === 0) {
    errors.push('categories must contain at least one category');
  } else {
    // Validate each category
    for (const category of org.categories) {
      if (!isValidCategory(category)) {
        errors.push(`categories contains invalid category: ${category}`);
      }
    }
  }
  
  // Validate subcategories (required, must be array with at least one valid subcategory)
  if (!Array.isArray(org.subcategories)) {
    errors.push('subcategories must be an array');
  } else if (org.subcategories.length === 0) {
    errors.push('subcategories must contain at least one subcategory');
  } else {
    // Validate each subcategory
    for (const subcategory of org.subcategories) {
      if (!isValidSubcategory(subcategory)) {
        errors.push(`subcategories contains invalid subcategory: ${subcategory}`);
      }
    }
  }
  
  // Validate roles (required, must be array with at least one role)
  if (!Array.isArray(org.roles)) {
    errors.push('roles must be an array');
  } else if (org.roles.length === 0) {
    errors.push('roles must contain at least one role');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Review queue for organisations that fail validation
 * Stores organisations with their validation errors for manual review
 */
let reviewQueue = [];

/**
 * Adds an organisation to the review queue
 * @param {Object} org - Organisation object that failed validation
 * @param {Array<string>} validationErrors - Array of validation error messages
 */
function addToReviewQueue(org, validationErrors) {
  reviewQueue.push({
    organisation: org,
    errors: validationErrors,
    timestamp: new Date(),
    status: "pending_review"
  });
}

/**
 * Saves the review queue to a JSON file in the reports directory
 * @returns {string} - Path to the saved review queue file
 */
async function saveReviewQueue() {
  if (reviewQueue.length === 0) {
    console.log('Review queue is empty, no file created');
    return null;
  }
  
  const fs = await import('fs');
  const path = await import('path');
  
  const filename = `review_queue_${Date.now()}.json`;
  const filepath = path.join('reports', filename);
  
  fs.writeFileSync(filepath, JSON.stringify(reviewQueue, null, 2));
  console.log(`Review queue saved: ${filepath} (${reviewQueue.length} items)`);
  
  return filepath;
}

/**
 * Gets the current review queue
 * @returns {Array} - Array of review queue items
 */
function getReviewQueue() {
  return reviewQueue;
}

/**
 * Clears the review queue
 */
function clearReviewQueue() {
  reviewQueue = [];
}

// Export functions and constants
export {
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
};
