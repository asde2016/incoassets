# 아이콘 Soft-Delete & 휴지통 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아이콘 삭제를 hard-delete에서 사유 기록을 동반한 soft-delete로 전환하고, 메인 페이지 그리드 위 토글로 삭제된 아이콘을 보고 복구·복사·다운로드할 수 있도록 한다.

**Architecture:** SQLite `icons` 테이블을 마이그레이션해 `deleted_at`/`deleted_reason` 컬럼을 추가하고 `slug` UNIQUE 제약을 제거한다. 서버 repo 함수에 `softDeleteIcon`/`restoreIcon`을 추가하고, `listIcons`에 `mode` 파라미터로 활성/삭제 분기. 클라이언트 Pinia 스토어는 `mode` 상태와 `softDelete`/`restore` 액션을 추가하고, `IconCard`는 `AlertDialog`로 사유 입력을 받고, 삭제됨 모드용 `IconDeletedCard` 컴포넌트를 새로 만든다.

**Tech Stack:** Nuxt 3, Vue 3, Pinia, better-sqlite3, vitest + happy-dom + @vue/test-utils, reka-ui (Dialog), Tailwind.

**관련 스펙:** `docs/superpowers/specs/2026-05-08-icon-soft-delete-trash-design.md`

---

## File Map

**생성:**
- `components/IconDeletedCard.vue` — 삭제됨 모드 카드 (복구/복사/다운로드)
- `server/api/icons/[id].restore.post.ts` — 복구 API

**수정:**
- `server/utils/db.ts` — 마이그레이션 (UNIQUE 제거 + 새 컬럼)
- `server/utils/repo/icons.ts` — `IconRow`/`listIcons`/`insertIcon`, `softDeleteIcon`/`restoreIcon`, `deleteIcon` 제거
- `server/api/icons/[id].delete.ts` — body `{ reason }` 검증 + softDelete 호출
- `server/api/icons/index.get.ts` — `deleted` 쿼리 파라미터, 응답에 `deletedAt`/`deletedReason`
- `stores/search.ts` — `IconDto`, `mode`, `setMode`, `softDelete`, `restore`
- `components/IconCard.vue` — 삭제 버튼을 `AlertDialog` 트리거로 교체, 사유 입력
- `components/IconGrid.vue` — `mode === 'deleted'`일 때 `IconCreateCard` 숨기고 `IconDeletedCard` 렌더
- `pages/index.vue` — IconGrid 위 SwitchSquare 토글
- `tests/api/icons.test.ts` — UNIQUE-retry 테스트 갱신, softDelete/restore 테스트 추가
- `tests/unit/IconCard.test.ts` — confirm 기반 테스트를 AlertDialog 기반으로 갱신

---

## Task 1: DB 마이그레이션 — `deleted_at`/`deleted_reason` 추가 + slug UNIQUE 제거

**Files:**
- Modify: `server/utils/db.ts`
- Test: `tests/api/icons.test.ts` (기존 파일에 추가)

- [ ] **Step 1.1: 실패 테스트 작성 — 마이그레이션 후 새 컬럼 존재 확인 + slug UNIQUE 없음**

`tests/api/icons.test.ts` 파일 끝 `});` 닫는 괄호 직전에 다음 테스트 두 개를 추가:

```ts
  it('migration adds deleted_at and deleted_reason columns', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const cols = getDb()
      .prepare('PRAGMA table_info(icons)')
      .all() as Array<{ name: string }>;
    const names = cols.map(c => c.name);
    expect(names).toContain('deleted_at');
    expect(names).toContain('deleted_reason');
  });

  it('slug no longer has a UNIQUE constraint after migration', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const db = getDb();
    db.prepare(
      "INSERT INTO icons (name, slug, svg) VALUES ('A', 'dup', '<svg/>')"
    ).run();
    expect(() =>
      db.prepare(
        "INSERT INTO icons (name, slug, svg) VALUES ('B', 'dup', '<svg/>')"
      ).run()
    ).not.toThrow();
  });
```

- [ ] **Step 1.2: 테스트 실패 확인**

```bash
pnpm test -- tests/api/icons.test.ts -t "migration adds deleted_at"
pnpm test -- tests/api/icons.test.ts -t "slug no longer has a UNIQUE"
```
Expected: 두 테스트 모두 FAIL (각각 컬럼 부재 / UNIQUE constraint failed).

