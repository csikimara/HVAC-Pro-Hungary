import assert from 'node:assert/strict';
import { calculateDuctPathPressure, DUCT_MATERIALS } from '../domain/ductPressure.ts';

function closeTo(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} != ${expected} ± ${tolerance}`);
}

const base = {
  airflowM3h: 500,
  airTemperatureC: 20,
  atmosphericPressurePa: 101325,
  segments: [{ id: 1, material: 'spiral', lengthM: 10, diameterMm: 200, manufacturerLossPaPerM: null }],
  fittings: [],
  terminals: [],
};

const engineering = calculateDuctPathPressure(base);
assert.ok(engineering, 'Az érvényes légút számítása nem lehet null.');
closeTo(engineering.airDensityKgM3, 1.204, 0.002, '20 °C-os száraz levegő sűrűsége');
assert.equal(engineering.method, 'Darcy–Weisbach + Reynolds-szám + Swamee–Jain');
assert.equal(engineering.usesEstimate, true);
assert.equal(engineering.dataQuality, 'mixed-or-general');

const enteredProductData = calculateDuctPathPressure({
  ...base,
  segments: [{ ...base.segments[0], manufacturerLossPaPerM: 2.5 }],
});
assert.ok(enteredProductData);
closeTo(enteredProductData.straightPressurePa, 25, 1e-10, 'Kézzel megadott 2,5 Pa/m × 10 m');
assert.equal(enteredProductData.usesEstimate, false);
assert.equal(enteredProductData.dataQuality, 'user-product-data');

const withFitting = calculateDuctPathPressure({
  ...base,
  segments: [{ ...base.segments[0], manufacturerLossPaPerM: 0 }],
  fittings: [{ type: 'bend90Long', count: 2, segmentId: 1 }],
});
assert.ok(withFitting);
const velocity = (500 / 3600) / (Math.PI * 0.2 * 0.2 / 4);
const expectedFitting = 2 * 0.25 * 0.5 * withFitting.airDensityKgM3 * velocity * velocity;
closeTo(withFitting.fittingPressurePa, expectedFitting, 1e-10, 'K × dinamikus nyomás idomveszteség');
assert.equal(withFitting.usesEstimate, true);

const verifiedFitting = calculateDuctPathPressure({
  ...base,
  segments: [{ ...base.segments[0], manufacturerLossPaPerM: 0 }],
  fittings: [{ type: 'bend90Long', count: 2, segmentId: 1, verifiedCoefficient: 0.11 }],
});
assert.ok(verifiedFitting);
closeTo(verifiedFitting.fittingPressurePa, 2 * 0.11 * 0.5 * verifiedFitting.airDensityKgM3 * velocity * velocity, 1e-10, 'Ellenőrzött egyedi K használata');
assert.equal(verifiedFitting.usesEstimate, false);

const verifiedCurveFitting = calculateDuctPathPressure({
  ...base,
  segments: [{ ...base.segments[0], manufacturerLossPaPerM: 0 }],
  fittings: [{ type: 'elbow90Pressed', count: 2, segmentId: 1, verifiedPressurePaEach: 11.25, verifiedProductData: true }],
});
assert.ok(verifiedCurveFitting);
closeTo(verifiedCurveFitting.fittingPressurePa, 22.5, 1e-10, 'Gyártói görbéből kapott közvetlen Pa/db');
assert.equal(verifiedCurveFitting.usesEstimate, false);

assert.equal(calculateDuctPathPressure({ ...base, airflowM3h: 0 }), null);
assert.equal(calculateDuctPathPressure({ ...base, segments: [{ ...base.segments[0], diameterMm: 0 }] }), null);

assert.equal(DUCT_MATERIALS.sonodecTight.lossMultiplier, 1);
assert.equal(DUCT_MATERIALS.sonodecSlight.lossMultiplier, 1);
assert.equal(DUCT_MATERIALS.sonodecLoose.lossMultiplier, 1);

const flexible = calculateDuctPathPressure({
  ...base,
  segments: [{ ...base.segments[0], material: 'sonodecLoose', lengthM: 1 }],
});
assert.ok(flexible);
const flexibleSegment = flexible.segments[0];
const expectedFlexibleLoss = flexibleSegment.frictionFactor
  * 0.5 * flexible.airDensityKgM3 * flexibleSegment.velocityMs ** 2 / 0.2;
closeTo(flexibleSegment.pressurePaPerM, expectedFlexibleLoss, 1e-10, 'Flexibilis cső effektív érdessége csak egyszer szerepel');

const afterYSplit = calculateDuctPathPressure({
  ...base,
  airflowM3h: 200,
  segments: [
    { ...base.segments[0], id: 1, lengthM: 2, airflowM3h: 200 },
    { ...base.segments[0], id: 2, lengthM: 2, airflowM3h: 100 },
  ],
});
assert.ok(afterYSplit);
assert.equal(afterYSplit.segments[0].airflowM3h, 200);
assert.equal(afterYSplit.segments[1].airflowM3h, 100);
assert.ok(afterYSplit.segments[0].velocityMs > afterYSplit.segments[1].velocityMs);

console.log('ductPressure: alapképletek és szakaszonként eltérő légmennyiség rendben');
