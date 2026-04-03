'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'contacts.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      source      TEXT    NOT NULL CHECK(source IN ('linkedin','facebook','instagram')),
      external_id TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      email       TEXT,
      profile_url TEXT,
      photo_url   TEXT,
      raw_data    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source, external_id)
    );
  `);
}

/**
 * Upsert a contact imported from a social network.
 * Returns the contact row after insert-or-replace.
 */
function upsertContact({ source, external_id, name, email, profile_url, photo_url, raw_data }) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO contacts (source, external_id, name, email, profile_url, photo_url, raw_data, updated_at)
    VALUES (@source, @external_id, @name, @email, @profile_url, @photo_url, @raw_data, datetime('now'))
    ON CONFLICT(source, external_id) DO UPDATE SET
      name        = excluded.name,
      email       = excluded.email,
      profile_url = excluded.profile_url,
      photo_url   = excluded.photo_url,
      raw_data    = excluded.raw_data,
      updated_at  = excluded.updated_at
  `);
  stmt.run({ source, external_id, name, email, profile_url, photo_url, raw_data });
  return database.prepare('SELECT * FROM contacts WHERE source = ? AND external_id = ?').get(source, external_id);
}

/**
 * Return all contacts, newest first.
 */
function listContacts() {
  return getDb().prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
}

/**
 * Return contacts filtered by source platform.
 */
function listContactsBySource(source) {
  return getDb().prepare('SELECT * FROM contacts WHERE source = ? ORDER BY created_at DESC').all(source);
}

/**
 * Delete a contact by id.
 */
function deleteContact(id) {
  return getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id);
}

/**
 * Close the database connection (useful for tests).
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, upsertContact, listContacts, listContactsBySource, deleteContact, closeDb };
