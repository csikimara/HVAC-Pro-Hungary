import assert from 'node:assert/strict';
import { createCalculationRecord, recordMissingInputs } from '../domain/calculationRecord.ts';

const record = createCalculationRecord({
  toolId: 'test', toolTitle: 'Teszt', language: 'hu', jurisdiction: 'HU',
  method: { id: 'm1', version: '1.0.0', name: 'Próba', formulaSummary: 'x+y' },
  inputs: [
    { key: 'x', label: 'X', value: 1, origin: 'measured' },
    { key: 'y', label: 'Y', value: null, origin: 'missing' },
  ],
  outputs: [{ key: 'z', label: 'Z', value: 2, origin: 'calculated' }],
  assumptions: [], sources: [],
  quality: { level: 'engineering-estimate', mode: 'complete-inputs', methodId: 'm1', methodVersion: '1.0.0', dataCompletenessPercent: 50, assumedInputKeys: [], missingRequiredInputKeys: ['y'], sources: [], verificationRequired: 'designer-review' },
  complianceState: 'teszt', requiredVerification: ['ellenőrzés'],
});

assert.match(record.id, /^calc-/);
assert.match(record.contentFingerprint, /^fnv1a-[0-9a-f]{8}$/);
assert.deepEqual(recordMissingInputs(record).map(item => item.key), ['y']);
console.log('calculationRecord: változatlan bemenet, hiánylista és ujjlenyomat rendben');
