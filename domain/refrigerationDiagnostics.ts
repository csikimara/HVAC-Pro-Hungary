export type DiagnosticPressureUnit = 'bar' | 'kPa' | 'MPa' | 'psi';
export type DiagnosticPressureBasis = 'gauge' | 'absolute';

export function pressureToAbsoluteBar(
  value: number,
  unit: DiagnosticPressureUnit,
  basis: DiagnosticPressureBasis,
  atmosphericBar = 1.01325,
) {
  if (!Number.isFinite(value) || !Number.isFinite(atmosphericBar) || atmosphericBar <= 0) return null;
  const enteredBar = unit === 'bar' ? value : unit === 'kPa' ? value / 100 : unit === 'MPa' ? value * 10 : value * 0.0689475729;
  const absoluteBar = basis === 'gauge' ? enteredBar + atmosphericBar : enteredBar;
  return absoluteBar > 0 ? absoluteBar : null;
}

export function compressorMeasurementSnapshot(input: {
  suctionPressure: number;
  dischargePressure: number;
  pressureUnit: DiagnosticPressureUnit;
  pressureBasis: DiagnosticPressureBasis;
  atmosphericBar?: number;
  suctionTemperatureC: number;
  dischargeTemperatureC: number;
  suctionSaturationTemperatureC: number;
  dischargeSaturationTemperatureC: number;
  liquidTemperatureC: number;
  measuredCurrentA: number;
  referenceCurrentA: number;
}) {
  const suctionAbsoluteBar = pressureToAbsoluteBar(input.suctionPressure, input.pressureUnit, input.pressureBasis, input.atmosphericBar);
  const dischargeAbsoluteBar = pressureToAbsoluteBar(input.dischargePressure, input.pressureUnit, input.pressureBasis, input.atmosphericBar);
  const numericValues = [input.suctionTemperatureC, input.dischargeTemperatureC, input.suctionSaturationTemperatureC,
    input.dischargeSaturationTemperatureC, input.liquidTemperatureC, input.measuredCurrentA, input.referenceCurrentA];
  if (suctionAbsoluteBar == null || dischargeAbsoluteBar == null || dischargeAbsoluteBar <= suctionAbsoluteBar ||
      numericValues.some(value => !Number.isFinite(value)) || input.measuredCurrentA < 0 || input.referenceCurrentA <= 0) return null;

  return {
    suctionAbsoluteBar,
    dischargeAbsoluteBar,
    compressionRatio: dischargeAbsoluteBar / suctionAbsoluteBar,
    superheatK: input.suctionTemperatureC - input.suctionSaturationTemperatureC,
    subcoolingK: input.dischargeSaturationTemperatureC - input.liquidTemperatureC,
    dischargeTemperatureC: input.dischargeTemperatureC,
    currentPercentOfReference: input.measuredCurrentA / input.referenceCurrentA * 100,
  };
}
