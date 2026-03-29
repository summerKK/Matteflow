import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PROFILE,
  profileBandIndex,
  sampleProfileWidth,
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
