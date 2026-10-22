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
}

export interface PressurePoint { flowM3h: number; pressurePa: number; }

export interface ManufacturerPressureCurve {
  id: string;
  label: string;
  source: ManufacturerSource;
  curve: PressurePoint[];
  minFlowM3h: number;
  maxFlowM3h: number;
}

/** Only identifiable official manufacturer documents may supply records here. */
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
  },
];

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
      const ratio = (flowM3h - low.flowM3h) / (high.flowM3h - low.flowM3h);
      return { status: 'ok', pressurePa: low.pressurePa + ratio * (high.pressurePa - low.pressurePa), method: 'manufacturer-interpolation' };
    }
  }
  return { status: 'outside-range', minFlowM3h: curve.minFlowM3h, maxFlowM3h: curve.maxFlowM3h };
}

export const MANUFACTURER_DATA_QUEUE = [
  {
    manufacturer: 'Lindab',
    scope: 'Safe BU kör könyökök',
    status: 'official-curve-ready',
    sourceUrl: 'https://itsolution.lindab.com/lindabwebproductsdoc/pdf/documentation/ads/lindab/technical/bu.pdf',
    fallbackAllowed: true,
  },
  {
    manufacturer: 'TROX',
    scope: 'légszelepek, rácsok és diffúzorok',
    status: 'first-product-verified',
    sourceUrl: 'https://cdn.trox.de/a6b1c0651411ff71/ecded6ffbff4/QSG-2023.pdf',
    fallbackAllowed: true,
  },
  {
    manufacturer: 'Airvent',
    scope: 'SEDM-L csappantyúk; további rácsok és légelosztók',
    status: 'official-table-ready',
    sourceUrl: 'https://airvent.hu/uploads/files/doc/utmutatok/SEDM-L_beuzemelesi_es_haszn_utmutato_rev5.pdf',
    fallbackAllowed: true,
  },
  {
    manufacturer: 'Systemair',
    scope: 'BALANCE légszelepek és légelosztók',
    status: 'numeric-data-pending',
    sourceUrl: 'https://www.systemair.com/en/products/air-distribution-products/diffusers/air-valves/balance/balance-e',
    fallbackAllowed: true,
  },
] as const;
