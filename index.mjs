import mongoose from "mongoose";
import dotenv from "dotenv";
import { chromium } from "playwright";
import Organisation from "./models/Organisation.js";
import { scrapeOrganisation, retryPageGoto, ErrorSummary } from "./lib/enhanced-scraper.js";
import { classifyWithAI, initializeKeyPools } from "./lib/multi-provider-classifier.js";
import { validateOrganisation, addToReviewQueue, saveReviewQueue, clearReviewQueue } from "./lib/validator.js";
import { generateReport } from "./lib/reporter.js";

// Target URLs for scraping
const TARGET_URLS = [
  // Startup Emirates
  "https://startupemirates.ae/en/start-journey/",
  "https://startupemirates.ae/en/start-journey/#funding-support",
  "https://startupemirates.ae/en/start-journey/#incubators-accelerators",
  "https://startupemirates.ae/en/start-journey/#company-formation",
  
  // UAE Government
  "https://u.ae/en/information-and-services/business/business-incubators",
  "https://u.ae/en/information-and-services/business/small-and-medium-enterprises",
  
  // Dubai Chamber & Founders HQ
  "https://www.dubaichamber.com/en/business-groups-and-councils",
  "https://www.dubaifoundershq.com/en/launch-your-business/incubators-in-dubai",
  "https://www.dubaifoundershq.com/en/network",
  
  // Female Fusion Network & Hub71
  "https://www.femalefusionnetwork.com/",
  "https://www.hub71.com/investors",
  "https://www.hub71.com/partners",
  
  // Government Portal
  "https://www.moet.gov.ae/en/entrepreneurship-support-entities"
]; 

// 1. CONFIGURATION
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://emaileatup:9ogpX2adYNa2@cluster0.wklgg.mongodb.net/?appName=Cluster0";

// 2. DATABASE CONNECTION
async function dbConnect() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGO_URI, { dbName: "uae_ecosystem_db" });
    console.log("✅ Connected to MongoDB Atlas");
}

// 3. THE SMART PROCESSOR WITH VALIDATION
async function processOrganisation(orgData, aiResult = null) {
    // 1. Prepare the processed data fields
    let finalCategory = aiResult?.category || 'GROWTH & INNOVATION';
    let finalSubcategory = aiResult?.subcategory || 'General Entity';
    let finalRole = aiResult?.role_summary || 'Organisation pending classification';
    
    // Default Status
    let publishTier = 'C';
    let isActive = false;
    let trustScore = 10;
    let needsReview = true;

    // AI-Driven Status
    if (aiResult && !aiResult.degraded) {
        needsReview = aiResult.needsReview || aiResult.confidence < 0.7;
        
        if (aiResult.isEcosystemOrg) {
            isActive = true;
            if (aiResult.type === 'government' || aiResult.type === 'incubator') {
                publishTier = 'A';
                trustScore = 90;
            } else if (aiResult.type === 'startup' || aiResult.type === 'vc') {
                publishTier = 'B';
                trustScore = 70;
            }
        }
    }

    // 2. Build organisation object for validation
    const orgToValidate = {
        name: orgData.name,
        website: orgData.website,
        country: orgData.country || "United Arab Emirates",
        description: orgData.description || null,
        twitter: orgData.twitter || null,
        categories: [finalCategory],
        subcategories: [finalSubcategory],
        roles: [finalRole]
    };

    // 3. Validate before saving (Requirements 5.6, 5.7)
    const validationResult = validateOrganisation(orgToValidate);
    
    if (!validationResult.valid) {
        console.error(`❌ Validation failed for ${orgData.name}:`);
        validationResult.errors.forEach(err => console.error(`   - ${err}`));
        
        // Add to review queue (Requirement 5.7)
        addToReviewQueue(orgToValidate, validationResult.errors);
        
        // Do NOT save to database (Requirement 5.6)
        return null;
    }

    // 4. Deduplication Check (Update or Create)
    let existing = await Organisation.findOne({
        $or: [ { website: orgData.website }, { name: orgData.name } ]
    });

    if (existing) {
        console.log(`🔄 Updating: ${orgData.name}`);
        // Update fields with new data
        existing.name = orgToValidate.name;
        existing.website = orgToValidate.website;
        existing.country = orgToValidate.country;
        existing.description = orgToValidate.description;
        existing.twitter = orgToValidate.twitter;
        existing.categories = orgToValidate.categories;
        existing.subcategories = orgToValidate.subcategories;
        existing.roles = orgToValidate.roles;
        existing.status = {
            isActive: isActive,
            publishTier: publishTier,
            trustScore: trustScore,
            trustReasons: aiResult ? [`AI Classified as ${aiResult.type}`] : ["Manual/Scraper Entry"],
            confidence: aiResult?.confidence || null,
            needsReview: needsReview,
            aiResult: aiResult
        };
        existing.source.lastSyncedAt = new Date();
        existing.source.aiProvider = aiResult?.provider || null;
        existing.source.aiModel = aiResult?.model || null;
        return await existing.save();
    } 

    // 5. Create New
    console.log(`🆕 Creating: ${orgData.name}`);
    const newDoc = new Organisation({
        name: orgToValidate.name,
        website: orgToValidate.website,
        country: orgToValidate.country,
        description: orgToValidate.description,
        twitter: orgToValidate.twitter,
        categories: orgToValidate.categories,
        subcategories: orgToValidate.subcategories,
        roles: orgToValidate.roles,
        source: {
            sourceName: "enhanced_scraper",
            sourceUrl: orgData.website,
            lastSyncedAt: new Date(),
            aiProvider: aiResult?.provider || null,
            aiModel: aiResult?.model || null
        },
        status: {
            isActive: isActive,
            publishTier: publishTier,
            trustScore: trustScore,
            trustReasons: aiResult ? [`AI Classified as ${aiResult.type}`] : ["Manual/Scraper Entry"],
            confidence: aiResult?.confidence || null,
            needsReview: needsReview,
            aiResult: aiResult
        }
    });

    return await newDoc.save();
}

