export interface ManufacturerSource {
  manufacturer: string;
  productFamily: string;
  productCode: string;
  documentTitle: string;
  documentEdition: string;
  documentPage: number;
  sourceUrl: string;
  checkedAt: string;
  installationVariant: string;
  dataExtraction?: 'official-table' | 'official-vector-chart';
}

export interface PressurePoint {
  flowM3h: number;
  pressurePa: number;
}

export interface ManufacturerPressureCurve {
  id: string;
  label: string;
  source: ManufacturerSource;
  curve: PressurePoint[];
  minFlowM3h: number;
  maxFlowM3h: number;
  componentKind: 'terminal' | 'fitting' | 'duct' | 'equipment';
  genericType: string;
  nominalSizeMm?: number;
  /** Downstream nominal size for components whose geometry needs two sizes. */
  secondaryNominalSizeMm?: number;
  flowDirection?: 'large-to-small' | 'small-to-large';
  interpolation?: 'linear' | 'log-log';
}

type ChartCurveDefinition = {
  angle: 15 | 30 | 45 | 60 | 90;
  genericType: string;
  documentPage: number;
  sizes: { nominalSizeMm: number; low: [flowLs: number, pressurePa: number]; high: [flowLs: number, pressurePa: number] }[];
};

/**
 * Lindab Safe BU curves transcribed from the vector geometry of the official
 * manufacturer chart. Each published line is represented by its two visible
 * endpoints and evaluated with log-log interpolation. The chart is not
 * extrapolated beyond those endpoints.
 */
const LINDAB_BU_CHARTS: ChartCurveDefinition[] = [
  {
    angle: 90, genericType: 'elbow90Pressed', documentPage: 1,
    sizes: [
      { nominalSizeMm: 250, low: [98.66168, 1.06065], high: [1409.85803, 100] },
      { nominalSizeMm: 200, low: [62.53863, 1.06065], high: [872.69874, 100] },
      { nominalSizeMm: 160, low: [37.44481, 1.06065], high: [530.02556, 100] },
      { nominalSizeMm: 125, low: [22.10339, 1.06065], high: [314.35356, 100] },
      { nominalSizeMm: 100, low: [13.68154, 1.06065], high: [201.15924, 100] },
      { nominalSizeMm: 80, low: [10, 1.44916], high: [122.17222, 100] },
      { nominalSizeMm: 63, low: [10, 3.54709], high: [73.49709, 100] },
    ],
  },
  {
    angle: 60, genericType: 'bend60', documentPage: 2,
    sizes: [
      { nominalSizeMm: 250, low: [98.94311, 0.74204], high: [1458.41684, 70] },
      { nominalSizeMm: 200, low: [62.44270, 0.74204], high: [898.83835, 70] },
      { nominalSizeMm: 160, low: [37.58135, 0.74204], high: [546.11037, 70] },
      { nominalSizeMm: 125, low: [22.19326, 0.74204], high: [325.57432, 70] },
      { nominalSizeMm: 100, low: [13.74279, 0.74204], high: [207.42795, 70] },
      { nominalSizeMm: 80, low: [10, 1.01067], high: [126.03150, 70] },
      { nominalSizeMm: 63, low: [10, 2.45136], high: [75.85477, 70] },
    ],
  },
  {
    angle: 45, genericType: 'bend45', documentPage: 3,
    sizes: [
      { nominalSizeMm: 250, low: [98.94383, 0.53037], high: [1410.75145, 50] },
      { nominalSizeMm: 200, low: [62.44280, 0.53037], high: [873.56971, 50] },
      { nominalSizeMm: 160, low: [37.58192, 0.53037], high: [530.79151, 50] },
      { nominalSizeMm: 125, low: [22.19366, 0.53037], high: [314.93856, 50] },
      { nominalSizeMm: 100, low: [13.74282, 0.53037], high: [201.60498, 50] },
      { nominalSizeMm: 80, low: [10, 0.72064], high: [122.49396, 50] },
      { nominalSizeMm: 63, low: [10, 1.76600], high: [73.72440, 50] },
    ],
  },
  {
    angle: 30, genericType: 'bend30', documentPage: 4,
    sizes: [
      { nominalSizeMm: 250, low: [93.02362, 0.3], high: [1332.69577, 30] },
      { nominalSizeMm: 200, low: [58.98613, 0.3], high: [821.34668, 30] },
      { nominalSizeMm: 160, low: [35.33330, 0.3], high: [499.03951, 30] },
      { nominalSizeMm: 125, low: [20.86501, 0.3], high: [296.10419, 30] },
      { nominalSizeMm: 100, low: [12.92041, 0.3], high: [189.54526, 30] },
      { nominalSizeMm: 80, low: [10, 0.45548], high: [115.16866, 30] },
      { nominalSizeMm: 63, low: [10, 1.12787], high: [68.98722, 30] },
    ],
  },
  {
    angle: 15, genericType: 'bend15', documentPage: 5,
    sizes: [
      { nominalSizeMm: 200, low: [69.31283, 0.21461], high: [969.72062, 20] },
      { nominalSizeMm: 160, low: [41.51922, 0.21461], high: [589.19111, 20] },
      { nominalSizeMm: 125, low: [24.51871, 0.21461], high: [351.26052, 20] },
      { nominalSizeMm: 100, low: [15.18296, 0.21461], high: [223.79448, 20] },
      { nominalSizeMm: 80, low: [10, 0.24421], high: [135.97495, 20] },
      { nominalSizeMm: 63, low: [10, 0.59637], high: [81.83833, 20] },
    ],
  },
];

