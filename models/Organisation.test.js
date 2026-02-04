import { describe, it } from 'node:test';
import assert from 'node:assert';
import Organisation from './Organisation.js';

describe('Organisation Schema Definition', () => {
  describe('Country Field', () => {
    it('should include country field with String type', () => {
      const schema = Organisation.schema.obj;
      assert.ok(schema.country, 'Country field should exist');
      assert.strictEqual(schema.country.type, String, 'Country field should be of type String');
    });

    it('should have country field as required', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.country.required, true, 'Country field should be required');
    });

    it('should have default value "United Arab Emirates"', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.country.default, "United Arab Emirates", 'Country field should default to "United Arab Emirates"');
    });
  });

  describe('Optional Fields with Null Defaults', () => {
    it('should set twitter field default to null', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.twitter.default, null, 'Twitter field should default to null');
    });

    it('should set description field default to null', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.description.default, null, 'Description field should default to null');
    });

    it('should set source.sourceName default to null', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.source.sourceName.default, null, 'Source.sourceName should default to null');
    });

    it('should set source.sourceUrl default to null', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.source.sourceUrl.default, null, 'Source.sourceUrl should default to null');
    });

    it('should set source.lastSyncedAt default to null', () => {
      const schema = Organisation.schema.obj;
      assert.strictEqual(schema.source.lastSyncedAt.default, null, 'Source.lastSyncedAt should default to null');
    });
  });

  describe('New Tracking Fields', () => {
    it('should include aiProvider field in source object', () => {
      const schema = Organisation.schema.obj;
      assert.ok(schema.source.aiProvider, 'Source.aiProvider field should exist');
      assert.strictEqual(schema.source.aiProvider.type, String, 'Source.aiProvider should be of type String');
      assert.strictEqual(schema.source.aiProvider.default, null, 'Source.aiProvider should default to null');
    });

    it('should include aiModel field in source object', () => {
      const schema = Organisation.schema.obj;
      assert.ok(schema.source.aiModel, 'Source.aiModel field should exist');
      assert.strictEqual(schema.source.aiModel.type, String, 'Source.aiModel should be of type String');
      assert.strictEqual(schema.source.aiModel.default, null, 'Source.aiModel should default to null');
    });

    it('should include confidence field in status object', () => {
      const schema = Organisation.schema.obj;
      assert.ok(schema.status.confidence, 'Status.confidence field should exist');
      assert.strictEqual(schema.status.confidence.type, Number, 'Status.confidence should be of type Number');
      assert.strictEqual(schema.status.confidence.default, null, 'Status.confidence should default to null');
    });

    it('should include needsReview field in status object', () => {
      const schema = Organisation.schema.obj;
      assert.ok(schema.status.needsReview, 'Status.needsReview field should exist');
      assert.strictEqual(schema.status.needsReview.type, Boolean, 'Status.needsReview should be of type Boolean');
      assert.strictEqual(schema.status.needsReview.default, false, 'Status.needsReview should default to false');
    });
  });

  describe('Schema Indexes', () => {
    it('should have index on website field', () => {
      const indexes = Organisation.schema.indexes();
      const websiteIndex = indexes.find(idx => idx[0].website === 1);
      assert.ok(websiteIndex, 'Should have index on website field');
    });

    it('should have index on source.sourceUrl field', () => {
      const indexes = Organisation.schema.indexes();
      const sourceUrlIndex = indexes.find(idx => idx[0]['source.sourceUrl'] === 1);
      assert.ok(sourceUrlIndex, 'Should have index on source.sourceUrl field');
    });

    it('should have index on country field', () => {
      const indexes = Organisation.schema.indexes();
      const countryIndex = indexes.find(idx => idx[0].country === 1);
      assert.ok(countryIndex, 'Should have index on country field');
    });

    it('should have index on status.needsReview field', () => {
      const indexes = Organisation.schema.indexes();
      const needsReviewIndex = indexes.find(idx => idx[0]['status.needsReview'] === 1);
      assert.ok(needsReviewIndex, 'Should have index on status.needsReview field');
    });
  });

  describe('Document Creation with Defaults', () => {
    it('should create document with country default when not provided', () => {
      const org = new Organisation({
        name: 'Test Organisation',
        website: 'https://test.com'
      });
      
      assert.strictEqual(org.country, "United Arab Emirates", 'Country should default to "United Arab Emirates"');
    });

    it('should create document with null values for optional fields', () => {
      const org = new Organisation({
        name: 'Test Organisation 2',
        website: 'https://test2.com'
      });
      
      assert.strictEqual(org.twitter, null, 'Twitter should be null');
      assert.strictEqual(org.description, null, 'Description should be null');
      assert.strictEqual(org.source.aiProvider, null, 'aiProvider should be null');
      assert.strictEqual(org.source.aiModel, null, 'aiModel should be null');
      assert.strictEqual(org.status.confidence, null, 'Confidence should be null');
    });

    it('should create document with needsReview defaulting to false', () => {
      const org = new Organisation({
        name: 'Test Organisation 3',
        website: 'https://test3.com'
      });
      
      assert.strictEqual(org.status.needsReview, false, 'needsReview should default to false');
    });
  });
});