- [ ] **Step 1.3: `server/utils/db.ts` 마이그레이션 구현**

`MIGRATIONS_SQL` 상수 본문을 다음으로 교체 (slug UNIQUE 제거 + 새 컬럼 + deleted_at 인덱스):

```ts
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
```

`runMigrations` 함수를 다음으로 교체 (기존 description 패턴을 두 분기로 확장):

```ts
export function runMigrations(db: Db): void {
  db.exec(MIGRATIONS_SQL);

  const cols = db.prepare('PRAGMA table_info(icons)').all() as Array<{
    name: string;
  }>;
  const names = new Set(cols.map(c => c.name));
  const hasDescription = names.has('description');
  const hasDeletedAt = names.has('deleted_at');

  // 기존 DB가 description을 갖지 않거나 deleted_at을 갖지 않으면 테이블 재생성.
  // 재생성은 slug UNIQUE 제약을 자동으로 떨어뜨린다 (새 스키마에 UNIQUE가 없음).
  const needsRebuild = !hasDescription || !hasDeletedAt;
  if (!needsRebuild) return;

  db.exec('BEGIN');
  try {
    // 옛 인덱스/트리거/FTS 정리
    db.exec(`
      DROP TRIGGER IF EXISTS icons_ai;
      DROP TRIGGER IF EXISTS icons_ad;
      DROP TRIGGER IF EXISTS icons_au;
      DROP TABLE IF EXISTS icons_fts;
    `);

    // 임시 테이블에 새 스키마로 데이터 복사
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

    // 인덱스 + FTS 재생성
    db.exec(MIGRATIONS_SQL);

    // 활성 행만 FTS 백필
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
```

- [ ] **Step 1.4: 테스트 통과 확인**

```bash
pnpm test -- tests/api/icons.test.ts
```
Expected: 새 마이그레이션 테스트 2개 PASS. 기존 5개 중 `retries slug on UNIQUE conflict`는 FAIL이지만 (Task 2에서 갱신), 나머지는 PASS여야 한다.

- [ ] **Step 1.5: 커밋**

```bash
git add server/utils/db.ts tests/api/icons.test.ts
git commit -m "feat(db): migrate icons table for soft-delete (deleted_at/deleted_reason, drop slug UNIQUE)"
```

---

## Task 2: Repo — `softDeleteIcon`/`restoreIcon` 추가 + 기존 정리

**Files:**
- Modify: `server/utils/repo/icons.ts`
- Modify: `tests/api/icons.test.ts`

- [ ] **Step 2.1: 기존 테스트 갱신 — `retries slug on UNIQUE conflict` 제거 + softDelete/restore 테스트 추가**

`tests/api/icons.test.ts`에서 `it('retries slug on UNIQUE conflict', ...)` 블록을 다음으로 교체:

```ts
  it('insertIcon allows duplicate slugs after UNIQUE removal', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');
    const a = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    const b = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    expect(a.slug).toBe('x');
    expect(b.slug).toBe('x');
    expect(a.id).not.toBe(b.id);
  });
```

`it('deleteIcon removes row and returns true', ...)` 블록을 다음으로 교체:

```ts
  it('softDeleteIcon marks the row as deleted with reason', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const ins = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    expect(repo.softDeleteIcon(ins.id, '중복')).toBe(true);
    // 멱등: 이미 삭제된 행에 다시 호출하면 false
    expect(repo.softDeleteIcon(ins.id, '중복')).toBe(false);

    // 활성 목록에 안 보임
    const active = repo.listIcons({ offset: 0, limit: 10 });
    expect(active.items.length).toBe(0);

    // 삭제됨 목록에 보이고 사유 포함
    const deleted = repo.listIcons({ offset: 0, limit: 10, mode: 'deleted' });
    expect(deleted.items.length).toBe(1);
    expect(deleted.items[0].deletedReason).toBe('중복');
    expect(deleted.items[0].deletedAt).not.toBeNull();
  });

  it('restoreIcon brings a soft-deleted row back to active', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const ins = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    repo.softDeleteIcon(ins.id, 'r');
    expect(repo.restoreIcon(ins.id)).toBe(true);
    expect(repo.restoreIcon(ins.id)).toBe(false);

    const active = repo.listIcons({ offset: 0, limit: 10 });
    expect(active.items.length).toBe(1);
    expect(active.items[0].deletedAt).toBeNull();
    expect(active.items[0].deletedReason).toBeNull();
  });

  it('listIcons q-search excludes soft-deleted rows', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const ins = repo.insertIcon({ name: 'AWS Cloud', slug: 'aws', category: 'cloud', tags: ['aws'], svg: '<svg/>' });
    repo.softDeleteIcon(ins.id, 'gone');
    const r = repo.listIcons({ q: 'aws', offset: 0, limit: 10 });
    expect(r.items.length).toBe(0);
  });
```

