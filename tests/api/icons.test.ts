import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

let tmp: string;
beforeEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = mkdtempSync(join(tmpdir(), 'incoassets-'));
  process.env.DB_PATH = join(tmp, 'icons.db');
  // reset module cache so getDb re-creates with new path
});

describe('repo/icons', () => {
  it('inserts and retrieves an icon by listIcons', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const inserted = repo.insertIcon({
      name: 'AWS Cloud',
      slug: 'aws-cloud',
      category: 'cloud',
      tags: ['aws', 'cloud'],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 0"/></svg>',
    });
    expect(inserted.id).toBeGreaterThan(0);
    expect(inserted.slug).toBe('aws-cloud');

    const list = repo.listIcons({ q: 'aws', offset: 0, limit: 10 });
    expect(list.items.length).toBe(1);
    expect(list.items[0].name).toBe('AWS Cloud');
    expect(list.hasMore).toBe(false);
  });

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

  it('softDeleteIcon marks the row as deleted with reason', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const ins = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    expect(repo.softDeleteIcon(ins.id, '중복')).toBe(true);
    expect(repo.softDeleteIcon(ins.id, '중복')).toBe(false);

    const active = repo.listIcons({ offset: 0, limit: 10 });
    expect(active.items.length).toBe(0);

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

  it('list with q does FTS prefix match', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');
    repo.insertIcon({ name: 'AWS Cloud', slug: 'aws-cloud', category: 'cloud', tags: ['aws','cloud'], svg: '<svg/>' });
    repo.insertIcon({ name: 'Azure Disk', slug: 'azure-disk', category: 'cloud', tags: ['azure'], svg: '<svg/>' });
    const r = repo.listIcons({ q: 'aws', offset: 0, limit: 10 });
    expect(r.items.length).toBe(1);
    expect(r.items[0].name).toBe('AWS Cloud');
  });

  it('hasMore signals additional pages', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');
    for (let i = 0; i < 3; i++) {
      repo.insertIcon({ name: `Icon ${i}`, slug: `icon-${i}`, category: '', tags: [], svg: '<svg/>' });
    }
    const r = repo.listIcons({ offset: 0, limit: 2 });
    expect(r.items.length).toBe(2);
    expect(r.hasMore).toBe(true);

    const r2 = repo.listIcons({ offset: 2, limit: 2 });
    expect(r2.items.length).toBe(1);
    expect(r2.hasMore).toBe(false);
  });

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
});
