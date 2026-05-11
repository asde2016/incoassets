import { getDb } from '~/server/utils/db';

export type IconRow = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  tagsJson: string;
  svg: string;
  createdAt: string;
  deletedAt: string | null;
  deletedReason: string | null;
};

export type InsertIconInput = {
  name: string;
  slug: string;
  category: string;
  description?: string;
  tags: string[];
  svg: string;
};

type DbRow = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  tags_json: string;
  svg: string;
  created_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
};

const COLUMNS =
  'id, name, slug, category, description, tags_json, svg, created_at, deleted_at, deleted_reason';

function row(r: DbRow): IconRow {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    description: r.description,
    tagsJson: r.tags_json,
    svg: r.svg,
    createdAt: r.created_at,
    deletedAt: r.deleted_at,
    deletedReason: r.deleted_reason,
  };
}

export function insertIcon(input: InsertIconInput): IconRow {
  const db = getDb();
  const tagsJson = JSON.stringify(input.tags);
  const tagsText = input.tags.join(' ');
  const description = input.description ?? '';
  const info = db
    .prepare(
      'INSERT INTO icons (name, slug, category, description, tags_json, tags_text, svg) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(input.name, input.slug, input.category, description, tagsJson, tagsText, input.svg);
  const id = Number(info.lastInsertRowid);
  const r = db.prepare(`SELECT ${COLUMNS} FROM icons WHERE id = ?`).get(id) as DbRow;
  return row(r);
}

function escapeFts(token: string): string {
  return `"${  token.replace(/"/g, '""')  }"`;
}

function buildFtsQuery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => `${escapeFts(t)  }*`)
    .join(' AND ');
}

export type ListMode = 'active' | 'deleted';
export type ListInput = {
  q?: string;
  offset: number;
  limit: number;
  mode?: ListMode;
};
export type ListResult = { items: IconRow[]; hasMore: boolean };

export function listIcons(input: ListInput): ListResult {
  const db = getDb();
  const limit = Math.max(1, Math.min(120, input.limit));
  const offset = Math.max(0, input.offset);
  const q = (input.q ?? '').trim();
  const mode: ListMode = input.mode ?? 'active';
  const filter = mode === 'active' ? 'i.deleted_at IS NULL' : 'i.deleted_at IS NOT NULL';
  const order = mode === 'active' ? 'i.created_at DESC' : 'i.deleted_at DESC';

  const prefixedColumns = COLUMNS.split(', ')
    .map(c => `i.${  c}`)
    .join(', ');

  let rows: DbRow[];
  if (q.length > 0) {
    const fts = buildFtsQuery(q);
    rows = db
      .prepare(
        `SELECT ${prefixedColumns}
         FROM icons i
         JOIN icons_fts f ON f.rowid = i.id
         WHERE icons_fts MATCH ? AND ${filter}
         ORDER BY rank, ${order}
         LIMIT ? OFFSET ?`
      )
      .all(fts, limit + 1, offset) as DbRow[];
  } else {
    rows = db
      .prepare(
        `SELECT ${prefixedColumns}
         FROM icons i
         WHERE ${filter}
         ORDER BY ${order}
         LIMIT ? OFFSET ?`
      )
      .all(limit + 1, offset) as DbRow[];
  }

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(row);
  return { items, hasMore };
}

export function softDeleteIcon(id: number, reason: string): boolean {
  const db = getDb();
  const info = db
    .prepare(
      "UPDATE icons SET deleted_at = datetime('now'), deleted_reason = ?, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL"
    )
    .run(reason, id);
  return info.changes > 0;
}

export function restoreIcon(id: number): boolean {
  const db = getDb();
  const info = db
    .prepare(
      "UPDATE icons SET deleted_at = NULL, deleted_reason = NULL, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NOT NULL"
    )
    .run(id);
  return info.changes > 0;
}
