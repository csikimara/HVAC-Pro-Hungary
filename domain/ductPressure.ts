export type DuctMaterialId = 'spiral' | 'plastic' | 'aluminium' | 'sonodecTight' | 'sonodecSlight' | 'sonodecLoose';
export type FittingTypeId = 'elbow90Sharp' | 'elbow90Pressed' | 'bend90Long' | 'bend60' | 'bend45' | 'bend30' | 'bend15' | 'teeStraight' | 'teeBranch' | 'yStraight' | 'yBranch' | 'saddleBranch' | 'crossStraight' | 'crossBranch' | 'reducer' | 'expander' | 'roundRectTransition' | 'damperOpen' | 'fireDamper' | 'backdraftDamper' | 'flexConnector';
export type TerminalTypeId = 'supplyValve' | 'extractValve' | 'grille' | 'weatherLouver' | 'diffuser' | 'slotDiffuser' | 'jetNozzle' | 'verticalDischargeCowl' | 'roofIntakeCowl' | 'silencer' | 'filter' | 'coil' | 'custom';

export const DUCT_MATERIALS: Record<DuctMaterialId, { label: string; roughnessMm: number; lossMultiplier: number }> = {
  spiral: { label: 'Spirálkorcolt horganyzott cső', roughnessMm: 0.09, lossMultiplier: 1 },
  plastic: { label: 'Sima műanyag / PVC cső', roughnessMm: 0.0015, lossMultiplier: 1 },
  // Corrugated and flexible ducts use an estimated effective roughness here.
  // Applying an additional multiplier would count the same corrugation effect twice.
  aluminium: { label: 'Félmerev alumínium cső', roughnessMm: 0.3, lossMultiplier: 1 },
  sonodecTight: { label: 'Sonodec – teljesen kihúzva', roughnessMm: 1.5, lossMultiplier: 1 },
  sonodecSlight: { label: 'Sonodec – enyhén hullámos', roughnessMm: 3, lossMultiplier: 1 },
  sonodecLoose: { label: 'Sonodec – összenyomva / belógva', roughnessMm: 6, lossMultiplier: 1 },
};

export const FITTING_TYPES: Record<FittingTypeId, { label: string; coefficient: number }> = {
  elbow90Sharp: { label: '90° könyök – rövid / éles', coefficient: 1.1 },
  elbow90Pressed: { label: '90° könyök – préselt / normál', coefficient: 0.75 },
  bend90Long: { label: '90° hosszú ív', coefficient: 0.25 },
  bend60: { label: '60° ív', coefficient: 0.28 },
  bend45: { label: '45° ív', coefficient: 0.2 },
  bend30: { label: '30° ív', coefficient: 0.12 },
  bend15: { label: '15° ív', coefficient: 0.06 },
  teeStraight: { label: 'T-idom – egyenes irány', coefficient: 0.4 },
  teeBranch: { label: 'T-idom – leágazó irány', coefficient: 1.5 },
  yStraight: { label: 'Y-idom – egyenes irány', coefficient: 0.25 },
  yBranch: { label: 'Y-idom – leágazó irány', coefficient: 0.65 },
  saddleBranch: { label: 'Nyeregidom / leágazócsonk', coefficient: 1.1 },
  crossStraight: { label: 'Keresztidom – egyenes irány', coefficient: 0.55 },
  crossBranch: { label: 'Keresztidom – leágazó irány', coefficient: 1.8 },
  reducer: { label: 'Szűkítő idom', coefficient: 0.25 },
  expander: { label: 'Bővítő idom', coefficient: 0.45 },
  roundRectTransition: { label: 'Kör–négyszög átmenet', coefficient: 0.35 },
  damperOpen: { label: 'Szabályozó csappantyú – teljesen nyitva', coefficient: 0.2 },
  fireDamper: { label: 'Tűzcsappantyú – nyitott állapot', coefficient: 0.8 },
  backdraftDamper: { label: 'Visszacsapó zsalu', coefficient: 2 },
  flexConnector: { label: 'Rezgéscsillapító vászonbetét', coefficient: 0.15 },
};