const LINDAB_BU_CURVES: ManufacturerPressureCurve[] = LINDAB_BU_CHARTS.flatMap(chart => chart.sizes.map(size => {
  const curve = [
    { flowM3h: size.low[0] * 3.6, pressurePa: size.low[1] },
    { flowM3h: size.high[0] * 3.6, pressurePa: size.high[1] },
  ];
  return {
    id: `lindab-bu-${size.nominalSizeMm}-${chart.angle}`,
    label: `Lindab BU ${size.nominalSizeMm} ${chart.angle}° kör könyök`,
    source: {
      manufacturer: 'Lindab',
      productFamily: 'Safe BU',
      productCode: `BU ${size.nominalSizeMm} ${chart.angle}`,
      documentTitle: 'Lindab Safe – Bend BU',
      documentEdition: '2021-09-08; hivatalos fájlfrissítés: 2025-06-23',
      documentPage: chart.documentPage,
      sourceUrl: 'https://itsolution.lindab.com/lindabwebproductsdoc/pdf/documentation/ads/lindab/technical/bu.pdf',
      checkedAt: '2026-10-29',
      installationVariant: `Préselt és hegesztett kör könyök; rₘ ≈ 1·d₁; α = ${chart.angle}°`,
      dataExtraction: 'official-vector-chart' as const,
    },
    curve,
    minFlowM3h: curve[0].flowM3h,
    maxFlowM3h: curve[1].flowM3h,
    componentKind: 'fitting' as const,
    genericType: chart.genericType,
    nominalSizeMm: size.nominalSizeMm,
    interpolation: 'log-log' as const,
  };
}));

type RcuChartDefinition = {
  dimensionStep: 1 | 2 | 3;
  direction: 'reducer' | 'expander';
  d1: number;
  d2: number;
  points: [flowM3h: number, pressurePa: number][];
};

/**
 * Official Lindab RCU chart geometry. d1 is the larger and d2 the smaller
 * product connection. Left-hand charts are d1 -> d2 (reducer), right-hand
 * charts are d2 -> d1 (expander). Points are transcribed from the PDF vector
 * paths and are never extrapolated.
 */