- [ ] **Step 2.2: 테스트 실패 확인**

```bash
pnpm test -- tests/api/icons.test.ts
```
Expected: 새 4개 테스트 FAIL (`softDeleteIcon`/`restoreIcon` 미정의, `mode` 파라미터 미지원, `deletedAt`/`deletedReason` 필드 부재).

- [ ] **Step 2.3: `server/utils/repo/icons.ts` 갱신**

파일 전체를 다음으로 교체:

```ts
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
  return '"' + token.replace(/"/g, '""') + '"';
}

function buildFtsQuery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => escapeFts(t) + '*')
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
    .map(c => 'i.' + c)
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
```

- [ ] **Step 2.4: 테스트 통과 확인**

```bash
pnpm test -- tests/api/icons.test.ts
```
Expected: 모든 테스트 PASS.

- [ ] **Step 2.5: 커밋**

```bash
git add server/utils/repo/icons.ts tests/api/icons.test.ts
git commit -m "feat(repo): replace deleteIcon with soft delete + restore"
```

---

## Task 3: API — `DELETE /api/icons/:id` 본문 `{ reason }` 검증 + softDelete

**Files:**
- Modify: `server/api/icons/[id].delete.ts`

이 단계는 핸들러가 단순해 단위 테스트는 생략한다 (`tests/api/icons.test.ts`가 repo 레벨에서 검증). E2E는 Task 11 검증 단계에서 수동.

- [ ] **Step 3.1: `[id].delete.ts` 교체**

```ts
// server/api/icons/[id].delete.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { softDeleteIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(async event => {
  const idParam = getRouterParam(event, 'id') ?? '';
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'invalid id' } },
    });
  }

  const body = (await readBody<{ reason?: string }>(event)) ?? {};
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length === 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'reason required' } },
    });
  }

  const ok = softDeleteIcon(id, reason);
  if (!ok) {
    throw createError({
      statusCode: 404,
      data: { error: { code: 'NOT_FOUND', message: 'icon not found' } },
    });
  }
  return { ok: true };
});
```

- [ ] **Step 3.2: 타입 체크**

```bash
pnpm test -- tests/api/icons.test.ts
```
Expected: PASS (직접 호출 테스트는 없음, 회귀 없음 확인).

- [ ] **Step 3.3: 커밋**

```bash
git add server/api/icons/[id].delete.ts
git commit -m "feat(api): require reason in DELETE /api/icons/:id and call softDeleteIcon"
```

---

## Task 4: API — `POST /api/icons/:id/restore` 신규

**Files:**
- Create: `server/api/icons/[id].restore.post.ts`

- [ ] **Step 4.1: 핸들러 작성**

```ts
// server/api/icons/[id].restore.post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { restoreIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const idParam = getRouterParam(event, 'id') ?? '';
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'invalid id' } },
    });
  }
  const ok = restoreIcon(id);
  if (!ok) {
    throw createError({
      statusCode: 404,
      data: { error: { code: 'NOT_FOUND', message: 'icon not found or already active' } },
    });
  }
  return { ok: true };
});
```

- [ ] **Step 4.2: 회귀 확인**

```bash
pnpm test -- tests/api/icons.test.ts
```
Expected: PASS.

- [ ] **Step 4.3: 커밋**

```bash
git add server/api/icons/[id].restore.post.ts
git commit -m "feat(api): add POST /api/icons/:id/restore"
```

---

## Task 5: API — `GET /api/icons?deleted=true` 지원 + 응답 필드 확장

**Files:**
- Modify: `server/api/icons/index.get.ts`

- [ ] **Step 5.1: 교체**

