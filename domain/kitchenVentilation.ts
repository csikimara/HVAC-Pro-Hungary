export type CommercialCookingDuty = 'light' | 'medium' | 'heavy';

// Greenheck preliminary design guide values converted from cfm/ft² to m³/h per m².
// These are not MSZ EN 16282 calculation values and must be labelled as estimates.
export const PRELIMINARY_COMMERCIAL_HOOD_RATES_M3H_M2: Record<CommercialCookingDuty, number> = {
  light: 914.4,
  medium: 1280.2,
  heavy: 1828.8,
};

export function roomVolume(areaM2: number, heightM: number) {
  return areaM2 > 0 && heightM > 0 ? areaM2 * heightM : 0;
}

export function airflowForAirChanges(volumeM3: number, airChangesPerHour: number) {
  return volumeM3 > 0 && airChangesPerHour > 0 ? volumeM3 * airChangesPerHour : 0;
}

export function airChangesForAirflow(volumeM3: number, airflowM3h: number) {
  return volumeM3 > 0 && airflowM3h >= 0 ? airflowM3h / volumeM3 : 0;
}

export function preliminaryCommercialHoodAirflow(hoodAreaM2: number, duty: CommercialCookingDuty) {
  return hoodAreaM2 > 0 ? hoodAreaM2 * PRELIMINARY_COMMERCIAL_HOOD_RATES_M3H_M2[duty] : 0;
}

export function kitchenAirBalance(extractM3h: number, makeUpPercent: number) {
  const percent = Math.min(100, Math.max(0, makeUpPercent));
  const supplyM3h = Math.max(0, extractM3h) * percent / 100;
  return { supplyM3h, transferAirM3h: Math.max(0, extractM3h) - supplyM3h };
}

export function filterFaceVelocity(airflowM3h: number, filterAreaM2: number) {
  return airflowM3h > 0 && filterAreaM2 > 0 ? airflowM3h / 3600 / filterAreaM2 : 0;
}
