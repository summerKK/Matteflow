import test from 'node:test';
import assert from 'node:assert/strict';
import { LEFT_COLUMN_TEXT, RIGHT_COLUMN_TEXT } from '../src/sampleText.js';

test('editorial copy avoids demo instructions in the body text', () => {
  assert.doesNotMatch(LEFT_COLUMN_TEXT, /pick a local video/i);
  assert.doesNotMatch(RIGHT_COLUMN_TEXT, /adjust the threshold/i);
});