```ts
import { defineEventHandler, getQuery } from 'h3';
import { listIcons, type ListMode } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const q = getQuery(event);
  const offset = Number.parseInt(typeof q.offset === 'string' ? q.offset : '0', 10) || 0;
  const limit = Number.parseInt(typeof q.limit === 'string' ? q.limit : '60', 10) || 60;
  const search = typeof q.q === 'string' ? q.q : '';
  const mode: ListMode = q.deleted === 'true' || q.deleted === '1' ? 'deleted' : 'active';

  const result = listIcons({ q: search, offset, limit, mode });
  return {
    items: result.items.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      description: r.description,
      tags: JSON.parse(r.tagsJson),
      svg: r.svg,
      createdAt: r.createdAt,
      deletedAt: r.deletedAt,
      deletedReason: r.deletedReason,
    })),
    hasMore: result.hasMore,
  };
});
```

- [ ] **Step 5.2: 회귀 확인**

```bash
pnpm test
```
Expected: 전 테스트 PASS.

- [ ] **Step 5.3: 커밋**

```bash
git add server/api/icons/index.get.ts
git commit -m "feat(api): support GET /api/icons?deleted=true and expose deletedAt/deletedReason"
```

---

## Task 6: Store — `mode`, `setMode`, `softDelete`, `restore`

**Files:**
- Modify: `stores/search.ts`

이 단계도 단위 테스트는 생략하고 통합은 Task 8 이후 화면에서 검증 (현 코드베이스에 store 단위 테스트 없음).

- [ ] **Step 6.1: 교체**

```ts
// stores/search.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type IconDto = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  tags: string[];
  svg: string;
  createdAt: string;
  deletedAt: string | null;
  deletedReason: string | null;
};

export type SearchMode = 'active' | 'deleted';

const PAGE_SIZE = 60;

export const useSearch = defineStore('search', () => {
  const q = ref<string>('');
  const mode = ref<SearchMode>('active');
  const items = ref<IconDto[]>([]);
  const offset = ref<number>(0);
  const hasMore = ref<boolean>(true);
  const loading = ref<boolean>(false);
  let abortCtrl: AbortController | null = null;

  async function fetchPage(reset: boolean) {
    if (loading.value) return;
    if (!reset && !hasMore.value) return;
    loading.value = true;
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const url = new URL('/api/icons', window.location.origin);
    if (q.value) url.searchParams.set('q', q.value);
    if (mode.value === 'deleted') url.searchParams.set('deleted', 'true');
    url.searchParams.set('offset', String(reset ? 0 : offset.value));
    url.searchParams.set('limit', String(PAGE_SIZE));
    try {
      const res = await fetch(url, { signal: abortCtrl.signal });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: IconDto[]; hasMore: boolean };
      if (reset) {
        items.value = json.items;
        offset.value = json.items.length;
      } else {
        items.value = [...items.value, ...json.items];
        offset.value = items.value.length;
      }
      hasMore.value = json.hasMore;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error('[search] fetch error', e);
      }
    } finally {
      loading.value = false;
    }
  }

  async function setQuery(next: string) {
    q.value = next;
    offset.value = 0;
    hasMore.value = true;
    await fetchPage(true);
  }

  async function setMode(next: SearchMode) {
    if (mode.value === next) return;
    mode.value = next;
    offset.value = 0;
    hasMore.value = true;
    await fetchPage(true);
  }

  async function loadMore() {
    await fetchPage(false);
  }

  function add(item: IconDto) {
    items.value = [item, ...items.value];
    offset.value += 1;
  }

  function remove(id: number) {
    items.value = items.value.filter(i => i.id !== id);
    offset.value = Math.max(0, offset.value - 1);
  }

  async function softDelete(id: number, reason: string): Promise<boolean> {
    const res = await fetch(`/api/icons/${id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return false;
    remove(id);
    return true;
  }

  async function restore(id: number): Promise<boolean> {
    const res = await fetch(`/api/icons/${id}/restore`, { method: 'POST' });
    if (!res.ok) return false;
    remove(id);
    return true;
  }

  return {
    q,
    mode,
    items,
    offset,
    hasMore,
    loading,
    setQuery,
    setMode,
    loadMore,
    add,
    remove,
    softDelete,
    restore,
  };
});
```

- [ ] **Step 6.2: 회귀 확인**

```bash
pnpm test
```
Expected: 전 테스트 PASS (IconCard 테스트는 아직 옛 confirm 흐름 — 다음 태스크에서 갱신).

- [ ] **Step 6.3: 커밋**

```bash
git add stores/search.ts
git commit -m "feat(store): add mode, setMode, softDelete, restore"
```

---

## Task 7: IconCard — `AlertDialog` + 사유 입력

**Files:**
- Modify: `components/IconCard.vue`
- Modify: `tests/unit/IconCard.test.ts`

- [ ] **Step 7.1: 기존 confirm 기반 테스트를 AlertDialog 기반으로 교체**

`tests/unit/IconCard.test.ts`에서 `it('delete button calls the DELETE endpoint after confirmation', ...)` 블록을 다음으로 교체:

```ts
  it('delete button opens AlertDialog and calls softDelete with reason', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      attachTo: document.body,
      global: { stubs: { IconDetailDialog: true } },
    });

    // 트리거 버튼 클릭 → AlertDialog 열림
    await wrapper.get('[data-test="icon-action-delete"]').trigger('click');
    await nextTick();

    const textarea = document.querySelector(
      '[data-test="delete-reason"]'
    ) as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();

    // 사유가 비어 있으면 삭제 버튼이 비활성
    const confirmBtn = document.querySelector(
      '[data-test="delete-confirm"]'
    ) as HTMLButtonElement | null;
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn!.disabled).toBe(true);

    // 사유 입력
    textarea!.value = '품질 이슈';
    textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(confirmBtn!.disabled).toBe(false);

    confirmBtn!.click();
    await nextTick();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/icons/1');
    expect(init?.method).toBe('DELETE');
    expect(JSON.parse(init?.body as string)).toEqual({ reason: '품질 이슈' });

    wrapper.unmount();
  });
