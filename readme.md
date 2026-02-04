
## Installation

```bash
# Clone repository
git clone <repository-url>
cd uae-bot

# Install dependencies
npm install
# or (prefered)
pnpm install - Install dependencies
Configure .env with API keys
pnpm start - Run scraper

#(this is not needed but can be adjusted to serve different function, it currently edits the existing DB enteries to match cofoundery's, one provided by ziyad)
npm run migrate - Run migration 
```

---

## Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   ```bash
   # MongoDB connection
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp
   
   # OpenRouter API keys (comma-separated for multiple keys)
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2
   
   # Cerebras API keys
   CEREBRAS_API_KEYS=csk-key1,csk-key2
   
   # Moonshot AI API keys
   MOONSHOT_API_KEYS=sk-moonshot-key1,sk-moonshot-key2
   ```

3. **Get API Keys:**
   - OpenRouter: https://openrouter.ai/keys
   - Cerebras: https://cloud.cerebras.ai/
   - Moonshot: https://platform.moonshot.cn/console/api-keys

---

## Usage

### Run the Scraper

```bash
node index.mjs
```

This will:
- Scrape 13 target URLs
- Extract organization data
- Classify with AI
- Validate and save to MongoDB
- Generate report in `reports/` folder



This will:
- Fetch all organizations from database
- Update names to match root domain titles
- Delete records with invalid titles
- Validate all records against current schema
- Reclassify invalid records with AI
- Delete records that cannot be fixed


---
### Reports

Generated in `reports/` folder:
- `Scrape_Report_[timestamp].md` - Summary of scraping run
- `review_queue_[timestamp].json` - Failed validations for manual review

---

## AI Classification

### Categories & Subcategories

Organizations are classified into 6 main categories:

1. **NETWORKING & COMMUNITY**
   - General Business Community & Membership
   - Events & Awards
   - Sector-Specific Networks

2. **TALENT & EDUCATION**
   - Universities & Research Institutions
   - Training & Skills Development
   - Entrepreneurship Education

3. **FUNDING & FINANCE**
   - Venture Capital & Private Equity
   - Angel Syndicates & Networks
   - Public & Development Banks
   - Crowdfunding Platforms

4. **SUPPORT INFRASTRUCTURE**
   - Generalist Incubators & Accelerators
   - Coworking & Workspace Providers
   - Business Support Services

5. **GROWTH & INNOVATION**
   - Innovation Centres (Sector-Focused)
   - Corporate Innovation Programs
   - Technology Transfer Offices

6. **POLICY & PUBLIC AGENCIES**
   - National & Regional Enterprise Agencies
   - Local Government Authorities
   - Regulatory Bodies

### Confidence Scoring

- AI returns confidence score (0.0 - 1.0)
- Organizations with confidence < 0.7 are flagged for review
- Confidence score stored in database for transparency

---

## Key Features Explained

### Root Domain Title Extraction

When scraping a subpage like `https://www.difc.com/ecosystem/innovation-hub`, the bot:
1. Extracts root domain: `https://www.difc.com/`
2. Navigates to root domain
3. Fetches the original website title
4. Uses that as the organization name

This ensures organization names are accurate, not subpage titles.

### Invalid Title Detection

Automatically detects and skips:
- Error pages ("404", "500", "Error")
- Access denied pages ("403", "Forbidden", "Access Denied")
- Service unavailable ("503", "Service Unavailable")

Organizations with invalid titles are not added to the database.

### Multi-Provider AI Fallback

If OpenRouter fails or is rate-limited:
1. Automatically tries Cerebras
2. If Cerebras fails, tries Moonshot
3. If all fail, saves organization without AI classification (flagged for review)

### Smart Provider Rotation

The bot uses an intelligent rotation strategy to maximize throughput:

**Rotation Cycle:**
- Cerebras: 10 requests (fastest, highest limit)
- OpenRouter: 10 requests (free tier, good quality)
- Moonshot: 2 requests (lowest limit, use sparingly)
- Then repeats the cycle

**Fallback Logic:**
- If the selected provider fails, automatically tries other providers
- Ensures continuous operation even if one provider is down
- Tracks rotation progress: `Provider rotation: cerebras (7/10)`

### Rate Limiting

