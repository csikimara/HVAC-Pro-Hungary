import assert from 'node:assert/strict';
import { VERIFIED_MANUFACTURER_CURVES, manufacturersWithVerifiedData, pressureFromManufacturerCurve } from '../domain/manufacturerPressureData.ts';

const product = VERIFIED_MANUFACTURER_CURVES.find(item => item.id === 'trox-fba-250-dirt-tray');
assert.ok(product, 'Az ellenőrzött TROX-terméknek szerepelnie kell az adatbázisban.');
assert.equal(product.source.productCode, 'FBA-250');
assert.equal(product.nominalSizeMm, 250);

const exact = pressureFromManufacturerCurve(product, 43 * 3.6);
assert.equal(exact.status, 'ok');
assert.equal(exact.pressurePa, 20);

const interpolated = pressureFromManufacturerCurve(product, 47.5 * 3.6);
assert.equal(interpolated.status, 'ok');
assert.ok(Math.abs(interpolated.pressurePa - 25) < 1e-9);

assert.equal(pressureFromManufacturerCurve(product, product.minFlowM3h - 1).status, 'outside-range');
assert.equal(pressureFromManufacturerCurve(product, product.maxFlowM3h + 1).status, 'outside-range');

const lindab = VERIFIED_MANUFACTURER_CURVES.find(item => item.id === 'lindab-bu-200-90');
assert.ok(lindab, 'A Lindab BU 200 90° hivatalos görbéjének szerepelnie kell az adatbázisban.');
assert.equal(lindab.source.productCode, 'BU 200 90');
assert.equal(lindab.source.dataExtraction, 'official-vector-chart');
assert.equal(lindab.interpolation, 'log-log');
assert.equal(VERIFIED_MANUFACTURER_CURVES.filter(item => item.source.manufacturer === 'Lindab' && item.source.productFamily === 'Safe BU').length, 34);

const geometricMidFlow = Math.sqrt(lindab.minFlowM3h * lindab.maxFlowM3h);
const lindabMid = pressureFromManufacturerCurve(lindab, geometricMidFlow);
assert.equal(lindabMid.status, 'ok');
assert.ok(Math.abs(lindabMid.pressurePa - Math.sqrt(lindab.curve[0].pressurePa * lindab.curve[1].pressurePa)) < 1e-9, 'Log-log interpoláció');
assert.equal(pressureFromManufacturerCurve(lindab, lindab.minFlowM3h - 0.01).status, 'outside-range');
assert.deepEqual(manufacturersWithVerifiedData('fitting', 'elbow90Pressed', 200), ['Általános', 'Lindab']);
assert.deepEqual(manufacturersWithVerifiedData('fitting', 'teeBranch', 200), ['Általános']);

const rcuReducer = VERIFIED_MANUFACTURER_CURVES.find(item => item.id === 'lindab-rcu-200-160-reducer');
assert.ok(rcuReducer, 'A Lindab RCU 200/160 szűkítő irányú görbéjének szerepelnie kell.');
assert.equal(rcuReducer.source.productCode, 'RCU 200 160');
assert.equal(rcuReducer.nominalSizeMm, 200);
assert.equal(rcuReducer.secondaryNominalSizeMm, 160);
assert.equal(rcuReducer.flowDirection, 'large-to-small');
assert.equal(pressureFromManufacturerCurve(rcuReducer, rcuReducer.minFlowM3h - 0.01).status, 'outside-range');

const rcuExpander = VERIFIED_MANUFACTURER_CURVES.find(item => item.id === 'lindab-rcu-200-160-expander');
assert.ok(rcuExpander, 'Ugyanazt az RCU terméket a fordított, bővítő irányban külön görbével kell kezelni.');
assert.equal(rcuExpander.nominalSizeMm, 160);
assert.equal(rcuExpander.secondaryNominalSizeMm, 200);
assert.equal(rcuExpander.flowDirection, 'small-to-large');
assert.notEqual(rcuReducer.curve[0].pressurePa, rcuExpander.curve[0].pressurePa);
assert.equal(VERIFIED_MANUFACTURER_CURVES.filter(item => item.source.productFamily === 'Safe RCU').length, 52);
assert.deepEqual(manufacturersWithVerifiedData('fitting', 'reducer', 200, 160), ['Általános', 'Lindab']);
assert.deepEqual(manufacturersWithVerifiedData('fitting', 'reducer', 200, 180), ['Általános']);

console.log('manufacturerPressureData: termékkód, méret, interpoláció és extrapolációtilalom rendben');
