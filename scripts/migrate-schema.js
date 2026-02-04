/**
 * Schema Migration Script
 * 
 * Migrates existing Organisation documents to the new schema:
 * - Adds country field with default "United Arab Emirates"
 * - Converts empty strings to null for optional fields
 * - Preserves existing tracking fields
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organisation from '../models/Organisation.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://emaileatup:9ogpX2adYNa2@cluster0.wklgg.mongodb.net/?appName=Cluster0";

/**
 * Migration statistics tracker
 */
class MigrationStats {
  constructor() {
    this.total = 0;
    this.countryAdded = 0;
    this.emptyStringsConverted = 0;
    this.alreadyMigrated = 0;
    this.errors = [];
  }

  addError(docId, error) {
    this.errors.push({ docId, error: error.message });
  }

  printReport() {
    console.log('\n=== Migration Report ===');
    console.log(`Total documents processed: ${this.total}`);
    console.log(`Country field added: ${this.countryAdded}`);
    console.log(`Empty strings converted to null: ${this.emptyStringsConverted}`);
    console.log(`Already migrated (no changes): ${this.alreadyMigrated}`);
    console.log(`Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nError Details:');
      this.errors.forEach(err => {
        console.log(`  - Document ${err.docId}: ${err.error}`);
      });
    }
    
    console.log('========================\n');
  }

  getReport() {
    return {
      total: this.total,
      countryAdded: this.countryAdded,
      emptyStringsConverted: this.emptyStringsConverted,
      alreadyMigrated: this.alreadyMigrated,
      errors: this.errors,
      success: this.errors.length === 0
    };
  }
}

/**
 * Migrate a single document
 * @param {Object} doc - Mongoose document to migrate
 * @param {MigrationStats} stats - Migration statistics tracker
 * @returns {Promise<boolean>} - True if document was modified
 */
async function migrateDocument(doc, stats) {
  let modified = false;
  
  try {
    // 1. Add country field if missing (Requirement 10.2)
    if (!doc.country) {
      doc.country = 'United Arab Emirates';
      stats.countryAdded++;
      modified = true;
      console.log(`  ✓ Added country field to: ${doc.name}`);
    }
    
    // 2. Convert empty strings to null for optional fields (Requirement 10.3)
    const optionalFields = ['twitter', 'description'];
    
    for (const field of optionalFields) {
      if (doc[field] === '') {
        doc[field] = null;
        stats.emptyStringsConverted++;
        modified = true;
        console.log(`  ✓ Converted empty ${field} to null for: ${doc.name}`);
      }
    }
    
    // 3. Save if modified (Requirement 10.4 - preserve existing tracking fields)
    if (modified) {
      await doc.save();
      return true;
    } else {
      stats.alreadyMigrated++;
      return false;
    }
    
  } catch (error) {
    console.error(`  ✗ Error migrating ${doc.name}: ${error.message}`);
    stats.addError(doc._id, error);
    return false;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  const stats = new MigrationStats();
  
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { dbName: 'uae_ecosystem_db' });
    console.log('✅ Connected to MongoDB\n');
    
    // Find all documents
    console.log('Finding documents to migrate...');
    const documents = await Organisation.find({});
    stats.total = documents.length;
    console.log(`Found ${stats.total} documents\n`);
    
    if (stats.total === 0) {
      console.log('No documents to migrate.');
      await mongoose.disconnect();
      return stats.getReport();
    }
    
    // Migrate each document
    console.log('Starting migration...\n');
    
    for (const doc of documents) {
      await migrateDocument(doc, stats);
    }
    
    // Print report
    stats.printReport();
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Migration complete. Disconnected from MongoDB.');
    
    return stats.getReport();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Ensure disconnection on error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(report => {
      if (report.errors.length > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runMigration, migrateDocument, MigrationStats };
