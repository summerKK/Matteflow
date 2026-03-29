import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('index bootstraps the video wrap app shell', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="app"/);
  assert.match(html, /type="file"/);
  assert.match(html, /src="\.\/src\/main\.js"/);
});