export const TERMINAL_TYPES: Record<TerminalTypeId, { label: string; defaultLossPa: number }> = {
  supplyValve: { label: 'Befúvó légszelep', defaultLossPa: 30 },
  extractValve: { label: 'Elszívó légszelep', defaultLossPa: 35 },
  grille: { label: 'Beltéri befúvó / elszívó rács', defaultLossPa: 20 },
  weatherLouver: { label: 'Kültéri esővédő / esővető rács', defaultLossPa: 35 },
  diffuser: { label: 'Mennyezeti diffúzor', defaultLossPa: 30 },
  slotDiffuser: { label: 'Résbefúvó', defaultLossPa: 35 },
  jetNozzle: { label: 'Fúvóka / jet nozzle', defaultLossPa: 45 },
  verticalDischargeCowl: { label: 'Kalapos függőleges kidobó', defaultLossPa: 45 },
  roofIntakeCowl: { label: 'Tetős beszívó sapka', defaultLossPa: 40 },
  silencer: { label: 'Hangcsillapító', defaultLossPa: 50 },
  filter: { label: 'Szűrő', defaultLossPa: 80 },
  coil: { label: 'Hőcserélő / kalorifer', defaultLossPa: 70 },
  custom: { label: 'Egyéb készülék – megadott adat', defaultLossPa: 0 },
};

export interface DuctSegmentInput {
  id: number;
  material: DuctMaterialId;
  lengthM: number;
  diameterMm: number;
  airflowM3h?: number | null;
  manufacturerLossPaPerM?: number | null;
}

export interface FittingInput {
  type: FittingTypeId;
  count: number;
  segmentId: number;
  /** Verified manufacturer/ASHRAE coefficient for this exact geometry and reference section. */
  verifiedCoefficient?: number | null;
  /** Direct pressure loss from the exact official product curve at this flow. */
  verifiedPressurePaEach?: number | null;
  verifiedProductData?: boolean;
}
export interface TerminalInput { type: TerminalTypeId; count: number; lossPaEach: number; verifiedProductData?: boolean; }

export interface SegmentPressureResult {
  id: number;
  airflowM3h: number;
  velocityMs: number;
  reynolds: number;
  frictionFactor: number | null;
  pressurePa: number;
  pressurePaPerM: number;
  source: 'user-entered-product-data' | 'engineering-with-estimated-material-data';
}

export interface PathPressureResult {
  airDensityKgM3: number;
  segments: SegmentPressureResult[];
  straightPressurePa: number;
  fittingPressurePa: number;
  terminalPressurePa: number;
  totalPressurePa: number;
  usesEstimate: boolean;
  method: 'Darcy–Weisbach + Reynolds-szám + Swamee–Jain';
  dataQuality: 'user-product-data' | 'mixed-or-general';
  generalDataItems: number;
}

const AIR_GAS_CONSTANT = 287.058;

function dynamicViscosity(temperatureK: number): number {
  return 1.716e-5 * Math.pow(temperatureK / 273.15, 1.5) * ((273.15 + 111) / (temperatureK + 111));
}

function frictionFactor(reynolds: number, roughnessM: number, diameterM: number): number {
  if (reynolds < 2300) return 64 / reynolds;
  return 0.25 / Math.pow(Math.log10((roughnessM / (3.7 * diameterM)) + (5.74 / Math.pow(reynolds, 0.9))), 2);
}

