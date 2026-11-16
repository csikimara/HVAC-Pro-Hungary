import type { SavedRoomLoad } from '@/contexts/SavedRoomsContext';
import type { CalculationQuality } from '@/domain/calculationQuality';

export const HVAC_FLOW_SCHEMA_VERSION = 2 as const;
export type FlowLink = { tenantId?: string; customerId?: string; customerSiteId?: string; surveyId?: string; worksheetId?: string };
export type HvacCalculationDraft = {
  schemaVersion: typeof HVAC_FLOW_SCHEMA_VERSION;
  sourceApp: 'hvac-pro-hungary';
  localProjectId: string;
  flowLink: FlowLink | null;
  title: string;
  calculationType: 'room-cooling-load-and-airside';
  rooms: { localRoomId: string; name: string; areaM2: number; heightM: number; coolingLoadKw: number; quality?: CalculationQuality; updatedAt: string }[];
  totalCoolingLoadKw: number;
  accuracy: CalculationQuality;
  updatedAt: string;
};

export function createFlowCalculationDraft(localProjectId: string, title: string, rooms: SavedRoomLoad[], flowLink: FlowLink | null = null): HvacCalculationDraft {
  return {
    schemaVersion: HVAC_FLOW_SCHEMA_VERSION,
    sourceApp: 'hvac-pro-hungary',
    localProjectId,
    flowLink,
    title,
    calculationType: 'room-cooling-load-and-airside',
    rooms: rooms.map(room => ({ localRoomId: room.id, name: room.name, areaM2: room.areaM2, heightM: room.heightM, coolingLoadKw: room.coolingLoadKw, quality: room.quality, updatedAt: room.updatedAt })),
    totalCoolingLoadKw: rooms.reduce((sum, room) => sum + room.coolingLoadKw, 0),
    accuracy: {
      level: 'engineering-estimate',
      mode: 'guided-estimate',
      methodId: 'room-cooling-load-v1',
      methodVersion: '1.0.0',
      dataCompletenessPercent: 0,
      assumedInputKeys: ['construction.uValues', 'airLeakage', 'solarGainProfile'],
      missingRequiredInputKeys: [],
      sources: [],
      verificationRequired: 'designer-review',
    },
    updatedAt: new Date().toISOString(),
  };
}

/** The real adapter will use the signed-in Northwind Flow API; no API secret is stored in HVAC Pro. */
export interface NorthwindFlowCalculationAdapter {
  saveCalculation(draft: HvacCalculationDraft): Promise<{ calculationId: string; version: number }>;
  loadCalculation(calculationId: string): Promise<HvacCalculationDraft>;
}
