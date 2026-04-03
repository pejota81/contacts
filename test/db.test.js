'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path   = require('node:path');
const fs     = require('node:fs');
const os     = require('node:os');

// Use a temp file for the test database so tests are isolated.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'contacts-test-'));
const DB_FILE = path.join(tmpDir, 'test.db');

process.env.DB_PATH = DB_FILE;

// Re-require db after setting DB_PATH.
const db = require('../src/db');

describe('db layer', () => {
  after(() => {
    db.closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('upsertContact', () => {
    it('inserts a new contact and returns it', () => {
      const contact = db.upsertContact({
        source:      'linkedin',
        external_id: 'li-001',
        name:        'Alice Smith',
        email:       'alice@example.com',
        profile_url: 'https://linkedin.com/in/alice',
        photo_url:   null,
        raw_data:    JSON.stringify({ id: 'li-001' }),
      });

      assert.equal(contact.source, 'linkedin');
      assert.equal(contact.external_id, 'li-001');
      assert.equal(contact.name, 'Alice Smith');
      assert.equal(contact.email, 'alice@example.com');
      assert.ok(contact.id > 0);
    });

    it('updates an existing contact on conflict (same source + external_id)', () => {
      db.upsertContact({
        source:      'linkedin',
        external_id: 'li-001',
        name:        'Alice Smith (updated)',
        email:       'alice-new@example.com',
        profile_url: null,
        photo_url:   null,
        raw_data:    null,
      });

      const contacts = db.listContactsBySource('linkedin');
      const alice = contacts.find(c => c.external_id === 'li-001');
      assert.equal(alice.name, 'Alice Smith (updated)');
      assert.equal(alice.email, 'alice-new@example.com');
    });

    it('inserts contacts from different sources independently', () => {
      db.upsertContact({
        source:      'facebook',
        external_id: 'fb-100',
        name:        'Bob Jones',
        email:       'bob@example.com',
        profile_url: 'https://facebook.com/bob',
        photo_url:   null,
        raw_data:    null,
      });

      db.upsertContact({
        source:      'instagram',
        external_id: 'ig-200',
        name:        'carol_ig',
        email:       null,
        profile_url: 'https://instagram.com/carol_ig',
        photo_url:   null,
        raw_data:    null,
      });

      const all = db.listContacts();
      const sources = all.map(c => c.source);
      assert.ok(sources.includes('facebook'));
      assert.ok(sources.includes('instagram'));
    });
  });

  describe('listContacts', () => {
    it('returns all contacts', () => {
      const contacts = db.listContacts();
      assert.ok(contacts.length >= 3);
    });
  });

  describe('listContactsBySource', () => {
    it('returns only contacts for the given source', () => {
      const contacts = db.listContactsBySource('facebook');
      assert.ok(contacts.length >= 1);
      contacts.forEach(c => assert.equal(c.source, 'facebook'));
    });

    it('returns empty array for a source with no contacts', () => {
      const contacts = db.listContactsBySource('nonexistent');
      assert.deepEqual(contacts, []);
    });
  });

  describe('deleteContact', () => {
    it('removes the contact from the database', () => {
      const inserted = db.upsertContact({
        source:      'facebook',
        external_id: 'fb-999',
        name:        'Temp User',
        email:       null,
        profile_url: null,
        photo_url:   null,
        raw_data:    null,
      });

      const result = db.deleteContact(inserted.id);
      assert.equal(result.changes, 1);

      const remaining = db.listContacts();
      const found = remaining.find(c => c.id === inserted.id);
      assert.equal(found, undefined);
    });

    it('returns 0 changes when deleting a non-existent id', () => {
      const result = db.deleteContact(99999);
      assert.equal(result.changes, 0);
    });
  });
});
