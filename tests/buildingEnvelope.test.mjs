import assert from 'node:assert/strict';
import { baseWallU, PANEL_SYSTEM_U_W_M2K, wallUWithExternalInsulation } from '../domain/buildingEnvelope.ts';

assert.equal(baseWallU('panel', 'pecs'), 1.96);
assert.equal(baseWallU('panel', 'gyorMiskolc'), 0.86);
assert.equal(baseWallU('panel', 'larsenNielsen'), 0.73);
assert.equal(baseWallU('panel', 'unknown'), 1.96);
assert.equal(baseWallU('solidConcrete25'), 3.02);
assert.deepEqual(Object.values(PANEL_SYSTEM_U_W_M2K).sort((a, b) => a - b), [0.73, 0.86, 1.96, 1.96]);

const insulatedConcrete = wallUWithExternalInsulation(3.02, 10);
assert.ok(insulatedConcrete);
assert.ok(Math.abs(insulatedConcrete - 0.3532) < 0.001);
assert.equal(wallUWithExternalInsulation(0, 10), null);
assert.equal(wallUWithExternalInsulation(1, -1), null);

console.log('buildingEnvelope: panelrendszerek, tömör vasbeton és külső hőszigetelés rendben');
