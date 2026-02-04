/**
 * Multi-Provider AI Classifier
 * 
 * Supports multiple AI providers (OpenRouter, HuggingFace, Moonshot AI) with
 * intelligent fallback and round-robin API key rotation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

// Provider configuration with endpoints, models, rate limits, and environment variable names
const PROVIDERS = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      "arcee-ai/trinity-large-preview:free",
      "google/gemma-3-4b-it:free"
    ],
    keyEnvVar: "OPENROUTER_API_KEYS",
    rateLimit: {
      requestsPerMinute: 20,
      delayBetweenRequests: 3000 // 3 seconds between requests (20 per minute)
    }
  },
  cerebras: {
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    models: [
      "gpt-oss-120b"
    ],
    keyEnvVar: "CEREBRAS_API_KEYS",
    rateLimit: {
      requestsPerMinute: 30,
      delayBetweenRequests: 2000 // 2 seconds between requests (30 per minute)
    }
  },
  moonshot: {
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    models: [
      "kimi-k2-0905-preview",
      "moonshot-v1-32k"
    ],
    keyEnvVar: "MOONSHOT_API_KEYS",
    rateLimit: {
      requestsPerMinute: 3,
      delayBetweenRequests: 20000 // 20 seconds between requests (3 per minute)
    }
  }
};

// Round-robin key pointers for each provider
const keyPointers = {
  openrouter: 0,
  cerebras: 0,
  moonshot: 0
};

// Active key pools for each provider (loaded from environment)
const keyPools = {
  openrouter: [],
  cerebras: [],
  moonshot: []
};

// Rate limit tracking - stores last request timestamp for each provider
const lastRequestTime = {
  openrouter: 0,
  cerebras: 0,
  moonshot: 0
};

// Provider rotation tracking
// Pattern: Cerebras (10) → OpenRouter (10) → Moonshot (2) → repeat
const providerRotation = {
  currentProvider: 'cerebras',
  requestCount: 0,
  limits: {
    cerebras: 10,
    openrouter: 10,
    moonshot: 2
  }
};

/**
 * Get the next provider to use based on rotation strategy
 * Pattern: Cerebras (10 requests) → OpenRouter (10 requests) → Moonshot (2 requests) → repeat
 * 
 * @returns {string} Provider name to use next
 */
function getNextProvider() {
  const { currentProvider, requestCount, limits } = providerRotation;
  
  // Check if current provider has reached its limit
  if (requestCount >= limits[currentProvider]) {
    // Move to next provider in rotation
    if (currentProvider === 'cerebras') {
      providerRotation.currentProvider = 'openrouter';
    } else if (currentProvider === 'openrouter') {
      providerRotation.currentProvider = 'moonshot';
    } else if (currentProvider === 'moonshot') {
      providerRotation.currentProvider = 'cerebras';
    }
    
    // Reset counter for new provider
    providerRotation.requestCount = 0;
  }
  
  return providerRotation.currentProvider;
}

/**
 * Increment the request count for current provider
 */
function incrementProviderCount() {
  providerRotation.requestCount++;
}

/**
 * Wait for rate limit delay before making next request
 * 
 * @param {string} provider - Provider name
 * @returns {Promise<void>}
 */
