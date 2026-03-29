import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeForegroundPlacement,
  estimateBackgroundColor,
  createForegroundAlphaMask,
  deriveProfileFromAlpha,
  deriveForegroundBounds,
} from '../src/matte.js';

function rgba(r, g, b, a = 255) {
  return [r, g, b, a];
}

function buildImage(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = fill(x, y);
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }

  return data;
}

test('estimates the border color as background', () => {
  const pixels = buildImage(4, 4, (x, y) => {
    if (x === 0 || y === 0 || x === 3 || y === 3) {
      return rgba(240, 230, 210);
    }

    return rgba(40, 60, 180);
  });

  const background = estimateBackgroundColor(pixels, 4, 4);
  assert.deepEqual(background, { r: 240, g: 230, b: 210 });
});

test('marks non-background pixels as foreground alpha', () => {
  const pixels = buildImage(4, 4, (x, y) => {
    if (x === 1 && y === 1) {
      return rgba(20, 40, 200);
    }

    return rgba(240, 230, 210);
  });

  const alpha = createForegroundAlphaMask(pixels, 4, 4, {
    background: { r: 240, g: 230, b: 210 },
    threshold: 18,
    feather: 8,
  });

  assert.equal(alpha[0], 0);
  assert.ok(alpha[1 * 4 + 1] > 200);
});

test('derives a wider middle contour from alpha data', () => {
  const alpha = new Uint8ClampedArray([
    0, 0, 255, 255, 0, 0,
    0, 255, 255, 255, 255, 0,
    0, 255, 255, 255, 255, 0,
    0, 0, 255, 255, 0, 0,
  ]);

  const profile = deriveProfileFromAlpha(alpha, 6, 4, {
    bands: 4,
    minAlpha: 32,
    minWidth: 0.08,
  });

  assert.ok(profile[1].width > profile[0].width);
  assert.ok(Math.abs(profile[1].offset) < 0.05);
});

test('finds the visible foreground bounds for zooming', () => {
  const alpha = new Uint8ClampedArray([
    0, 0, 0, 0, 0, 0,
    0, 0, 255, 255, 0, 0,
    0, 0, 255, 255, 0, 0,
    0, 0, 0, 0, 0, 0,
  ]);

  const bounds = deriveForegroundBounds(alpha, 6, 4, {
    minAlpha: 32,
    padding: 0,
  });

  assert.deepEqual(bounds, { left: 2, top: 1, right: 3, bottom: 2 });
});

test('keeps horizontal motion when zooming foreground bounds', () => {
  const placement = computeForegroundPlacement({
    bounds: { left: 8, top: 6, right: 27, bottom: 53 },
    sourceWidth: 100,
    sourceHeight: 60,
    targetWidth: 200,
    targetHeight: 120,
  });

  const centeredX = (200 - placement.drawWidth) / 2;
  assert.ok(placement.drawX < centeredX);
});