```

- [ ] **Step 7.2: 테스트 실패 확인**

```bash
pnpm test -- tests/unit/IconCard.test.ts -t "delete button opens AlertDialog"
```
Expected: FAIL (`data-test="delete-reason"` / `data-test="delete-confirm"` 미존재).

- [ ] **Step 7.3: `components/IconCard.vue` 갱신**

전체 파일 교체:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCustomize } from '~/stores/customize';
import { useSearch, type IconDto } from '~/stores/search';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';
import { downloadSvg } from '~/utils/download';
import IconDetailDialog from '~/components/IconDetailDialog.vue';
import { AlertDialog } from '~/components/ui/dialog';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';

const props = defineProps<{ icon: IconDto }>();
const c = useCustomize();
const search = useSearch();

const state = computed<CustomizeState>(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => applyCustomize(props.icon.svg, state.value));

const detailOpen = ref(false);
const deleteOpen = ref(false);
const reason = ref('');
const submitting = ref(false);

function onCopy() {
  void navigator.clipboard?.writeText(previewSvg.value);
}

function onDownload() {
  downloadSvg(props.icon.slug, previewSvg.value);
}

function onCardKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    detailOpen.value = true;
  }
}

async function confirmDelete() {
  const trimmed = reason.value.trim();
  if (!trimmed || submitting.value) return;
  submitting.value = true;
  const ok = await search.softDelete(props.icon.id, trimmed);
  submitting.value = false;
  if (ok) {
    deleteOpen.value = false;
    reason.value = '';
  }
}
</script>

<template>
  <div
    class="group relative flex aspect-square cursor-pointer flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 transition hover:-translate-y-2 hover:border-primary hover:shadow-down"
    role="button"
    tabindex="0"
    :title="icon.name"
    :aria-label="`${icon.name} 상세 보기`"
    @click="detailOpen = true"
    @keydown="onCardKeydown">
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-b from-transparent to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
    <div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
      <AlertDialog v-model:open="deleteOpen" variant="danger" msg="삭제 사유를 입력해 주세요">
        <template #trigger>
          <button
            type="button"
            data-test="icon-action-delete"
            class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-400 shadow-sm transition hover:bg-danger hover:text-white"
            :aria-label="`${icon.name} 삭제`"
            title="삭제"
            @click.stop>
            <i class="material-icons text-16">delete</i>
          </button>
        </template>
        <template #title>"{{ icon.name }}"을(를) 삭제하시겠습니까?</template>
        <p class="mb-8 text-13 text-gray-500">삭제된 아이콘은 휴지통에서 복구할 수 있습니다.</p>
        <Textarea
          v-model="reason"
          data-test="delete-reason"
          rows="3"
          placeholder="삭제 사유 (필수)" />
        <template #footer>
          <Button
            data-test="delete-confirm"
            variant="danger"
            size="sm"
            :disabled="!reason.trim() || submitting"
            :click-close="false"
            @click="confirmDelete">
            삭제
          </Button>
          <Button variant="outline" size="sm">취소</Button>
        </template>
      </AlertDialog>
      <button
        type="button"
        data-test="icon-action-copy"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} SVG 복사`"
        title="SVG 복사"
        @click.stop="onCopy">
        <i class="material-icons text-16">content_copy</i>
      </button>
      <button
        type="button"
        data-test="icon-action-download"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} 다운로드`"
        title="다운로드"
        @click.stop="onDownload">
        <i class="material-icons text-16">file_download</i>
      </button>
    </div>
    <div class="flex flex-1 items-center justify-center text-gray-800" v-html="previewSvg" />
    <div class="w-full truncate text-center text-12 text-gray-500">{{ icon.name }}</div>
  </div>
  <IconDetailDialog v-model:open="detailOpen" :icon="icon" :preview-svg="previewSvg" />
</template>
```

