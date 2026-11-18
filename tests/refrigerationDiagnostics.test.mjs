import assert from 'node:assert/strict';
import { compressorMeasurementSnapshot, pressureToAbsoluteBar } from '../domain/refrigerationDiagnostics.ts';

assert.ok(Math.abs(pressureToAbsoluteBar(5, 'bar', 'gauge') - 6.01325) < 1e-12);
assert.equal(pressureToAbsoluteBar(5, 'bar', 'absolute'), 5);
assert.ok(Math.abs(pressureToAbsoluteBar(500, 'kPa', 'gauge') - 6.01325) < 1e-12);
assert.ok(Math.abs(pressureToAbsoluteBar(0.5, 'MPa', 'gauge') - 6.01325) < 1e-12);
assert.ok(Math.abs(pressureToAbsoluteBar(72.5189, 'psi', 'gauge') - 6.01325) < 0.0001);

const gaugeInput = {
  suctionPressure: 5, dischargePressure: 20, pressureUnit: 'bar', pressureBasis: 'gauge',
  suctionTemperatureC: 10, dischargeTemperatureC: 95,
  suctionSaturationTemperatureC: 5, dischargeSaturationTemperatureC: 45, liquidTemperatureC: 38,
  measuredCurrentA: 8, referenceCurrentA: 10,
};
const gauge = compressorMeasurementSnapshot(gaugeInput);
assert.ok(gauge);
assert.ok(Math.abs(gauge.compressionRatio - (21.01325 / 6.01325)) < 1e-12);
assert.equal(gauge.superheatK, 5);
assert.equal(gauge.subcoolingK, 7);
assert.equal(gauge.currentPercentOfReference, 80);

const absolute = compressorMeasurementSnapshot({ ...gaugeInput, pressureBasis: 'absolute' });
assert.ok(absolute);
assert.equal(absolute.compressionRatio, 4);
assert.equal(compressorMeasurementSnapshot({ ...gaugeInput, suctionPressure: 20, dischargePressure: 5 }), null);

console.log('refrigerationDiagnostics: nyomásalap, mértékegységek és kompresszióviszony rendben');