// 4. MAIN EXECUTION
async function main() {
    let browser = null;
    
    try {
        await dbConnect();
        
        // Initialize AI provider key pools
        initializeKeyPools();
        
        // Clear review queue from previous runs
        clearReviewQueue();
        
        // Initialize error summary tracker
        const errorSummary = new ErrorSummary();
        
        // Launch browser for scraping
        console.log('🚀 Launching browser...');
        browser = await chromium.launch({ headless: true });
        
        // Step 1: Scrape data from target URLs using enhanced scraper
        console.log(`📡 Scraping ${TARGET_URLS.length} target URLs...`);
        const scrapedData = [];
        
        for (const url of TARGET_URLS) {
            try {
                const page = await browser.newPage();
                
                // Use retry logic with exponential backoff (Requirements 8.1, 8.2)
                const response = await retryPageGoto(page, url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                }, errorSummary);
                
                if (!response) {
                    console.log(`⏭️  Skipping ${url} (failed to load)`);
                    await page.close();
                    continue;
                }
                
                // Extract data using enhanced scraper
                const orgData = await scrapeOrganisation(url, page);
                
                // Only process if we got a valid name
                if (orgData.name) {
                    scrapedData.push(orgData);
                    console.log(`✅ Scraped: ${orgData.name}`);
                } else {
                    console.log(`⚠️  No valid name found for ${url}`);
                    errorSummary.addExtractionWarning(url, 'name', 'No valid name extracted');
                }
                
                await page.close();
                
            } catch (error) {
                console.error(`❌ Error scraping ${url}: ${error.message}`);
                errorSummary.addPageLoadError(url, error.message);
            }
        }
        
        console.log(`\n📦 Scraped ${scrapedData.length} organisations from ${TARGET_URLS.length} URLs.`);
        
        // Step 2: Process & AI Classify
        const processedResults = [];
        const aiStats = {
            total: 0,
            successful: 0,
            degraded: 0,
            skipped: 0,
            byProvider: {
                openrouter: 0,
                huggingface: 0,
                moonshot: 0
            }
        };
        let savedCount = 0;
        let validationFailures = 0;

        for (const item of scrapedData) {
            try {
                // AI Classification (only if we have enough description)
                let aiResult = null;
                
                if (item.description && item.description.length > 10) {
                    console.log(`   🧠 AI Classifying: ${item.name}...`);
                    aiStats.total++;
                    
                    aiResult = await classifyWithAI(item);
                    
                    if (aiResult) {
                        aiStats.successful++;
                        
                        if (aiResult.degraded) {
                            aiStats.degraded++;
                        } else if (aiResult.provider) {
                            aiStats.byProvider[aiResult.provider]++;
                        }
                    }
                } else {
                    console.log(`   ⏩ Skipping AI for ${item.name} (Description too short)`);
                    aiStats.skipped++;
                }
                
                // Process with validation
                const savedDoc = await processOrganisation(item, aiResult);
                
                if (savedDoc) {
                    processedResults.push(savedDoc);
                    savedCount++;
                } else {
                    validationFailures++;
                }
                
            } catch (e) {
                console.error(`⚠️ Could not save ${item.name}:`, e.message);
            }
        }

        // Step 3: Save review queue if there are validation failures
        if (validationFailures > 0) {
            await saveReviewQueue();
        }
        
        // Step 4: Print error summary
        errorSummary.printSummary();
        
        // Step 5: Print AI classification statistics
        console.log('\n=== AI Classification Summary ===');
        console.log(`Total organisations: ${scrapedData.length}`);
        console.log(`AI classification attempts: ${aiStats.total}`);
        console.log(`AI successful: ${aiStats.successful}`);
        console.log(`AI degraded (default): ${aiStats.degraded}`);
        console.log(`AI skipped (no description): ${aiStats.skipped}`);
        console.log('\nBy Provider:');
        console.log(`  - OpenRouter: ${aiStats.byProvider.openrouter}`);
        console.log(`  - HuggingFace: ${aiStats.byProvider.huggingface}`);
        console.log(`  - Moonshot: ${aiStats.byProvider.moonshot}`);
        console.log('================================\n');
        
        // Step 6: Print validation summary
        console.log('=== Validation Summary ===');
        console.log(`Validation failures: ${validationFailures}`);
        console.log(`Successfully saved: ${savedCount}`);
        console.log('==========================\n');

        // Step 7: Generate Markdown Report
        if (processedResults.length > 0) {
            generateReport(processedResults, TARGET_URLS);
        }

        console.log(`\n✅ Run Complete. Processed ${savedCount} records.`);
        
        // Close browser
        if (browser) {
            await browser.close();
        }
        
        process.exit(0);

    } catch (e) {
        console.error("❌ Critical Error:", e);
        
        // Close browser on error
        if (browser) {
            await browser.close();
        }
        
        process.exit(1);
    }
}

main();