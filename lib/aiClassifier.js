import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. LOAD & CLEAN KEYS
const RAW_KEYS = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
let API_KEYS = RAW_KEYS.split(",").map(k => k.trim()).filter(k => k.length > 0);
let currentKeyIndex = 0; // Pointer for Round Robin

// 2. MODEL CONFIGURATION (Fallback Order)
const MODELS = [
    "nvidia/nemotron-3-nano-30b-a3b:free",      // Primary
    "meta-llama/llama-3.3-70b-instruct:free",   // Fallback 1
    "google/gemini-2.0-flash-exp:free"          // Fallback 2
];

// --- HELPER: GET NEXT KEY (ROUND ROBIN) ---
function getRotatedKey() {
    if (API_KEYS.length === 0) return null;
    
    // Pick current, then move pointer forward
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length; 
    return key;
}

// --- HELPER: REMOVE DEAD KEY ---
function removeKey(deadKey) {
    console.warn(`⚠️ Removing dead key from pool: ...${deadKey.slice(-4)}`);
    API_KEYS = API_KEYS.filter(k => k !== deadKey);
    // Adjust pointer if needed
    if (currentKeyIndex >= API_KEYS.length) currentKeyIndex = 0;
}

// --- CORE: API CALLER ---
async function callOpenRouter(orgData, modelId, apiKey) {
    const prompt = `
      Analyze this organization for the UAE Startup Ecosystem.
      Name: "${orgData.name}"
      Description: "${orgData.description}"
      Website: "${orgData.website}"
      
      Task: Return ONLY valid JSON:
      {
        "isEcosystemOrg": true/false,
        "type": "startup" | "vc" | "incubator" | "government" | "other",
        "category": "NETWORKING & COMMUNITY" | "TALENT & EDUCATION" | "FUNDING & FINANCE" | "SUPPORT INFRASTRUCTURE" | "GROWTH & INNOVATION" | "POLICY & PUBLIC AGENCIES",
        "role_summary": "Short 1-sentence summary"
      }
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://uae-bot.local",
            "X-Title": "UAE Ecosystem Bot"
        },
        body: JSON.stringify({
            model: modelId,
            messages: [{ role: "system", content: "You are a JSON-only classifier." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });

    if (response.status === 429 || response.status === 402) throw new Error("KEY_LIMIT");
    if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

// --- MAIN EXPORT ---
export async function classifyWithAI(orgData) {
    // Try looping through available keys until one works
    // We limit attempts to avoid infinite loops if all keys are dead
    let attempts = 0;
    const maxAttempts = API_KEYS.length * MODELS.length + 2; 

    while (attempts < maxAttempts) {
        if (API_KEYS.length === 0) {
            console.error("❌ All API keys are dead/exhausted.");
            return null;
        }

        // 1. Pick Key (Round Robin)
        const activeKey = getRotatedKey();
        
        // 2. Pick Model (Try primary, then fallbacks if needed inside this key loop)
        for (const modelId of MODELS) {
            try {
                // console.log(`   🔑 Using Key ending ...${activeKey.slice(-4)} with ${modelId}`);
                const result = await callOpenRouter(orgData, modelId, activeKey);
                return result; // Success!

            } catch (err) {
                if (err.message === "KEY_LIMIT") {
                    // Key is dead -> Remove it and break to outer loop to get a NEW key
                    removeKey(activeKey);
                    break; // Break model loop, go back to key loop
                } else {
                    // Model is just busy -> Try next model with SAME key
                    console.log(`      ⚠️ ${modelId} busy/failed. Trying next model...`);
                }
            }
        }
        attempts++;
    }

    return null;
}