const LINDAB_RCU_CHARTS: RcuChartDefinition[] = ([
  [1, 'reducer', 80, 63, [[36.21821, 2.39605], [162.75030, 34.04015]]],
  [1, 'reducer', 100, 80, [[56.66920, 2.39605], [254.78418, 31.95697]]],
  [1, 'reducer', 125, 100, [[88.20946, 2.10199], [398.79729, 32.98087]]],
  [1, 'reducer', 160, 125, [[144.50554, 2.49876], [652.99329, 36.99887]]],
  [1, 'reducer', 200, 160, [[226.07442, 2.49876], [1016.46998, 30.01597]]],
  [1, 'reducer', 250, 200, [[353.91755, 1.69650], [1591.01507, 23.96592]]],
  [1, 'reducer', 315, 250, [[560.28823, 1.69650], [2533.18119, 21.02389]]],
  [1, 'reducer', 400, 315, [[907.47238, 1.49600], [4078.32171, 16.96881]]],
  [1, 'reducer', 500, 400, [[1411.96585, 1.29887], [6348.44438, 15.04078]]],
  [1, 'reducer', 630, 500, [[2247.73560, 1.29887], [10106.62339, 13.98161]]],
  [1, 'expander', 80, 63, [[36.00147, 3.38560], [168.42912, 55.08386]]],
  [1, 'expander', 100, 80, [[54.15595, 2.49858], [271.16423, 48.07122]]],
  [1, 'expander', 125, 100, [[84.77720, 1.79677], [424.47059, 41.09555]]],
  [1, 'expander', 160, 125, [[132.70714, 1.09886], [664.45076, 22.97991]]],
  [1, 'expander', 200, 160, [[217.40204, 1.25197], [1087.97602, 21.02310]]],
  [1, 'expander', 250, 200, [[340.13262, 1.15185], [1693.57783, 19.03394]]],
  [1, 'expander', 315, 250, [[529.43956, 1.00008], [2650.84844, 19.03394]]],
  [1, 'expander', 400, 315, [[842.92827, 1.00008], [4220.62590, 15.04022]]],
  [1, 'expander', 500, 400, [[1357.69089, 1.20119], [6795.04107, 16.96753]]],
  [1, 'expander', 630, 500, [[2124.23870, 1.39790], [10636.70926, 19.03394]]],
  [2, 'reducer', 100, 63, [[56.68156, 2.70270], [84.78676, 5.65151], [113.23782, 9.54241], [141.25053, 14.34814], [169.39299, 20.05627]]],
  [2, 'reducer', 125, 80, [[88.23000, 3.79733], [265.15459, 27.03616]]],
  [2, 'reducer', 160, 100, [[144.52317, 5.50687], [434.13547, 37.00005]]],
  [2, 'reducer', 200, 125, [[226.12372, 5.80235], [679.53408, 43.98313]]],
  [2, 'reducer', 250, 160, [[353.97089, 5.09019], [1063.77653, 41.09875]]],
  [2, 'reducer', 315, 200, [[560.33458, 5.50687], [1684.02297, 48.07739]]],
  [2, 'reducer', 400, 250, [[907.59570, 4.39682], [2711.13419, 36.05449]]],
  [2, 'reducer', 500, 315, [[1412.06318, 3.49193], [4243.62484, 30.01640]]],
  [2, 'reducer', 630, 400, [[2247.92055, 3.09677], [6717.64203, 26.06087]]],
  [2, 'expander', 100, 63, [[56.03416, 8.50231], [168.40849, 73.06973]]],
  [2, 'expander', 125, 80, [[90.76700, 7.98560], [271.13102, 67.19358]]],
  [2, 'expander', 160, 100, [[141.21580, 7.00556], [424.43592, 60.20875]]],
  [2, 'expander', 200, 125, [[221.05406, 4.90686], [664.39650, 41.95292]]],
  [2, 'expander', 250, 160, [[362.11798, 4.49105], [1087.79834, 38.98096]]],
  [2, 'expander', 315, 200, [[566.56859, 5.50673], [1693.23212, 48.06941]]],
  [2, 'expander', 400, 250, [[882.01059, 5.80260], [2650.63198, 50.91434]]],
  [2, 'expander', 500, 315, [[1404.03229, 5.59330], [4219.93663, 47.06397]]],
  [2, 'expander', 630, 400, [[2261.63672, 5.30849], [6794.20878, 43.07580]]],
  [3, 'reducer', 160, 80, [[144.49374, 10.99109], [217.35766, 25.38241], [290.16884, 46.10041]]],
  [3, 'reducer', 200, 100, [[226.08365, 10.99109], [451.68598, 48.07303]]],
  [3, 'reducer', 250, 125, [[353.91755, 12.99115], [707.11048, 63.11476]]],
  [3, 'reducer', 315, 160, [[560.26535, 16.02065], [1125.66278, 67.19611]]],
  [3, 'reducer', 400, 200, [[907.47238, 20.05589], [1812.34663, 74.99154]]],
  [3, 'reducer', 500, 250, [[1411.96585, 19.03394], [2821.04081, 65.10752]]],
  [3, 'reducer', 630, 315, [[2247.82738, 17.97174], [4490.86914, 60.21102]]],
  [3, 'expander', 160, 80, [[144.51734, 28.03713], [162.77024, 35.68312], [181.28154, 44.43921], [268.14745, 100.00754]]],
  [3, 'expander', 200, 100, [[226.11135, 23.96592], [424.48792, 85.04552]]],
  [3, 'expander', 250, 125, [[353.96090, 21.02469], [664.47789, 76.99870]]],
  [3, 'expander', 315, 160, [[579.83827, 22.03862], [1087.97602, 81.97478]]],
  [3, 'expander', 400, 200, [[907.62060, 21.02469], [1693.64698, 74.99437]]],
  [3, 'expander', 500, 250, [[1412.08116, 19.03538], [2650.95668, 70.07669]]],
  [3, 'expander', 630, 315, [[2248.10274, 16.96945], [4220.62590, 67.20117]]],
] as [RcuChartDefinition['dimensionStep'], RcuChartDefinition['direction'], number, number, RcuChartDefinition['points']][])
  .map(([dimensionStep, direction, d1, d2, points]) => ({ dimensionStep, direction, d1, d2, points }));