async function waitForRateLimit(provider) {
  const config = PROVIDERS[provider];
  if (!config || !config.rateLimit) return;
  
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime[provider];
  const requiredDelay = config.rateLimit.delayBetweenRequests;
  
  if (timeSinceLastRequest < requiredDelay) {
    const waitTime = requiredDelay - timeSinceLastRequest;
    console.log(`   ⏳ Rate limit: waiting ${(waitTime / 1000).toFixed(1)}s before ${provider} request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update last request time
  lastRequestTime[provider] = Date.now();
}

/**
 * Load API keys from environment variables
 * 
 * Reads comma-separated API keys from environment variables and populates
 * the key pools for each provider.
 * 
 * @param {string} envVarName - Name of the environment variable (e.g., "OPENROUTER_API_KEYS")
 * @returns {string[]} Array of API keys
 * 
 * Requirements: 4.4
 */
function loadKeys(envVarName) {
  const envValue = process.env[envVarName];
  
  if (!envValue) {
    return [];
  }
  
  // Split by comma and trim whitespace
  const keys = envValue
    .split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0);
  
  return keys;
}

/**
 * Get the next API key for a provider using round-robin strategy
 * 
 * Rotates through available keys for the specified provider to distribute
 * requests evenly and avoid rate limits on individual keys.
 * 
 * @param {string} provider - Provider name ("openrouter", "huggingface", "moonshot")
 * @param {string[]} keys - Array of available API keys for the provider
 * @returns {string|null} Next API key to use, or null if no keys available
 * 
 * Requirements: 4.5
 */
function getNextKey(provider, keys) {
  if (!keys || keys.length === 0) {
    return null;
  }
  
  // Get current key based on pointer
  const key = keys[keyPointers[provider]];
  
  // Advance pointer for next call (wrap around to 0 if at end)
  keyPointers[provider] = (keyPointers[provider] + 1) % keys.length;
  
  return key;
}

/**
 * Remove an exhausted API key from the pool
 * 
 * When a key hits rate limits or is exhausted, remove it from the active
 * pool so it won't be used again in this session.
 * 
 * @param {string} provider - Provider name ("openrouter", "huggingface", "moonshot")
 * @param {string} keyToRemove - The API key to remove from the pool
 * 
 * Requirements: 4.5
 */
function removeKey(provider, keyToRemove) {
  if (!keyPools[provider]) {
    return;
  }
  
  // Find and remove the key
  const index = keyPools[provider].indexOf(keyToRemove);
  if (index > -1) {
    keyPools[provider].splice(index, 1);
    
    // Reset pointer if it's now out of bounds
    if (keyPointers[provider] >= keyPools[provider].length) {
      keyPointers[provider] = 0;
    }
  }
}

/**
 * Initialize key pools from environment variables
 * 
 * Should be called once at startup to load all API keys from environment.
 */
function initializeKeyPools() {
  for (const [providerName, config] of Object.entries(PROVIDERS)) {
    keyPools[providerName] = loadKeys(config.keyEnvVar);
    console.log(`Loaded ${keyPools[providerName].length} API keys for ${providerName}`);
  }
}

/**
 * Build the classification prompt for AI providers
 * 
 * @param {Object} orgData - Organisation data with name, description, website
 * @returns {string} Formatted prompt for AI classification
 */
function buildClassificationPrompt(orgData) {
  return `Analyze this organization for the UAE Startup Ecosystem.
Name: "${orgData.name || 'Unknown'}"
Description: "${orgData.description || 'No description available'}"
Website: "${orgData.website || 'Unknown'}"

Task: Return ONLY valid JSON with these exact fields:
{
  "isEcosystemOrg": true/false,
  "type": "startup" | "vc" | "incubator" | "government" | "community" | "other",
  "category": "NETWORKING & COMMUNITY" | "TALENT & EDUCATION" | "FUNDING & FINANCE" | "SUPPORT INFRASTRUCTURE" | "GROWTH & INNOVATION" | "POLICY & PUBLIC AGENCIES",
  "subcategory": "specific subcategory from allowed list",
  "role_summary": "One sentence describing their role in the ecosystem",
  "confidence": 0.0 to 1.0
}

Allowed subcategories by category:
- NETWORKING & COMMUNITY: General Business Community & Membership, Events & Awards, Sector-Specific Networks
- TALENT & EDUCATION: Universities & Research Institutions, Training & Skills Development, Entrepreneurship Education
- FUNDING & FINANCE: Venture Capital & Private Equity, Angel Syndicates & Networks, Public & Development Banks, Crowdfunding Platforms
- SUPPORT INFRASTRUCTURE: Generalist Incubators & Accelerators, Coworking & Workspace Providers, Business Support Services
- GROWTH & INNOVATION: Innovation Centres (Sector-Focused), Corporate Innovation Programs, Technology Transfer Offices
- POLICY & PUBLIC AGENCIES: National & Regional Enterprise Agencies, Local Government Authorities, Regulatory Bodies

Rules:
- Use ONLY information from the provided description
- Do NOT infer or generate missing data
- Set confidence based on description quality
- If description is unclear, set confidence < 0.7
- Return ONLY the JSON object, no additional text`;
}

/**
 * Parse and validate AI response
 * 
 * @param {string} responseText - Raw response text from AI provider
 * @returns {Object|null} Parsed classification result or null if invalid
 */
function parseAIResponse(responseText) {
  try {
    // Try to extract JSON from response (some models add extra text)
    let jsonText = responseText.trim();
    
    // If response contains markdown code blocks, extract JSON
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Try to find JSON object if there's extra text
    const objectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonText = objectMatch[0];
    }
    
    const result = JSON.parse(jsonText);
    
    // Validate required fields
    if (typeof result.isEcosystemOrg !== 'boolean') return null;
    if (!result.category || typeof result.category !== 'string') return null;
    if (!result.subcategory || typeof result.subcategory !== 'string') return null;
    if (!result.role_summary || typeof result.role_summary !== 'string') return null;
    if (typeof result.confidence !== 'number') return null;
    
    // Ensure confidence is between 0 and 1
    result.confidence = Math.max(0, Math.min(1, result.confidence));
    
    return result;
  } catch (err) {
    console.error('Failed to parse AI response:', err.message);
    return null;
  }
}

/**
 * Call OpenRouter API for classification
 * 
 * @param {Object} orgData - Organisation data to classify
 * @returns {Object|null} Classification result or null if failed
 * 
 * Requirements: 4.1, 4.8
 */
async function callOpenRouter(orgData) {
  const config = PROVIDERS.openrouter;
  const keys = keyPools.openrouter;
  
  if (keys.length === 0) {
    console.log('No OpenRouter API keys available');
    return null;
  }
  
  const prompt = buildClassificationPrompt(orgData);
  
  // Try each model with round-robin key rotation
  for (const model of config.models) {
    const key = getNextKey('openrouter', keys);
    if (!key) continue;
    
    try {
      // Wait for rate limit before making request
      await waitForRateLimit('openrouter');
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://github.com/uae-ecosystem-bot',
          'X-Title': 'UAE Ecosystem Bot'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      if (response.status === 429) {
        console.log(`OpenRouter rate limit hit for key, rotating...`);
        removeKey('openrouter', key);
        continue;
      }
      
      if (!response.ok) {
        console.error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenRouter response format');
        continue;
      }
      
      // Handle both regular content and reasoning models
      const message = data.choices[0].message;
      const content = message.content || message.reasoning || '';
      
      if (!content) {
        console.error('No content or reasoning in OpenRouter response');
        continue;
      }
      
      const result = parseAIResponse(content);
      
      if (result) {
        return {
          ...result,
          provider: 'openrouter',
          model: model
        };
      }
      
      console.log(`OpenRouter model ${model} returned invalid response, trying next model...`);
    } catch (err) {
      console.error(`OpenRouter API call failed: ${err.message}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Call HuggingFace API for classification
 * 
 * @param {Object} orgData - Organisation data to classify
 * @returns {Object|null} Classification result or null if failed
 * 
 * Requirements: 4.2, 4.8
 */
async function callHuggingFace(orgData) {
  const config = PROVIDERS.huggingface;
  const keys = keyPools.huggingface;
  
  if (keys.length === 0) {
    console.log('No HuggingFace API keys available');
    return null;
  }
  
  const prompt = buildClassificationPrompt(orgData);
  
  // Try each model with round-robin key rotation
  for (const model of config.models) {
    const key = getNextKey('huggingface', keys);
    if (!key) continue;
    
    try {
      const endpoint = `${config.endpoint}/${model}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            temperature: 0.3,
            max_new_tokens: 500,
            return_full_text: false
          }
        })
      });
      
      if (response.status === 429) {
        console.log(`HuggingFace rate limit hit for key, rotating...`);
        removeKey('huggingface', key);
        continue;
      }
      
      if (!response.ok) {
        console.error(`HuggingFace API error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // HuggingFace returns array of results
      let content;
      if (Array.isArray(data) && data[0]) {
        content = data[0].generated_text || data[0].text || '';
      } else if (data.generated_text) {
        content = data.generated_text;
      } else {
        console.error('Invalid HuggingFace response format');
        continue;
      }
      
      const result = parseAIResponse(content);
      
      if (result) {
        return {
          ...result,
          provider: 'huggingface',
          model: model
        };
      }
      
      console.log(`HuggingFace model ${model} returned invalid response, trying next model...`);
    } catch (err) {
      console.error(`HuggingFace API call failed: ${err.message}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Call Cerebras API for classification
 * 
 * @param {Object} orgData - Organisation data to classify
 * @returns {Object|null} Classification result or null if failed
 */
async function callCerebras(orgData) {
  const config = PROVIDERS.cerebras;
  const keys = keyPools.cerebras;
  
  if (keys.length === 0) {
    console.log('No Cerebras API keys available');
    return null;
  }
  
  const prompt = buildClassificationPrompt(orgData);
  
  // Try each model with round-robin key rotation
  for (const model of config.models) {
    const key = getNextKey('cerebras', keys);
    if (!key) continue;
    
    try {
      // Wait for rate limit before making request
      await waitForRateLimit('cerebras');
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });
      
      if (response.status === 429) {
        console.log(`Cerebras rate limit hit for key, rotating...`);
        removeKey('cerebras', key);
        continue;
      }
      
      if (!response.ok) {
        console.error(`Cerebras API error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid Cerebras response format');
        continue;
      }
      
      const content = data.choices[0].message.content;
      const result = parseAIResponse(content);
      
      if (result) {
        return {
          ...result,
          provider: 'cerebras',
          model: model
        };
      }
      
      console.log(`Cerebras model ${model} returned invalid response, trying next model...`);
    } catch (err) {
      console.error(`Cerebras API call failed: ${err.message}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Call Moonshot API for classification
 * 
 * @param {Object} orgData - Organisation data to classify
 * @returns {Object|null} Classification result or null if failed
 * 
 * Requirements: 4.3, 4.8
 */
async function callMoonshot(orgData) {
  const config = PROVIDERS.moonshot;
  const keys = keyPools.moonshot;
  
  if (keys.length === 0) {
    console.log('No Moonshot API keys available');
    return null;
  }
  
  const prompt = buildClassificationPrompt(orgData);
  
  // Try each model with round-robin key rotation
  for (const model of config.models) {
    const key = getNextKey('moonshot', keys);
    if (!key) continue;
    
    try {
      // Wait for rate limit before making request (20 seconds for Moonshot - 3 RPM)
      await waitForRateLimit('moonshot');
      
      // Kimi models only support temperature: 1
      const temperature = model.startsWith('kimi-') ? 1 : 0.3;
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: temperature,
          max_tokens: 500
        })
      });
      
      if (response.status === 429) {
        console.log(`Moonshot rate limit hit for key, rotating...`);
        removeKey('moonshot', key);
        continue;
      }
      
      if (!response.ok) {
        console.error(`Moonshot API error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid Moonshot response format');
        continue;
      }
      
      const content = data.choices[0].message.content;
      const result = parseAIResponse(content);
      
      if (result) {
        return {
          ...result,
          provider: 'moonshot',
          model: model
        };
      }
      
      console.log(`Moonshot model ${model} returned invalid response, trying next model...`);
    } catch (err) {
      console.error(`Moonshot API call failed: ${err.message}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Create default classification for graceful degradation
 * 
 * When all AI providers are exhausted, this function returns a default
 * classification that allows the organisation to be saved without AI data.
 * The organisation will be flagged for manual review.
 * 
 * This implements graceful degradation as specified in Requirement 8.4:
 * "WHEN all API keys are exhausted, THE System SHALL save organisations 
 * without AI classification"
 * 
 * The default classification:
 * - Sets isEcosystemOrg to false (conservative default)
 * - Uses generic category "GROWTH & INNOVATION" 
 * - Uses generic subcategory "General Entity"
 * - Provides a role_summary indicating manual review is needed
 * - Sets confidence to 0.0 (no AI confidence)
 * - Sets needsReview to true (requires manual classification)
 * - Sets degraded flag to true (indicates fallback was used)
 * - Sets provider and model to null (no AI provider was used)
 * 
 * Usage example:
 * ```javascript
 * // When all providers fail, graceful degradation is automatic
 * const result = await classifyWithAI(orgData);
 * if (result.degraded) {
 *   console.log('Using default classification - needs manual review');
 * }
 * 
 * // To disable graceful degradation and get null instead:
 * const result = await classifyWithAI(orgData, { enableGracefulDegradation: false });
 * if (result === null) {
 *   console.log('All providers failed and no default was provided');
 * }
 * ```
 * 
 * @param {Object} orgData - Organisation data
 * @returns {Object} Default classification result
 * 
 * Requirements: 8.4
 */
function createDefaultClassification(orgData) {
  return {
    isEcosystemOrg: false,
    type: 'other',
    category: 'GROWTH & INNOVATION',
    subcategory: 'General Entity',
    role_summary: 'Organisation pending manual classification and review',
    confidence: 0.0,
    provider: null,
    model: null,
    needsReview: true,
    degraded: true // Flag to indicate this is a fallback classification
  };
}

/**
 * Main classification function with smart provider rotation
 * 
 * Uses a rotation strategy to distribute load across providers:
 * - Cerebras: 10 requests (30 RPM, fastest)
 * - OpenRouter: 10 requests (20 RPM, free tier)
 * - Moonshot: 2 requests (3 RPM, lowest limit)
 * Then repeats the cycle.
 * 
 * Falls back to other providers if the selected one fails.
 * Returns default classification if all providers fail (graceful degradation).
 * 
 * @param {Object} orgData - Organisation data to classify
 * @param {string} orgData.name - Organisation name
 * @param {string} orgData.description - Organisation description
 * @param {string} orgData.website - Organisation website URL
 * @param {boolean} options.enableGracefulDegradation - If true, returns default classification when all providers fail. If false, returns null. Default: true
 * @returns {Object|null} Classification result with provider tracking, or default classification if all providers fail
 * 
 * Result format:
 * {
 *   isEcosystemOrg: boolean,
 *   type: string,
 *   category: string,
 *   subcategory: string,
 *   role_summary: string,
 *   confidence: number (0.0-1.0),
 *   provider: string ("openrouter" | "cerebras" | "moonshot") or null,
 *   model: string (specific model name used) or null,
 *   needsReview: boolean (true when confidence < 0.7 or degraded),
 *   degraded: boolean (true when using default classification)
 * }
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 8.4
 */
async function classifyWithAI(orgData, options = { enableGracefulDegradation: true }) {
  // Validate input
  if (!orgData || !orgData.name) {
    console.error('Invalid organisation data: name is required');
    return options.enableGracefulDegradation ? createDefaultClassification(orgData) : null;
  }
  
  console.log(`Classifying organisation: ${orgData.name}`);
  
  // Get next provider based on rotation strategy
  const primaryProvider = getNextProvider();
  
  // Map provider names to functions
  const providerFunctions = {
    cerebras: callCerebras,
    openrouter: callOpenRouter,
    moonshot: callMoonshot
  };
  
  // Create ordered list: primary provider first, then fallbacks
  const providerOrder = [primaryProvider];
  if (primaryProvider !== 'cerebras') providerOrder.push('cerebras');
  if (primaryProvider !== 'openrouter') providerOrder.push('openrouter');
  if (primaryProvider !== 'moonshot') providerOrder.push('moonshot');
  
  // Try providers in order
  for (const providerName of providerOrder) {
    try {
      const isPrimary = providerName === primaryProvider;
      console.log(`${isPrimary ? '🎯' : '🔄'} Attempting classification with ${providerName}...`);
      
      const result = await providerFunctions[providerName](orgData);
      
      if (result) {
        console.log(`✅ Successfully classified with ${providerName} (model: ${result.model}, confidence: ${result.confidence})`);
        
        // Increment counter only if using primary provider
        if (isPrimary) {
          incrementProviderCount();
          console.log(`   📊 Provider rotation: ${providerRotation.currentProvider} (${providerRotation.requestCount}/${providerRotation.limits[providerRotation.currentProvider]})`);
        }
        
        // Add needsReview flag based on confidence
        result.needsReview = result.confidence < 0.7;
        result.degraded = false;
        
        return result;
      }
      
      console.log(`❌ Provider ${providerName} failed or returned invalid result, trying next provider...`);
    } catch (err) {
      console.error(`❌ Provider ${providerName} threw error: ${err.message}`);
      // Continue to next provider
    }
  }
  
  // All providers failed - use graceful degradation
  console.error(`❌ All AI providers exhausted for organisation: ${orgData.name}`);
  
  if (options.enableGracefulDegradation) {
    console.log(`⚠️  Using default classification for ${orgData.name} (will be flagged for review)`);
    return createDefaultClassification(orgData);
  }
  
  return null;
}

export {
  PROVIDERS,
  loadKeys,
  getNextKey,
  removeKey,
  initializeKeyPools,
  keyPools,
  keyPointers,
  buildClassificationPrompt,
  parseAIResponse,
  callOpenRouter,
  callCerebras,
  callMoonshot,
  classifyWithAI,
  createDefaultClassification
};
