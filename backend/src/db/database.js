// This module provides a unified async database interface.
// Locally it uses SQLite (simple, no setup needed).
// In production on Railway it uses PostgreSQL (set DATABASE_URL env var).

const path = require('path');

let db; // will hold the adapter object

if (process.env.DATABASE_URL) {
  // --- PostgreSQL (production) ---
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Convert SQLite-style ? placeholders to PostgreSQL $1, $2 ...
  function toPostgres(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  db = {
    // Returns an array of rows
    query: async (sql, params = []) => {
      const result = await pool.query(toPostgres(sql), params);
      return result.rows;
    },
    // Returns a single row (or undefined)
    queryOne: async (sql, params = []) => {
      const result = await pool.query(toPostgres(sql), params);
      return result.rows[0];
    },
    // For INSERT / UPDATE / DELETE — returns { lastInsertRowid }
    run: async (sql, params = []) => {
      // RETURNING id lets us get the new row id back from PostgreSQL
      const returning = sql.trim().toUpperCase().startsWith('INSERT') ? ' RETURNING id' : '';
      const result = await pool.query(toPostgres(sql + returning), params);
      return { lastInsertRowid: result.rows[0]?.id };
    },
    // Runs multiple statements inside a single transaction
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await fn(client);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  };

  // Create tables on startup
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('checking','savings')),
      balance DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      type TEXT NOT NULL CHECK(type IN ('deposit','withdrawal','transfer_in','transfer_out','bill_payment')),
      amount DECIMAL(12,2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(console.error);

} else {
  // --- SQLite (local development) ---
  const Database = require('better-sqlite3');
  const sqlite = new Database(path.join(__dirname, '../../bank.db'));
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('checking','savings')),
      balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit','withdrawal','transfer_in','transfer_out','bill_payment')),
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
  `);

  db = {
    query:    async (sql, params = []) => sqlite.prepare(sql).all(...params),
    queryOne: async (sql, params = []) => sqlite.prepare(sql).get(...params),
    run:      async (sql, params = []) => sqlite.prepare(sql).run(...params),
    transaction: async (fn) => {
      const t = sqlite.transaction(fn);
      t(sqlite);
    },
  };
}

module.exports = db;
