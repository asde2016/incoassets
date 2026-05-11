// server/plugins/db.ts
import { getDb, runMigrations, assertFts5 } from '~/server/utils/db';

export default defineNitroPlugin(() => {
  const db = getDb();
  runMigrations(db);
  assertFts5(db);
  // eslint-disable-next-line no-console
  console.log('[incoassets] sqlite ready');
});
