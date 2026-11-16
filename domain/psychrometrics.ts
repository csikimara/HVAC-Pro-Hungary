export type PsychrometricState = {
  dryBulbC: number;
  relativeHumidityPct: number;
  atmosphericPressurePa: number;
  saturationPressurePa: number;
  vapourPressurePa: number;
  dewPointC: number;
  humidityRatioKgKg: number;
  absoluteHumidityGm3: number;
  enthalpyKjKg: number;
  specificVolumeM3Kg: number;
};

export type TemperatureChangeResult = {
  targetTemperatureC: number;
  theoreticalRelativeHumidityPct: number;
  finalRelativeHumidityPct: number;
  finalHumidityRatioKgKg: number;
  finalDewPointC: number;
  condensateGPerKgDryAir: number;
  condensationOccurs: boolean;
};

export function saturationVapourPressurePa(dryBulbC: number): number {
  const kelvin = dryBulbC + 273.15;
  if (!Number.isFinite(kelvin) || kelvin <= 0) return Number.NaN;

  const logPressure = dryBulbC < 0
    ? -5.6745359e3 / kelvin
      + 6.3925247
      - 9.677843e-3 * kelvin
      + 6.2215701e-7 * kelvin ** 2
      + 2.0747825e-9 * kelvin ** 3
      - 9.484024e-13 * kelvin ** 4
      + 4.1635019 * Math.log(kelvin)
    : -5.8002206e3 / kelvin
      + 1.3914993
      - 4.8640239e-2 * kelvin
      + 4.1764768e-5 * kelvin ** 2
      - 1.4452093e-8 * kelvin ** 3
      + 6.5459673 * Math.log(kelvin);

  return Math.exp(logPressure);
}

export function humidityRatioFromVapourPressure(vapourPressurePa: number, atmosphericPressurePa: number): number {
  if (vapourPressurePa < 0 || atmosphericPressurePa <= vapourPressurePa) return Number.NaN;
  return 0.621945 * vapourPressurePa / (atmosphericPressurePa - vapourPressurePa);
}

export function dewPointFromVapourPressure(vapourPressurePa: number): number {
  if (!Number.isFinite(vapourPressurePa) || vapourPressurePa <= 0) return Number.NaN;
  let low = -100;
  let high = 200;
  for (let index = 0; index < 80; index += 1) {
    const middle = (low + high) / 2;
    if (saturationVapourPressurePa(middle) < vapourPressurePa) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function psychrometricState(
  dryBulbC: number,
  relativeHumidityPct: number,
  atmosphericPressurePa = 101_325,
): PsychrometricState | null {
  if (!Number.isFinite(dryBulbC) || dryBulbC < -80 || dryBulbC > 200) return null;
  if (!Number.isFinite(relativeHumidityPct) || relativeHumidityPct <= 0 || relativeHumidityPct > 100) return null;
  if (!Number.isFinite(atmosphericPressurePa) || atmosphericPressurePa < 30_000 || atmosphericPressurePa > 120_000) return null;

  const saturationPressurePa = saturationVapourPressurePa(dryBulbC);
  const vapourPressurePa = saturationPressurePa * relativeHumidityPct / 100;
  const humidityRatioKgKg = humidityRatioFromVapourPressure(vapourPressurePa, atmosphericPressurePa);
  if (!Number.isFinite(humidityRatioKgKg)) return null;

  const kelvin = dryBulbC + 273.15;
  return {
    dryBulbC,
    relativeHumidityPct,
    atmosphericPressurePa,
    saturationPressurePa,
    vapourPressurePa,
    dewPointC: dewPointFromVapourPressure(vapourPressurePa),
    humidityRatioKgKg,
    absoluteHumidityGm3: vapourPressurePa / (461.52 * kelvin) * 1_000,
    enthalpyKjKg: 1.006 * dryBulbC + humidityRatioKgKg * (2_501 + 1.86 * dryBulbC),
    specificVolumeM3Kg: 0.287042 * kelvin * (1 + 1.607858 * humidityRatioKgKg) / (atmosphericPressurePa / 1_000),
  };
}

export function stateAfterTemperatureChange(state: PsychrometricState, targetTemperatureC: number): TemperatureChangeResult | null {
  if (!Number.isFinite(targetTemperatureC) || targetTemperatureC < -80 || targetTemperatureC > 200) return null;
  const targetSaturationPressure = saturationVapourPressurePa(targetTemperatureC);
  const theoreticalRelativeHumidityPct = state.vapourPressurePa / targetSaturationPressure * 100;
  const saturatedHumidityRatio = humidityRatioFromVapourPressure(targetSaturationPressure, state.atmosphericPressurePa);
  const condensationOccurs = theoreticalRelativeHumidityPct > 100;
  const finalHumidityRatioKgKg = condensationOccurs
    ? saturatedHumidityRatio
    : state.humidityRatioKgKg;
  const condensateGPerKgDryAir = Math.max(0, state.humidityRatioKgKg - finalHumidityRatioKgKg) * 1_000;

  return {
    targetTemperatureC,
    theoreticalRelativeHumidityPct,
    finalRelativeHumidityPct: Math.min(100, theoreticalRelativeHumidityPct),
    finalHumidityRatioKgKg,
    finalDewPointC: condensationOccurs ? targetTemperatureC : state.dewPointC,
    condensateGPerKgDryAir,
    condensationOccurs,
  };
}

export function surfaceCondensationMarginC(state: PsychrometricState, surfaceTemperatureC: number): number | null {
  if (!Number.isFinite(surfaceTemperatureC)) return null;
  return surfaceTemperatureC - state.dewPointC;
}