`Textarea` 컴포넌트가 `$attrs` (`v-bind="$attrs"`) 를 내부 `<textarea>`로 전파하므로 `data-test` 속성이 native textarea로 흘러간다. `Button` 컴포넌트도 동일하게 `data-test`가 native button까지 전파된다고 가정한다 — 만약 그렇지 않으면 Step 7.3 마지막에 `Button` 대신 `<button>` raw element를 쓰도록 fallback. (확인은 Step 7.4에서.)

- [ ] **Step 7.4: 테스트 실행**

```bash
pnpm test -- tests/unit/IconCard.test.ts
```
Expected: 모든 테스트 PASS.

만약 `data-test="delete-confirm"` 셀렉터로 native button을 못 찾으면 (`Button`이 attrs를 미전파), `Button`을 다음 raw element로 교체:

```vue
<button
  type="button"
  data-test="delete-confirm"
  class="inline-flex items-center justify-center rounded-md bg-danger px-12 py-6 text-14 font-medium text-white disabled:opacity-50"
  :disabled="!reason.trim() || submitting"
  @click="confirmDelete">
  삭제
</button>
```

- [ ] **Step 7.5: 커밋**

```bash
git add components/IconCard.vue tests/unit/IconCard.test.ts
git commit -m "feat(IconCard): replace window.confirm with AlertDialog and reason input"
```

---

## Task 8: IconDeletedCard 신규

**Files:**
- Create: `components/IconDeletedCard.vue`

이 컴포넌트는 `IconCard`와 레이아웃 동일하되 액션이 다르다 (delete → restore). 단위 테스트는 IconCard 테스트와 같은 패턴.

- [ ] **Step 8.1: 단위 테스트 작성**

`tests/unit/IconDeletedCard.test.ts` 신규:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import IconDeletedCard from '~/components/IconDeletedCard.vue';
import type { IconDto } from '~/stores/search';

vi.mock('~/utils/download', () => ({ downloadSvg: vi.fn() }));
import { downloadSvg } from '~/utils/download';

const sampleDeleted: IconDto = {
  id: 7,
  name: 'Cloud',
  slug: 'cloud',
  category: 'weather',
  description: 'A cloud',
  tags: ['sky'],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  createdAt: '2026-05-08T10:00:00.000Z',
  deletedAt: '2026-05-08T11:00:00.000Z',
  deletedReason: '중복',
};

describe('IconDeletedCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('restore button calls /api/icons/:id/restore via store', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-restore"]').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/icons/7/restore', { method: 'POST' });
  });

  it('download button calls downloadSvg with the slug', async () => {
    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });
    await wrapper.get('[data-test="icon-action-download"]').trigger('click');
    expect(downloadSvg).toHaveBeenCalledWith('cloud', expect.stringContaining('<svg'));
  });

  it('copy button writes svg to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });
    await wrapper.get('[data-test="icon-action-copy"]').trigger('click');
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 8.2: 테스트 실패 확인**

```bash
pnpm test -- tests/unit/IconDeletedCard.test.ts
```
Expected: FAIL (파일 미존재).

- [ ] **Step 8.3: `components/IconDeletedCard.vue` 작성**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCustomize } from '~/stores/customize';
import { useSearch, type IconDto } from '~/stores/search';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';
import { downloadSvg } from '~/utils/download';
import IconDetailDialog from '~/components/IconDetailDialog.vue';

