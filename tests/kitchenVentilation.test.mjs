import assert from 'node:assert/strict';
import { airflowForAirChanges, airChangesForAirflow, filterFaceVelocity, kitchenAirBalance, preliminaryCommercialHoodAirflow, roomVolume } from '../domain/kitchenVentilation.ts';

assert.equal(roomVolume(20, 3.1), 62);
assert.equal(airflowForAirChanges(62, 10), 620);
assert.equal(airChangesForAirflow(62, 620), 10);
assert.ok(Math.abs(preliminaryCommercialHoodAirflow(2, 'medium') - 2560.4) < 0.01);
assert.deepEqual(kitchenAirBalance(2000, 90), { supplyM3h: 1800, transferAirM3h: 200 });
assert.ok(Math.abs(filterFaceVelocity(1800, 0.5) - 1) < 0.0001);
console.log('kitchenVentilation: oda-vissza számítás, légmérleg és szűrőfelületi sebesség rendben');
