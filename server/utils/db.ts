import Database from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

let _db: Database.Database | null = null;

export type Db = Database.Database;

export function getDb(): Db {
  if (_db) return _db;
  const path = process.env.DB_PATH ?? './data/icons.db';
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  _db = db;
  return db;
}

export const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS icons (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  slug            TEXT    NOT NULL,
  category        TEXT    NOT NULL DEFAULT '',
  description     TEXT    NOT NULL DEFAULT '',
  tags_json       TEXT    NOT NULL DEFAULT '[]',
  tags_text       TEXT    NOT NULL DEFAULT '',
  svg             TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT,
  deleted_reason  TEXT
);

CREATE INDEX IF NOT EXISTS idx_icons_created_at ON icons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icons_deleted_at ON icons(deleted_at);

CREATE VIRTUAL TABLE IF NOT EXISTS icons_fts USING fts5(
  name, tags, category, description,
  content='icons', content_rowid='id',
  tokenize='trigram'
);

CREATE TRIGGER IF NOT EXISTS icons_ai AFTER INSERT ON icons BEGIN
  INSERT INTO icons_fts(rowid, name, tags, category, description)
  VALUES (new.id, new.name, new.tags_text, new.category, new.description);
END;

CREATE TRIGGER IF NOT EXISTS icons_ad AFTER DELETE ON icons BEGIN
  INSERT INTO icons_fts(icons_fts, rowid, name, tags, category, description)
  VALUES ('delete', old.id, old.name, old.tags_text, old.category, old.description);
END;

CREATE TRIGGER IF NOT EXISTS icons_au AFTER UPDATE ON icons BEGIN
  INSERT INTO icons_fts(icons_fts, rowid, name, tags, category, description)
  VALUES ('delete', old.id, old.name, old.tags_text, old.category, old.description);
  INSERT INTO icons_fts(rowid, name, tags, category, description)
  VALUES (new.id, new.name, new.tags_text, new.category, new.description);
END;
`;

export function runMigrations(db: Db): void {
  const cols = db.prepare('PRAGMA table_info(icons)').all() as Array<{
    name: string;
  }>;
  const names = new Set(cols.map(c => c.name));
  const tableExists = cols.length > 0;
  const hasDescription = names.has('description');
  const hasDeletedAt = names.has('deleted_at');

  const needsRebuild = tableExists && (!hasDescription || !hasDeletedAt);
  if (!needsRebuild) {
    db.exec(MIGRATIONS_SQL);
    return;
  }

  db.exec('BEGIN');
  try {
    db.exec(`
      DROP TRIGGER IF EXISTS icons_ai;
      DROP TRIGGER IF EXISTS icons_ad;
      DROP TRIGGER IF EXISTS icons_au;
      DROP TABLE IF EXISTS icons_fts;
    `);

    db.exec(`
      CREATE TABLE icons_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            TEXT    NOT NULL,
        slug            TEXT    NOT NULL,
        category        TEXT    NOT NULL DEFAULT '',
        description     TEXT    NOT NULL DEFAULT '',
        tags_json       TEXT    NOT NULL DEFAULT '[]',
        tags_text       TEXT    NOT NULL DEFAULT '',
        svg             TEXT    NOT NULL,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        deleted_at      TEXT,
        deleted_reason  TEXT
      );
    `);

    const descExpr = hasDescription ? 'description' : "''";
    db.exec(`
      INSERT INTO icons_new
        (id, name, slug, category, description, tags_json, tags_text, svg, created_at, updated_at)
      SELECT
        id, name, slug, category, ${descExpr}, tags_json, tags_text, svg, created_at, updated_at
      FROM icons;
    `);

    db.exec('DROP TABLE icons');
    db.exec('ALTER TABLE icons_new RENAME TO icons');

    db.exec(MIGRATIONS_SQL);

    db.exec(`
      INSERT INTO icons_fts(rowid, name, tags, category, description)
      SELECT id, name, tags_text, category, description
      FROM icons WHERE deleted_at IS NULL;
    `);

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function assertFts5(db: Db): void {
  // Will throw if FTS5 is unavailable.
  db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'icons_fts'").get();
}

export function resetDbForTests(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
