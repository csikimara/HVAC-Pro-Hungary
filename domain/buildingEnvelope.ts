export type WallConstruction = 'oldBrick' | 'brick' | 'modernBrick' | 'light' | 'panel' | 'solidConcrete25';
export type PanelSystem = 'unknown' | 'pecs' | 'gyorMiskolc' | 'larsenNielsen';

export const WALL_BASE_U_W_M2K: Record<Exclude<WallConstruction, 'panel'>, number> = {
  oldBrick: 1.4,
  brick: 0.8,
  modernBrick: 0.45,
  light: 0.38,
  solidConcrete25: 3.02,
};

// ÉMI: iparosított technológiával épült magyar lakóépületek példái.
// Az „unknown” érték szándékosan a dokumentált tartomány kedvezőtlenebb széle:
// ismeretlen panelrendszernél ne állítsunk indokolatlanul jó hőszigetelést.
export const PANEL_SYSTEM_U_W_M2K: Record<PanelSystem, number> = {
  unknown: 1.96,
  pecs: 1.96,
  gyorMiskolc: 0.86,
  larsenNielsen: 0.73,
};

export function baseWallU(wall: WallConstruction, panelSystem: PanelSystem = 'unknown') {
  return wall === 'panel' ? PANEL_SYSTEM_U_W_M2K[panelSystem] : WALL_BASE_U_W_M2K[wall];
}

export function wallUWithExternalInsulation(baseU: number, insulationCm: number, insulationLambdaWmK = 0.04) {
  if (!(baseU > 0) || insulationCm < 0 || !(insulationLambdaWmK > 0)) return null;
  return 1 / (1 / baseU + insulationCm / 100 / insulationLambdaWmK);
}
