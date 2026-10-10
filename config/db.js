// Local, file-based database: no server to run, no network, no IP whitelist,
// no internet needed. Everything lives in ./data/cryptoguard.db (created
// automatically on first run). Delete that file to reset the app.
//
// Driver: uses better-sqlite3 when it installed fine; otherwise falls back to
// Node's built-in `node:sqlite` (Node 22.5+). So a native-build hiccup during
// `npm install` can never stop the app from running.
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || (process.env.VERCEL
  ? '/tmp/cryptoguard.db'
  : path.join(__dirname, '..', 'data', 'cryptoguard.db'));

let db;
let driver;
try {
  if (process.env.DB_DRIVER === 'node') throw new Error('node:sqlite forced via DB_DRIVER');
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  driver = 'better-sqlite3';
} catch (firstErr) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    driver = 'node:sqlite';
  } catch (secondErr) {
    console.error('\nCould not start the local database.');
    console.error(' - better-sqlite3:', firstErr.message);
    console.error(' - node:sqlite   :', secondErr.message);
    console.error('\nFix: use Node.js 22 or newer (https://nodejs.org), then run `npm install` again.\n');
    process.exit(1);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phoneNumber TEXT NOT NULL,
    country TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    kycStatus TEXT NOT NULL DEFAULT 'none',
    usdBalance REAL NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS holdings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin TEXT NOT NULL,
    network TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    UNIQUE(userId, coin, network)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    coin TEXT,
    network TEXT,
    amount REAL,
    usdAmount REAL,
    feeCoin TEXT,
    feeAmount REAL,
    toCoin TEXT,
    toNetwork TEXT,
    toAmount REAL,
    bankDetails TEXT,
    walletAddress TEXT,
    rejectionReason TEXT,
    seenByUser INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    resolvedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS deposit_addresses (
    id TEXT PRIMARY KEY,
    coin TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    UNIQUE(coin, network)
  );

  CREATE TABLE IF NOT EXISTS support_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email TEXT DEFAULT '',
    whatsapp TEXT DEFAULT ''
  );
`);

// All-or-nothing wrapper: if anything inside throws, every change is rolled
// back, so balances can never end up half-updated.
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) { /* already rolled back */ }
    throw err;
  }
}

module.exports = { db, transaction, driver, DB_PATH };
