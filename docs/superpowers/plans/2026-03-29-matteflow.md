# Matteflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone magazine-style browser demo in the current directory that lets the user pick a local video file and wraps article text around a centered subject-like silhouette using `pretext`.

**Architecture:** Serve a static `index.html` page with ES modules and CSS from this directory. Keep the editable wrap math in small pure modules (`profile`, `layout`) so they can be tested with Node’s built-in test runner, while the browser layer (`main`, `demo`) handles file input, video playback, and DOM rendering.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node `--test`, Python `http.server`, `@chenglou/pretext` loaded from a browser ESM CDN.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`

- [ ] **Step 1: Write the failing smoke test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('index bootstraps the video wrap app shell', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="app"/);
  assert.match(html, /type="file"/);
  assert.match(html, /src\/main\.js/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/smoke.test.js`
Expected: FAIL because `index.html` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```json
{
  "name": "matteflow",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node ./scripts/serve.mjs 4173",
    "test": "node --test"
  }
}
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Matteflow</title>
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/smoke.test.js`
Expected: PASS.

### Task 2: Silhouette Profile Math

**Files:**
- Create: `src/profile.js`
- Create: `test/profile.test.js`

- [ ] **Step 1: Write the failing profile tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PROFILE,
  sampleProfileWidth,
  profileBandIndex,
} from '../src/profile.js';

test('profile widens around the torso', () => {
  assert.ok(sampleProfileWidth(DEFAULT_PROFILE, 0.45) > sampleProfileWidth(DEFAULT_PROFILE, 0.1));
});

test('profile narrows again toward the bottom', () => {
  assert.ok(sampleProfileWidth(DEFAULT_PROFILE, 0.8) < sampleProfileWidth(DEFAULT_PROFILE, 0.45));
});

