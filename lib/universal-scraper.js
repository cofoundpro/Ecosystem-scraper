import { chromium } from "playwright";

// The Scottish Schema Mapping
const SCOTTISH_SCHEMA = {
    "NETWORKING": "NETWORKING & COMMUNITY", 
    "TALENT": "TALENT & EDUCATION",
    "FUNDING": "FUNDING & FINANCE",
    "SUPPORT": "SUPPORT INFRASTRUCTURE", 
    "GROWTH": "GROWTH & INNOVATION",
    "POLICY": "POLICY & PUBLIC AGENCIES"
};

// 1. FULL LIST OF TARGETS (Live URLs)
// Updated list from Requirements 11.1-11.13 (18 authoritative UAE ecosystem sources)
const TARGET_URLS = [
    // Dubai Founders HQ - Ecosystem & Investor Directories
    "https://ecosystem.dubaifoundershq.com/intro",
    "https://ecosystem.dubaifoundershq.com/investors/f/all_slug_locations/anyof_dubai?heatMapType=&selectedColumns=name%2CpreferredRound%2ChqLocations%2CdealSizeEnhanced%2CinvestorNumberOfRoundsIndustry%2CinvestorTotalFundingEnhanced%2CinvestorPorfolioSize%2CinvestmentsValuationEnhanced%2Cinvestments%2CinvestorExitsNum%2CinvestorExitScore%2CinvestorExitsFundingEnhanced%2ClpInvestmentsNum%2ClpInvestments&sort=-rounds_count_all_time",
    
    // Startup Emirates - Journey Pages
    "https://startupemirates.ae/en/start-journey/",
    "https://startupemirates.ae/en/start-journey/#funding-support",
    "https://startupemirates.ae/en/start-journey/#incubators-accelerators",
    "https://startupemirates.ae/en/start-journey/#company-formation",
    
    // UAE Government - Business Resources
    "https://u.ae/en/information-and-services/business/business-incubators",
    "https://u.ae/en/information-and-services/business/small-and-medium-enterprises",
    
    // Dubai Chamber & Founders HQ - Business Groups & Network
    "https://www.dubaichamber.com/en/business-groups-and-councils",
    "https://www.dubaifoundershq.com/en/launch-your-business/incubators-in-dubai",
    "https://www.dubaifoundershq.com/en/network",
    
    // Dubai Future Foundation & Female Fusion Network
    "https://www.dubaifuture.ae",
    "https://www.femalefusionnetwork.com/",
    
    // Hub71 - Investors, Partners & Explorer
    "https://www.hub71.com/investors",
    "https://www.hub71.com/partners",
    "https://explorer.hub71.com/",
    
    // Government Portals - Investment & Entrepreneurship
    "https://www.investindubai.gov.ae/en/",
    "https://www.moet.gov.ae/en/entrepreneurship-support-entities"
];

// 2. Hardcoded Entities (VCs & Policy Bodies)
const HARDCODED_ENTITIES = [
    { name: "Shorooq Partners", website: "https://shorooq.com", description: "Leading MENA tech investor (Pre-Series A to B)." },
    { name: "BECO Capital", website: "https://beco.vc", description: "Early-stage VC focused on technology and growth capital." },
    { name: "Middle East Venture Partners (MEVP)", website: "https://mevp.com", description: "Diversified MENA VC firm investing in GCC and Levant." },
    { name: "Global Ventures", website: "https://global.vc", description: "Growth-stage VC focused on enterprise tech." },
    { name: "Wamda Capital", website: "https://wamda.com", description: "Sector-agnostic investment vehicle investing in high-growth tech." },
    { name: "VentureSouq", website: "https://venturesouq.com", description: "Dubai-based VC firm with over 140 investments." },
    { name: "Nuwa Capital", website: "https://nuwacapital.io", description: "Thesis-driven investment firm for the MENA region." },
    { name: "Dubai Angel Investors", website: "https://dubaiangelinvestors.com", description: "Member-led micro-VC investment company." },
    { name: "National Programme for SMEs", website: "https://uaesme.ae", description: "Federal program offering procurement allocation and support." }
];

function determineCategory(text) {
    const t = text.toLowerCase();
    if (t.includes("fund") || t.includes("invest") || t.includes("venture") || t.includes("capital")) return SCOTTISH_SCHEMA.FUNDING;
    if (t.includes("incubator") || t.includes("accelerator") || t.includes("coworking") || t.includes("lab")) return SCOTTISH_SCHEMA.SUPPORT;
    if (t.includes("government") || t.includes("policy") || t.includes("ministry")) return SCOTTISH_SCHEMA.POLICY;
    if (t.includes("university") || t.includes("training") || t.includes("education")) return SCOTTISH_SCHEMA.TALENT;
    if (t.includes("network") || t.includes("community") || t.includes("event")) return SCOTTISH_SCHEMA.NETWORKING;
    return SCOTTISH_SCHEMA.GROWTH; 
}

export async function fetchUniversalTargets() {
    console.log("🚀 Launching Universal Scraper (Playwright with MS Edge)...");
    
    // --- CHANGED TO 'msedge' ---
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'msedge' // <--- USES YOUR WINDOWS EDGE BROWSER
    }); 
    
    // --- UPDATED USER AGENT TO MATCH EDGE ---
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
    });

    const results = [];

    // Part A: Scrape Live URLs
    for (const url of TARGET_URLS) {
        console.log(`🔎 Scraping: ${url}`);
        try {
            const page = await context.newPage();
            // Short timeout to skip slow sites
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            const title = await page.title();
            let description = "";
            try {
                description = await page.$eval("meta[name='description']", el => el.content);
            } catch (e) {
                try { description = await page.$eval("h1", el => el.innerText); } catch(e2) {}
            }

            // CLEANING & FILTERING
            const cleanName = title.split('|')[0].split('-')[0].trim();
            
            // ❌ FILTER: Skip Bad Pages
            if (!cleanName || 
                cleanName.includes("Access Denied") || 
                cleanName.includes("403") || 
                cleanName.includes("Just a moment") ||
                cleanName.includes("Attention Required")) {
                console.warn(`   ⚠️ Blocked/Invalid Page: ${url}`);
                await page.close();
                continue;
            }

            const category = determineCategory(description + " " + cleanName);

            results.push({
                name: cleanName,
                website: url,
                description: description || "No description found",
                categories: [category],
                subcategories: ["General Entity"],
                roles: [description.substring(0, 200)],
                source: {
                    sourceName: "universal_scraper",
                    sourceUrl: url
                }
            });
            await page.close();

        } catch (err) {
            console.error(`❌ Failed ${url}: ${err.message}`);
        }
    }

    // Part B: Add Hardcoded Entities
    console.log("📦 Adding Hardcoded VCs & Agencies...");
    HARDCODED_ENTITIES.forEach(entity => {
        results.push({
            name: entity.name,
            website: entity.website,
            description: entity.description,
            categories: ["FUNDING & FINANCE"], 
            subcategories: ["Venture Capital"],
            roles: [entity.description],
            source: {
                sourceName: "hardcoded_list",
                sourceUrl: entity.website
            }
        });
    });

    await browser.close();
    return results;
}

// Export TARGET_URLS for reporting purposes
export { TARGET_URLS };