const LINDAB_RCU_CURVES: ManufacturerPressureCurve[] = LINDAB_RCU_CHARTS.map(item => {
  const upstream = item.direction === 'reducer' ? item.d1 : item.d2;
  const downstream = item.direction === 'reducer' ? item.d2 : item.d1;
  const genericType = item.direction === 'reducer' ? 'reducer' : 'expander';
  return {
    id: `lindab-rcu-${item.d1}-${item.d2}-${item.direction}`,
    label: `Lindab RCU ${item.d1}/${item.d2} ${item.direction === 'reducer' ? 'szűkítő' : 'bővítő irány'}`,
    source: {
      manufacturer: 'Lindab',
      productFamily: 'Safe RCU',
      productCode: `RCU ${item.d1} ${item.d2}`,
      documentTitle: 'Lindab Safe – Reducer RCU',
      documentEdition: '2019-03-28; aktuális termékadatlap ellenőrizve: 2025-08-25',
      documentPage: 3,
      sourceUrl: 'https://itsolution.lindab.com/lindabwebproductsdoc/pdf/documentation/ads/lindab/technical/rcu.pdf',
      checkedAt: '2026-10-30',
      installationVariant: `${item.d1} → ${item.d2} mm gyártói méret; számítási irány: Ø${upstream} → Ø${downstream} mm; ${item.dimensionStep} méretlépcső`,
      dataExtraction: 'official-vector-chart',
    },
    curve: item.points.map(([flowM3h, pressurePa]) => ({ flowM3h, pressurePa })),
    minFlowM3h: item.points[0][0],
    maxFlowM3h: item.points[item.points.length - 1][0],
    componentKind: 'fitting',
    genericType,
    nominalSizeMm: upstream,
    secondaryNominalSizeMm: downstream,
    flowDirection: item.direction === 'reducer' ? 'large-to-small' : 'small-to-large',
    interpolation: 'log-log',
  };
});

/**
 * Only records transcribed from an identifiable official manufacturer document
 * may be added here. A brand name or a similar-looking product is not enough.
 */
export const VERIFIED_MANUFACTURER_CURVES: ManufacturerPressureCurve[] = [
  {
    id: 'trox-fba-250-dirt-tray',
    label: 'TROX FBA-250 padlóbefúvó – szennytálcával',
    source: {
      manufacturer: 'TROX',
      productFamily: 'FBA',
      productCode: 'FBA-250',
      documentTitle: 'Quick Selection Guide 2023',
      documentEdition: '2023',
      documentPage: 19,
      sourceUrl: 'https://cdn.trox.de/a6b1c0651411ff71/ecded6ffbff4/QSG-2023.pdf',
      checkedAt: '2026-10-22',
      installationVariant: 'szennytálcával; a gyártói táblázat szerinti kivitel',
      dataExtraction: 'official-table',
    },
    curve: [
      { flowM3h: 29 * 3.6, pressurePa: 10 },
      { flowM3h: 43 * 3.6, pressurePa: 20 },
      { flowM3h: 52 * 3.6, pressurePa: 30 },
      { flowM3h: 55 * 3.6, pressurePa: 35 },
      { flowM3h: 58 * 3.6, pressurePa: 40 },
      { flowM3h: 60 * 3.6, pressurePa: 45 },
    ],
    minFlowM3h: 29 * 3.6,
    maxFlowM3h: 60 * 3.6,
    componentKind: 'terminal',
    genericType: 'diffuser',
    nominalSizeMm: 250,
  },
  ...LINDAB_BU_CURVES,
  ...LINDAB_RCU_CURVES,
];

