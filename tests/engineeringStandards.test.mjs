import assert from 'node:assert/strict';
import {
  APP_LANGUAGES,
  EUROPEAN_CORE_STANDARDS,
  EUROPEAN_JURISDICTIONS,
  canClaimNationalCompliance,
  jurisdictionStatus,
} from '../domain/engineeringStandards.ts';

assert.equal(APP_LANGUAGES.length, 8);
assert.equal(new Set(APP_LANGUAGES.map(item => item.code)).size, APP_LANGUAGES.length);
assert.ok(EUROPEAN_JURISDICTIONS.length >= 40);
assert.equal(new Set(EUROPEAN_JURISDICTIONS.map(item => item[0])).size, EUROPEAN_JURISDICTIONS.length);
assert.ok(EUROPEAN_CORE_STANDARDS.some(item => item.id === 'EN ISO 52016-1'));
assert.ok(EUROPEAN_CORE_STANDARDS.some(item => item.id.startsWith('EN 16282')));
assert.equal(jurisdictionStatus('HU'), 'verification-in-progress');
assert.equal(jurisdictionStatus('DE'), 'national-review-required');
assert.equal(canClaimNationalCompliance('HU'), false);

console.log('engineeringStandards: nyelvek, országprofilok és megfelelőségi védelem rendben');
