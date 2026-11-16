import assert from 'node:assert/strict';
import { balancedThreePhasePower, singlePhasePower } from '../domain/electricalPower.ts';

const linear = singlePhasePower(230, 10, 0.8, 'displacement-cos-phi');
assert.ok(linear);
assert.equal(linear.apparentPowerVA, 2300);
assert.equal(linear.activePowerW, 1840);
assert.equal(Math.round(linear.reactivePowerVAr), 1380);

const inverter = singlePhasePower(230, 10, 0.8, 'true-pf');
assert.ok(inverter);
assert.equal(inverter.activePowerW, 1840);
assert.equal(inverter.reactivePowerVAr, null);
assert.ok(inverter.nonActivePowerVA > 0);
assert.equal(inverter.requiresTrueRms, true);

const threePhase = balancedThreePhasePower(400, 16, 0.9, 'true-pf');
assert.ok(threePhase);
assert.ok(Math.abs(threePhase.apparentPowerVA - Math.sqrt(3) * 400 * 16) < 1e-9);
assert.equal(balancedThreePhasePower(400, 16, 1.1, 'true-pf'), null);

console.log('electricalPower: PF/cos φ és nem aktív teljesítmény szétválasztása rendben');