const props = defineProps<{ icon: IconDto }>();
const c = useCustomize();
const search = useSearch();

const state = computed<CustomizeState>(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => applyCustomize(props.icon.svg, state.value));
const detailOpen = ref(false);
const restoring = ref(false);

function onCopy() {
  void navigator.clipboard?.writeText(previewSvg.value);
}

function onDownload() {
  downloadSvg(props.icon.slug, previewSvg.value);
}

async function onRestore() {
  if (restoring.value) return;
  restoring.value = true;
  await search.restore(props.icon.id);
  restoring.value = false;
}

function onCardKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    detailOpen.value = true;
  }
}
</script>

<template>
  <div
    class="group relative flex aspect-square cursor-pointer flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 opacity-70 grayscale transition hover:-translate-y-2 hover:border-primary hover:opacity-100 hover:grayscale-0 hover:shadow-down"
    role="button"
    tabindex="0"
    :title="icon.deletedReason || icon.name"
    :aria-label="`${icon.name} 상세 보기`"
    @click="detailOpen = true"
    @keydown="onCardKeydown">
    <span class="absolute left-8 top-8 inline-flex items-center gap-2 rounded bg-gray-700/80 px-6 py-2 text-10 text-white">
      <i class="material-icons text-12">delete</i> 삭제됨
    </span>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-b from-transparent to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
    <div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
      <button
        type="button"
        data-test="icon-action-restore"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-primary hover:text-white disabled:opacity-50"
        :aria-label="`${icon.name} 복구`"
        title="복구"
        :disabled="restoring"
        @click.stop="onRestore">
        <i class="material-icons text-16">restore_from_trash</i>
      </button>
      <button
        type="button"
        data-test="icon-action-copy"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} SVG 복사`"
        title="SVG 복사"
        @click.stop="onCopy">
        <i class="material-icons text-16">content_copy</i>
      </button>
      <button
        type="button"
        data-test="icon-action-download"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} 다운로드`"
        title="다운로드"
        @click.stop="onDownload">
        <i class="material-icons text-16">file_download</i>
      </button>
    </div>
    <div class="flex flex-1 items-center justify-center text-gray-800" v-html="previewSvg" />
    <div class="w-full truncate text-center text-12 text-gray-500">{{ icon.name }}</div>
  </div>
  <IconDetailDialog v-model:open="detailOpen" :icon="icon" :preview-svg="previewSvg" />
</template>
```

- [ ] **Step 8.4: 테스트 통과 확인**

```bash
pnpm test -- tests/unit/IconDeletedCard.test.ts
```
Expected: 3개 PASS.

- [ ] **Step 8.5: 커밋**

```bash
git add components/IconDeletedCard.vue tests/unit/IconDeletedCard.test.ts
git commit -m "feat(IconDeletedCard): new card with restore/copy/download for deleted icons"
```

---

## Task 9: IconGrid — `mode === 'deleted'` 분기

**Files:**
- Modify: `components/IconGrid.vue`

- [ ] **Step 9.1: `<template>` 영역 분기 + skeleton CSS는 그대로**

`components/IconGrid.vue`의 기존 `<template>` 안 카드 렌더 부분을 다음으로 교체. 스크립트 상단 import에 `IconDeletedCard`를 추가.

`<script setup>` import 영역에 추가:

```ts
import IconDeletedCard from '~/components/IconDeletedCard.vue';
```

`<template>`에서 다음 두 부분을 교체:

**(a) `<IconCreateCard @open="emit('openCreate')" />` 부분:**

```vue
<IconCreateCard v-if="search.mode === 'active'" @open="emit('openCreate')" />
```

**(b) `<IconCard :key="icon.id" v-for="icon in search.items" :icon="icon" />` 부분:**

```vue
<template v-if="search.mode === 'active'">
  <IconCard v-for="icon in search.items" :key="icon.id" :icon="icon" />
</template>
<template v-else>
  <IconDeletedCard v-for="icon in search.items" :key="icon.id" :icon="icon" />