Built-in rate limiting respects provider limits:
- **Cerebras**: 30 requests/minute (2 second delay between requests)
- **OpenRouter**: 20 requests/minute (3 second delay between requests)
- **Moonshot**: 3 requests/minute (20 second delay between requests)

The bot automatically waits between requests to avoid hitting rate limits.


## What It Does

Automatically scrapes UAE startup ecosystem websites, extracts organization data, classifies them using AI, validates the data, and stores it in MongoDB.

**Key Features:**
- Scrapes 13 authoritative UAE ecosystem sources
- Extracts organization names from root domains (not subpages)
- Skips error pages and invalid titles automatically
- AI-powered classification with 3-tier fallback system
- Validates all data before saving to prevent dirty data
- Tracks data provenance (source, AI provider, confidence scores)

---

## How It Works

```
1. SCRAPING (using Playwright)
   ├─ Visit target URLs (13 UAE ecosystem sources)
   ├─ Extract root domain title as organization name
   ├─ Skip invalid titles (error pages, access denied)
   ├─ Extract description, Twitter handle, structured data
   └─ Use retry logic with exponential backoff (1s, 2s, 4s)

2. AI CLASSIFICATION (Smart Rotation)
   ├─ Cerebras: 10 requests (30 RPM, fastest, primary)
   ├─ OpenRouter: 10 requests (20 RPM, free tier)
   ├─ Moonshot: 2 requests (3 RPM, lowest limit)
   ├─ Repeat cycle: Cerebras → OpenRouter → Moonshot
   └─ Fallback to other providers if selected one fails

3. VALIDATION
   ├─ Validate URLs, categories, subcategories, required fields
   ├─ Add failed validations to review queue
   └─ Only save validated data to MongoDB

4. STORAGE
   ├─ Database: uae_ecosystem_db
   ├─ Collection: organisations
   ├─ Upsert logic (update existing or create new)
   └─ Track source metadata and AI provider used
```

---

## Technology Stack

**Runtime & Language:**
- Node.js (v18+)
- JavaScript (ES Modules)

**Browser Automation:**
- Playwright Extra (with Stealth Plugin)
- Bypasses bot detection
- Randomizes browser fingerprints
- Hides automation indicators

**Database:**
- MongoDB Atlas
- Database: `uae_ecosystem_db`
- Collection: `organisations`

**AI Providers (with smart rotation):**
1. **Cerebras** (Primary - 10 requests per cycle)
   - Model: `gpt-oss-120b`
   - Rate limit: 30 requests/minute (2 second delay between requests)
   - Ultra-fast inference (~150ms)
   
2. **OpenRouter** (Secondary - 10 requests per cycle)
   - Models: `arcee-ai/trinity-large-preview:free`, `google/gemma-3-4b-it:free`
   - Rate limit: 20 requests/minute (3 second delay between requests)
   - Free tier with rate limits
   
3. **Moonshot AI** (Tertiary - 2 requests per cycle)
   - Models: `kimi-k2-0905-preview`, `moonshot-v1-32k`
   - Rate limit: 3 requests/minute (20 second delay between requests)
   - Chinese AI provider

**Rotation Pattern:** Cerebras (10) → OpenRouter (10) → Moonshot (2) → Repeat

**Key Libraries:**
- Mongoose (MongoDB ODM)
- dotenv (Environment config)
- Playwright Extra (Web scraping with stealth)
- Puppeteer Stealth Plugin (Bot detection bypass)

---

## Project Structure

```
uae-bot/
├── index.mjs                      # Main entry point
├── audit-and-fix-db.mjs           # Database audit script (gitignored)
├── package.json                   # Dependencies
├── .env                           # API keys (gitignored)
├── .env.example                   # Environment template
├── readme.md                      # This file
├── UAE-organisations.json         # Target schema reference
│
├── lib/
│   ├── enhanced-scraper.js        # Multi-strategy scraper
│   ├── multi-provider-classifier.js # AI with fallback
│   ├── validator.js               # Data validation
│   └── reporter.js                # Report generator
│
├── models/
│   └── Organisation.js            # MongoDB schema
│
├── scripts/
│   └── migrate-schema.js          # Database migration
│
└── reports/                       # Generated reports (gitignored)
    ├── Scrape_Report_*.md
    └── review_queue_*.json
```


**Version:** 3.1.0  
**Last Updated:** February 4, 2026
