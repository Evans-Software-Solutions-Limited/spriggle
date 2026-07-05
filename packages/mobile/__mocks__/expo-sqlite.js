// Manual Jest mock for `expo-sqlite`.
//
// expo-sqlite is a native module and cannot run under the jest-expo (Node)
// preset. This mock implements the subset of the async SQLiteDatabase API the
// app uses, backed by Node's built-in in-memory SQLite (`node:sqlite`), so
// persistence tests exercise real SQL (DDL, INSERT, ORDER BY, UPSERT).
//
// Each `openDatabaseAsync` / `openDatabaseSync` call returns an isolated
// in-memory database.
const { DatabaseSync } = require("node:sqlite");

function normalizeParams(params) {
  // expo-sqlite accepts either (source, ...params) or (source, paramsArray).
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

class MockSQLiteDatabase {
  constructor(db) {
    this._db = db;
  }

  async execAsync(source) {
    this._db.exec(source);
  }

  async runAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    const result = stmt.run(...normalizeParams(params));
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }

  async getAllAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    return stmt.all(...normalizeParams(params));
  }

  async getFirstAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    const row = stmt.get(...normalizeParams(params));
    return row === undefined ? null : row;
  }

  async closeAsync() {
    this._db.close();
  }
}

async function openDatabaseAsync() {
  return new MockSQLiteDatabase(new DatabaseSync(":memory:"));
}

function openDatabaseSync() {
  return new MockSQLiteDatabase(new DatabaseSync(":memory:"));
}

module.exports = {
  openDatabaseAsync,
  openDatabaseSync,
  MockSQLiteDatabase,
};