</template>
```

(이번 변경은 IDE에서 보고된 Vue lint(`v-for` 변수가 `:key`보다 먼저 나와야 함)도 함께 해소된다.)

- [ ] **Step 9.2: 회귀 테스트**

```bash
pnpm test
```
Expected: 전 테스트 PASS.

- [ ] **Step 9.3: 커밋**

```bash
git add components/IconGrid.vue
git commit -m "feat(IconGrid): branch on search.mode to render IconDeletedCard"
```

---

## Task 10: pages/index.vue — SwitchSquare 토글

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 10.1: import 추가 + 토글 마크업**

`<script setup>`의 import 블록에 추가:

```ts
import { SwitchSquare } from '~/components/ui/switch';
```

`<template>`에서 `<IconGrid @open-create="onOpenCreate" />`를 다음으로 교체:

```vue
<div class="mb-16 flex justify-end">
  <SwitchSquare
    :options="[
      { value: 'active',  label: '활성',   icon: 'apps' },
      { value: 'deleted', label: '삭제됨', icon: 'delete' },
    ]"
    :model-value="search.mode"
    @update:model-value="search.setMode($event as 'active' | 'deleted')" />
</div>
<IconGrid @open-create="onOpenCreate" />
```

- [ ] **Step 10.2: dev 서버 부팅으로 수동 검증**

```bash
pnpm dev
```

브라우저에서 다음 시나리오 확인:

1. 메인 페이지 그리드 위에 "활성 / 삭제됨" 토글이 보인다.
2. 활성 카드의 삭제 버튼 클릭 → AlertDialog 표시 → 사유 미입력 시 "삭제" 버튼 비활성 → 사유 입력 → 삭제 → 그리드에서 사라짐.
3. 토글 "삭제됨" 클릭 → 방금 삭제한 아이콘이 보임. 사유 입력 박스가 사라지고, 카드에 회색 처리 + "삭제됨" 칩이 표시된다.
4. 삭제됨 카드 호버 → "복구 / SVG 복사 / 다운로드" 3개 액션 노출. "복구" 클릭 → 카드가 사라짐.
5. 토글 "활성" 클릭 → 복구된 아이콘이 다시 보임.
6. 검색창에 키워드 입력 → 활성/삭제됨 모드 모두 검색이 동작하고, 삭제된 아이콘은 활성 모드 검색 결과에 안 섞인다.

문제 발견 시 해당 태스크로 돌아가 수정 후 다시 검증.

- [ ] **Step 10.3: 커밋**

```bash
git add pages/index.vue
git commit -m "feat(pages/index): add active/deleted toggle above IconGrid"
```

---

## Task 11: 최종 회귀 + lint

- [ ] **Step 11.1: 전체 테스트**

```bash
pnpm test
```
Expected: 모든 테스트 PASS.

- [ ] **Step 11.2: lint**

```bash
pnpm lint
```
Expected: error 없음. 새 경고가 있다면 가능한 범위에서 정리. (IconGrid의 기존 IDE 진단 — `v-for` 순서 등 — 은 Task 9에서 이미 해소됨.)

- [ ] **Step 11.3: 마지막 커밋 (lint 수정 발생 시)**

```bash
git add -A
git commit -m "chore: lint fixes for soft-delete feature"
```

---

## Self-Review 결과

- ✅ 스펙 1) AlertDialog 사용 — Task 7
- ✅ 스펙 2) Soft delete + 사유 DB 저장 — Task 1, 2, 3
- ✅ 스펙 3) 메인 페이지 토글 + 삭제됨 카드 (복구/복사/다운로드) — Task 6, 8, 9, 10
- ✅ 마이그레이션 idempotent + 데이터 보존 — Task 1
- ✅ slug UNIQUE 제거 — Task 1, 2
- ✅ 검색 시 삭제된 행 제외 — Task 2 (테스트 포함)
- ✅ 기존 테스트 갱신 — Task 1, 2, 7
- 함수명 일관성 확인: `softDeleteIcon`/`restoreIcon`/`setMode`/`softDelete`/`restore` — 모든 태스크에서 동일 사용
- 스펙 6.4 (IconDetailDialog에서 사유 표시) — 스펙에 "선택"으로 명시됨, 본 plan에서는 스코프 외 (필요 시 후속 작업)