export function calculateDuctPathPressure(input: {
  airflowM3h: number;
  airTemperatureC: number;
  atmosphericPressurePa: number;
  segments: DuctSegmentInput[];
  fittings: FittingInput[];
  terminals: TerminalInput[];
}): PathPressureResult | null {
  const { airflowM3h, airTemperatureC, atmosphericPressurePa, segments, fittings, terminals } = input;
  if (airflowM3h <= 0 || atmosphericPressurePa <= 0 || segments.length === 0) return null;

  const temperatureK = airTemperatureC + 273.15;
  if (temperatureK <= 0) return null;
  const density = atmosphericPressurePa / (AIR_GAS_CONSTANT * temperatureK);
  const viscosity = dynamicViscosity(temperatureK);
  const segmentResults: SegmentPressureResult[] = [];
  for (const segment of segments) {
    if (segment.lengthM < 0 || segment.diameterMm <= 0) return null;
    const segmentAirflowM3h = segment.airflowM3h ?? airflowM3h;
    if (segmentAirflowM3h <= 0) return null;
    const flowM3s = segmentAirflowM3h / 3600;
    const diameterM = segment.diameterMm / 1000;
    const areaM2 = Math.PI * diameterM * diameterM / 4;
    const velocity = flowM3s / areaM2;
    const material = DUCT_MATERIALS[segment.material];
    const reynolds = density * velocity * diameterM / viscosity;
    const suppliedLoss = segment.manufacturerLossPaPerM;

    if (suppliedLoss != null && suppliedLoss >= 0) {
      segmentResults.push({
        id: segment.id,
        airflowM3h: segmentAirflowM3h,
        velocityMs: velocity,
        reynolds,
        frictionFactor: null,
        pressurePaPerM: suppliedLoss,
        pressurePa: suppliedLoss * segment.lengthM,
        source: 'user-entered-product-data',
      });
      continue;
    }

    const factor = frictionFactor(reynolds, material.roughnessMm / 1000, diameterM);
    const pressurePaPerM = factor * (density * velocity * velocity) / (2 * diameterM) * material.lossMultiplier;
    segmentResults.push({
      id: segment.id,
      airflowM3h: segmentAirflowM3h,
      velocityMs: velocity,
      reynolds,
      frictionFactor: factor,
      pressurePaPerM,
      pressurePa: pressurePaPerM * segment.lengthM,
      source: 'engineering-with-estimated-material-data',
    });
  }

  let fittingPressurePa = 0;
  for (const fitting of fittings) {
    if (fitting.count < 0) return null;
    const segment = segmentResults.find(item => item.id === fitting.segmentId);
    if (!segment) return null;
    if (fitting.verifiedPressurePaEach != null) {
      if (!Number.isFinite(fitting.verifiedPressurePaEach) || fitting.verifiedPressurePaEach < 0) return null;
      fittingPressurePa += fitting.verifiedPressurePaEach * fitting.count;
    } else {
      const coefficient = fitting.verifiedCoefficient ?? FITTING_TYPES[fitting.type].coefficient;
      if (!Number.isFinite(coefficient) || coefficient < 0) return null;
      fittingPressurePa += coefficient * 0.5 * density * segment.velocityMs * segment.velocityMs * fitting.count;
    }
  }

  let terminalPressurePa = 0;
  for (const terminal of terminals) {
    if (terminal.count < 0 || terminal.lossPaEach < 0) return null;
    terminalPressurePa += terminal.count * terminal.lossPaEach;
  }

  const straightPressurePa = segmentResults.reduce((sum, item) => sum + item.pressurePa, 0);
  const generalDataItems = segmentResults.filter(item => item.source === 'engineering-with-estimated-material-data').length
    + fittings.reduce((sum, item) => sum + (item.count > 0 && !item.verifiedProductData && item.verifiedCoefficient == null && item.verifiedPressurePaEach == null ? 1 : 0), 0)
    + terminals.reduce((sum, item) => sum + (item.count > 0 && !item.verifiedProductData ? 1 : 0), 0);
  return {
    airDensityKgM3: density,
    segments: segmentResults,
    straightPressurePa,
    fittingPressurePa,
    terminalPressurePa,
    totalPressurePa: straightPressurePa + fittingPressurePa + terminalPressurePa,
    usesEstimate: generalDataItems > 0,
    method: 'Darcy–Weisbach + Reynolds-szám + Swamee–Jain',
    dataQuality: generalDataItems > 0 ? 'mixed-or-general' : 'user-product-data',
    generalDataItems,
  };
}
