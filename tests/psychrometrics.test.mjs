import assert from 'node:assert/strict';
import { psychrometricState, stateAfterTemperatureChange, surfaceCondensationMarginC } from '../domain/psychrometrics.ts';

const state = psychrometricState(25, 50, 101325);
assert.ok(state);
assert.ok(Math.abs(state.dewPointC - 13.86) < 0.08, `harmatpont: ${state.dewPointC}`);
assert.ok(Math.abs(state.humidityRatioKgKg * 1000 - 9.88) < 0.08, `nedvességtartalom: ${state.humidityRatioKgKg * 1000}`);
assert.ok(Math.abs(state.absoluteHumidityGm3 - 11.51) < 0.08, `abszolút páratartalom: ${state.absoluteHumidityGm3}`);

const cooled = stateAfterTemperatureChange(state, 20);
assert.ok(cooled);
assert.equal(cooled.condensationOccurs, false);
assert.ok(Math.abs(cooled.finalRelativeHumidityPct - 67.75) < 0.15, `20 °C RH: ${cooled.finalRelativeHumidityPct}`);

const condensed = stateAfterTemperatureChange(state, 10);
assert.ok(condensed);
assert.equal(condensed.condensationOccurs, true);
assert.equal(condensed.finalRelativeHumidityPct, 100);
assert.ok(condensed.condensateGPerKgDryAir > 2);
assert.ok((surfaceCondensationMarginC(state, 12) ?? 1) < 0);
assert.ok((surfaceCondensationMarginC(state, 16) ?? -1) > 0);

assert.equal(psychrometricState(25, 0, 101325), null);
assert.equal(psychrometricState(25, 101, 101325), null);
assert.equal(psychrometricState(25, 50, 20_000), null);

console.log('psychrometrics: harmatpont, nedvességtartalom, hőmérséklet-változás és kondenzáció rendben');
