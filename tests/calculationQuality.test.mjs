import assert from 'node:assert/strict';
import { classifyCalculationQuality, SUPPORTED_LOCALES } from '../domain/calculationQuality.ts';

const base = {
  mode: 'complete-inputs',
  methodId: 'heat-load-detailed',
  methodVersion: '1.0.0',
  requiredInputCount: 20,
  suppliedRequiredInputCount: 20,
  assumedInputKeys: [],
  missingRequiredInputKeys: [],
  sources: [{ kind: 'standard', title: 'Ellenőrzött módszer' }],
  verificationRequired: 'designer-review',
};

assert.equal(classifyCalculationQuality(base).level, 'engineering');
assert.equal(classifyCalculationQuality({ ...base, assumedInputKeys: ['window.gValue'] }).level, 'engineering-estimate');
assert.equal(classifyCalculationQuality({ ...base, suppliedRequiredInputCount: 15, missingRequiredInputKeys: ['airLeakage'] }).dataCompletenessPercent, 75);
assert.equal(classifyCalculationQuality({ ...base, sources: [] }).level, 'estimate');
assert.equal(classifyCalculationQuality({
  ...base,
  manufacturerProductConfirmed: true,
  manufacturerRangeConfirmed: true,
  sources: [{ kind: 'manufacturer', title: 'Gyártói görbe' }],
}).level, 'manufacturer');
assert.deepEqual(SUPPORTED_LOCALES, ['hu', 'ro', 'de', 'en', 'sk', 'fr', 'it', 'hr']);
console.log('calculationQuality: minősítés, teljesség és 8 nyelv szerződése rendben');
