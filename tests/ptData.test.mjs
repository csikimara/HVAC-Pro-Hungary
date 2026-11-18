import assert from 'node:assert/strict';
import { PT_SATURATION_DATA } from '../domain/ptData.ts';

assert.equal(Object.keys(PT_SATURATION_DATA).length, 14);
for (const [refrigerant, rows] of Object.entries(PT_SATURATION_DATA)) {
  assert.ok(rows.length >= 150, `${refrigerant}: túl kevés táblapont`);
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(rows[index][0] > rows[index - 1][0], `${refrigerant}: a hőmérséklet nem növekvő`);
    assert.ok(rows[index][1] > rows[index - 1][1], `${refrigerant}: a buborékpont-nyomás nem növekvő`);
    assert.ok(rows[index][2] > rows[index - 1][2], `${refrigerant}: a harmatpont-nyomás nem növekvő`);
  }
}
assert.notEqual(PT_SATURATION_DATA.R407C[20][1], PT_SATURATION_DATA.R407C[20][2]);
assert.notEqual(PT_SATURATION_DATA.R454B[20][1], PT_SATURATION_DATA.R454B[20][2]);
assert.notEqual(PT_SATURATION_DATA.R454C[20][1], PT_SATURATION_DATA.R454C[20][2]);
assert.notEqual(PT_SATURATION_DATA.R448A[20][1], PT_SATURATION_DATA.R448A[20][2]);
assert.notEqual(PT_SATURATION_DATA.R449A[20][1], PT_SATURATION_DATA.R449A[20][2]);
assert.equal(PT_SATURATION_DATA.R32[20][1], PT_SATURATION_DATA.R32[20][2]);

function pressureAt(refrigerant, temperatureC, phaseColumn = 1) {
  const row = PT_SATURATION_DATA[refrigerant].find(item => item[0] === temperatureC);
  assert.ok(row, `${refrigerant}: hiányzó ${temperatureC} °C referenciapont`);
  return row[phaseColumn];
}

// Fagyasztott CoolProp 8.0.0 referenciapontok: nagyságrendi, hűtőközeg-
// felcserélési és relatív/abszolút nyomásalap-hibák regressziós védelme.
assert.ok(Math.abs(pressureAt('R410A', 0, 1) - 8.0070538) < 1e-7);
assert.ok(Math.abs(pressureAt('R410A', 20, 2) - 14.4292736) < 1e-7);
assert.ok(Math.abs(pressureAt('R32', 0) - 8.1310126) < 1e-7);
assert.ok(Math.abs(pressureAt('R32', 20) - 14.745658) < 1e-7);
assert.ok(Math.abs(pressureAt('R134a', 20) - 5.7170691) < 1e-7);
console.log('ptData: 14 hűtőközeg és a teljes monotonitás ellenőrizve');
