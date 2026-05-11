/* eslint-disable */
/**
 * Build a consolidated icon index from installed @iconify-json/* packages.
 *
 * Output: server/data/icons-index.json
 *
 * For each icon we keep:
 *   { set, name, body, w, h }
 *
 * - body: inner SVG markup with per-path `stroke-width` stripped so that the
 *   root stroke-width (which the customize transform injects) is what renders.
 * - w/h: source viewBox dimensions (defaults to set-level width/height).
 *
 * Run: node scripts/build-icon-index.cjs
 */
const fs = require('fs');
const path = require('path');

const SETS = ['tabler', 'hugeicons', 'lucide'];

function stripStrokeWidth(body) {
  // Drop ` stroke-width="N"` and ` stroke-width='N'` so root inheritance kicks in.
  return body.replace(/\sstroke-width=("[^"]*"|'[^']*')/g, '');
}

function tokenize(name) {
  return name.toLowerCase().split(/[-_]+/).filter(Boolean);
}

function build() {
  const all = [];
  const stats = {};

  for (const set of SETS) {
    const file = path.resolve(
      __dirname,
      '..',
      'node_modules',
      '@iconify-json',
      set,
      'icons.json',
    );
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const setW = data.width || 24;
    const setH = data.height || 24;
    let count = 0;
    for (const [name, icon] of Object.entries(data.icons)) {
      const body = stripStrokeWidth(icon.body || '');
      if (!body) continue;
      all.push({
        set,
        name,
        body,
        w: icon.width || setW,
        h: icon.height || setH,
        tokens: tokenize(name),
      });
      count++;
    }
    stats[set] = count;
  }

  const outFile = path.resolve(__dirname, '..', 'server', 'data', 'icons-index.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(all));
  const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log('icon index built →', outFile);
  console.log('  total icons:', all.length.toLocaleString());
  console.log('  per set:', stats);
  console.log('  output:', sizeMB, 'MB');
}

build();