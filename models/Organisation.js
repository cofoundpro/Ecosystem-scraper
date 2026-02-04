import mongoose from "mongoose";

const OrganisationSchema = new mongoose.Schema({
  // CORE IDENTITY
  name: { type: String, required: true, unique: true, trim: true },
  website: { type: String, trim: true, lowercase: true },
  country: { type: String, required: true, default: "United Arab Emirates" },
  
  // CLASSIFICATION (Matches your CSV columns)
  roles: [String],        // e.g. ["Delivers funding awards..."]
  categories: [String],   // e.g. ["NETWORKING & COMMUNITY"]
  subcategories: [String],// e.g. ["Events & Awards"]
  
  // METADATA (For the Bot to manage quality)
  description: { type: String, default: null },    // Raw scraped text
  source: {
    sourceName: { type: String, default: null },   // e.g. "hub71", "universal_scraper"
    sourceUrl: { type: String, default: null },    // Where we found it
    lastSyncedAt: { type: Date, default: null },
    aiProvider: { type: String, default: null },   // e.g. "openrouter", "huggingface", "moonshot"
    aiModel: { type: String, default: null }       // Specific model used for classification
  },
  status: {
    isActive: { type: Boolean, default: false },
    publishTier: { type: String, enum: ['A', 'B', 'C'], default: 'C' },
    trustScore: { type: Number, default: 0 },
    trustReasons: [String],
    confidence: { type: Number, default: null },   // AI confidence score 0.0-1.0
    needsReview: { type: Boolean, default: false } // Flag for manual review
  },
  
  // SOCIALS
  twitter: { type: String, default: null }
}, { 
  timestamps: true // Adds createdAt, updatedAt automatically
});

// Index for fast lookups
OrganisationSchema.index({ website: 1 });
OrganisationSchema.index({ "source.sourceUrl": 1 });
OrganisationSchema.index({ country: 1 });
OrganisationSchema.index({ "status.needsReview": 1 });

export default mongoose.models.Organisation || mongoose.model("Organisation", OrganisationSchema);