export const SUPPORTED_MANUFACTURERS = ['Általános', 'Lindab', 'TROX', 'Systemair', 'Airvent'] as const;
export type SupportedManufacturer = typeof SUPPORTED_MANUFACTURERS[number];

export type CurveResult =
  | { status: 'ok'; pressurePa: number; method: 'manufacturer-interpolation' }
  | { status: 'outside-range'; minFlowM3h: number; maxFlowM3h: number };

/** Linear interpolation between official table points. Never extrapolates. */
export function pressureFromManufacturerCurve(curve: ManufacturerPressureCurve, flowM3h: number): CurveResult {
  if (flowM3h < curve.minFlowM3h || flowM3h > curve.maxFlowM3h) {
    return { status: 'outside-range', minFlowM3h: curve.minFlowM3h, maxFlowM3h: curve.maxFlowM3h };
  }

  const exact = curve.curve.find((point) => Math.abs(point.flowM3h - flowM3h) < 1e-9);
  if (exact) return { status: 'ok', pressurePa: exact.pressurePa, method: 'manufacturer-interpolation' };

  for (let index = 0; index < curve.curve.length - 1; index += 1) {
    const low = curve.curve[index];
    const high = curve.curve[index + 1];
    if (flowM3h > low.flowM3h && flowM3h < high.flowM3h) {
      const logLog = curve.interpolation === 'log-log'
        && low.flowM3h > 0 && high.flowM3h > 0
        && low.pressurePa > 0 && high.pressurePa > 0;
      const ratio = logLog
        ? (Math.log(flowM3h) - Math.log(low.flowM3h)) / (Math.log(high.flowM3h) - Math.log(low.flowM3h))
        : (flowM3h - low.flowM3h) / (high.flowM3h - low.flowM3h);
      return {
        status: 'ok',
        pressurePa: logLog
          ? Math.exp(Math.log(low.pressurePa) + ratio * (Math.log(high.pressurePa) - Math.log(low.pressurePa)))
          : low.pressurePa + ratio * (high.pressurePa - low.pressurePa),
        method: 'manufacturer-interpolation',
      };
    }
  }

  return { status: 'outside-range', minFlowM3h: curve.minFlowM3h, maxFlowM3h: curve.maxFlowM3h };
}

export function manufacturersWithVerifiedData(componentKind: ManufacturerPressureCurve['componentKind'], genericType: string, nominalSizeMm?: number, secondaryNominalSizeMm?: number): SupportedManufacturer[] {
  const found = VERIFIED_MANUFACTURER_CURVES
    .filter(item => item.componentKind === componentKind
      && item.genericType === genericType
      && (nominalSizeMm == null || item.nominalSizeMm === nominalSizeMm)
      && (secondaryNominalSizeMm == null || item.secondaryNominalSizeMm === secondaryNominalSizeMm))
    .map(item => item.source.manufacturer)
    .filter((manufacturer): manufacturer is SupportedManufacturer => SUPPORTED_MANUFACTURERS.includes(manufacturer as SupportedManufacturer));
  return ['Általános', ...Array.from(new Set(found)).filter(item => item !== 'Általános')];
}

export const MANUFACTURER_DATA_QUEUE = [
  { manufacturer: 'Lindab', scope: 'Safe BU kör könyökök és RCU koncentrikus szűkítők/bővítők', status: 'verified-two-families' },
  { manufacturer: 'TROX', scope: 'légszelepek, rácsok és diffúzorok', status: 'first-product-verified' },
  { manufacturer: 'Systemair', scope: 'BALANCE légszelepek és légelosztók', status: 'official-source-review' },
  { manufacturer: 'Airvent', scope: 'rácsok, csappantyúk és légelosztók', status: 'official-source-review' },
] as const;