test('band index clamps to profile bounds', () => {
  assert.equal(profileBandIndex(DEFAULT_PROFILE, -1), 0);
  assert.equal(profileBandIndex(DEFAULT_PROFILE, 5), DEFAULT_PROFILE.length - 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/profile.test.js`
Expected: FAIL because `src/profile.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
export const DEFAULT_PROFILE = [0.16, 0.2, 0.26, 0.34, 0.44, 0.5, 0.47, 0.38, 0.28, 0.2];

export function profileBandIndex(profile, normalizedY) {
  const clamped = Math.max(0, Math.min(0.999999, normalizedY));
  return Math.min(profile.length - 1, Math.floor(clamped * profile.length));
}

export function sampleProfileWidth(profile, normalizedY) {
  return profile[profileBandIndex(profile, normalizedY)];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/profile.test.js`
Expected: PASS.

### Task 3: Available Region Calculation

**Files:**
- Create: `src/layout.js`
- Create: `test/layout.test.js`

- [ ] **Step 1: Write the failing layout tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE } from '../src/profile.js';
import { computeWrapRegions } from '../src/layout.js';

test('returns one full-width region above the floating stage', () => {
  const regions = computeWrapRegions({
    y: 80,
    lineHeight: 28,
    articleLeft: 40,
    articleWidth: 900,
    stageTop: 200,
    stageHeight: 360,
    stageCenterX: 490,
    stageWidth: 280,
    profile: DEFAULT_PROFILE,
    wrapStrength: 1,
    gutter: 24,
  });

  assert.deepEqual(regions, [{ x: 40, width: 900 }]);
});

test('returns left and right regions through the silhouette body', () => {
  const regions = computeWrapRegions({
    y: 340,
    lineHeight: 28,
    articleLeft: 40,
    articleWidth: 900,
    stageTop: 200,
    stageHeight: 360,
    stageCenterX: 490,
    stageWidth: 280,
    profile: DEFAULT_PROFILE,
    wrapStrength: 1,
    gutter: 24,
  });

  assert.equal(regions.length, 2);
  assert.ok(regions[0].width > 0);
  assert.ok(regions[1].width > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/layout.test.js`
Expected: FAIL because `computeWrapRegions` is not implemented.

- [ ] **Step 3: Write minimal implementation**

```js
import { sampleProfileWidth } from './profile.js';

export function computeWrapRegions(args) {
  const {
    y,
    lineHeight,
    articleLeft,
    articleWidth,
    stageTop,
    stageHeight,
    stageCenterX,
    stageWidth,
    profile,
    wrapStrength,
    gutter,
  } = args;

  const lineMid = y + lineHeight / 2;
  if (lineMid < stageTop || lineMid > stageTop + stageHeight) {
    return [{ x: articleLeft, width: articleWidth }];
  }

  const normalizedY = (lineMid - stageTop) / stageHeight;
  const halfWidth = (stageWidth * sampleProfileWidth(profile, normalizedY) * wrapStrength) / 2;
  const exclusionLeft = stageCenterX - halfWidth - gutter;
  const exclusionRight = stageCenterX + halfWidth + gutter;
  const articleRight = articleLeft + articleWidth;

  const left = { x: articleLeft, width: Math.max(0, exclusionLeft - articleLeft) };
  const right = { x: Math.min(articleRight, exclusionRight), width: Math.max(0, articleRight - exclusionRight) };
  return [left, right].filter(region => region.width > 24);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/layout.test.js`
Expected: PASS.

### Task 4: Pretext-Driven Line Layout

**Files:**
- Modify: `src/layout.js`
- Create: `src/sampleText.js`

- [ ] **Step 1: Write the failing layout flow test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlowPlan } from '../src/layout.js';
import { DEFAULT_PROFILE } from '../src/profile.js';

test('creates positioned lines for the article body', () => {
  const plan = createFlowPlan({
    prepared: {
      text: 'stub',
      measure: () => [{ text: 'stub', width: 100 }],
    },
    articleText: 'stub',
    articleLeft: 40,
    articleTop: 120,
    articleWidth: 900,
    articleHeight: 1000,
    lineHeight: 28,
    stageTop: 200,
    stageHeight: 360,
    stageCenterX: 490,
    stageWidth: 280,
    profile: DEFAULT_PROFILE,
    wrapStrength: 1,
    gutter: 24,
  });

  assert.ok(plan.lines.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/layout.test.js`
Expected: FAIL because `createFlowPlan` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `createFlowPlan()` in `src/layout.js` with two modes:
- test mode: if `prepared.measure` exists, use it to emit one or more fake lines into computed regions
- browser mode: import `prepareWithSegments` and `layoutNextLine` from `https://esm.sh/@chenglou/pretext`, iterate line-by-line, and place lines into the current region while advancing `y`

Also add `src/sampleText.js`:

```js
export const SAMPLE_TEXT = `Long editorial body text here...`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/layout.test.js`
Expected: PASS with the new `createFlowPlan` assertions added.

### Task 5: Demo Controller and UI

**Files:**
- Create: `src/demo.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing DOM shell test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppHtml } from '../src/demo.js';

test('renders controls for local video input and wrap tuning', () => {
  const html = buildAppHtml();
  assert.match(html, /Choose video/i);
  assert.match(html, /type="file"/);
  assert.match(html, /Wrap strength/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/smoke.test.js test/layout.test.js`
Expected: FAIL because `buildAppHtml` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement:
- `buildAppHtml()` in `src/demo.js` returning toolbar + magazine page shell
- `mountDemo(root)` in `src/demo.js` wiring:
  - file input → `URL.createObjectURL(file)`
  - play/pause button
  - sliders for scale, X offset, Y offset, wrap strength
  - re-render on input changes and on metadata load
- `src/main.js` to call `mountDemo(document.querySelector('#app'))`
- `src/styles.css` to style the editorial page, floating stage, placeholder, and absolutely positioned text lines

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS.

### Task 6: Manual Verification and Cleanup

**Files:**
- Modify: `README.md` (only if a short usage note is needed)

- [ ] **Step 1: Start the demo locally**

Run: `node ./scripts/serve.mjs 4173`
Expected: server starts and serves `http://localhost:4173`.

- [ ] **Step 2: Verify the browser flow**

Manual checks:
- open `http://localhost:4173`
- choose a local `.mp4` or `.webm`
- confirm the video appears in the center of the page
- confirm the text wraps around a silhouette-like shape
- confirm controls update the layout live

- [ ] **Step 3: Run the automated tests**

Run: `node --test`
Expected: PASS.

- [ ] **Step 4: Optional short docs note**

If needed, add a tiny `README.md` with:

```md
# Matteflow

Run `npm test`, then `npm start`, and open `http://localhost:4173`.
```
