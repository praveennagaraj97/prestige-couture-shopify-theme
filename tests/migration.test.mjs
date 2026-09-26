import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  escapeLiquidString,
  mapRoute,
  settingLabel,
} from '../scripts/content-utils.mjs';
test('native routes preserve product handles, query strings and anchors', () => {
  assert.equal(mapRoute('/products'), '/collections/all');
  assert.equal(
    mapRoute('/products/indigo-kurti?variant=3'),
    '/products/indigo-kurti?variant=3',
  );
  assert.equal(
    mapRoute('/help/sizing-fit#measure'),
    '/pages/help-sizing-fit#measure',
  );
  assert.equal(mapRoute('/about'), '/pages/about');
  assert.equal(
    mapRoute('https://www.instagram.com/krithi_weaves_'),
    'https://www.instagram.com/krithi_weaves_',
  );
});
test('Liquid fallback strings cannot terminate literals', () =>
  assert.equal(escapeLiquidString("India's cotton"), 'India’s cotton'));
test('settings have human-readable bounded labels', () =>
  assert.equal(settingLabel('Read More', 'Link'), 'Link: Read More'));
