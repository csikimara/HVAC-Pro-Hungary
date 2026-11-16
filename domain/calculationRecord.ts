import type { CalculationQuality, SourceReference } from '@/domain/calculationQuality';
import type { AppLanguage, JurisdictionCode } from '@/domain/engineeringStandards';

export type RecordedValue = {
  key: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  origin: 'measured' | 'manufacturer' | 'selected-typical' | 'calculated' | 'missing';
};

export type CalculationRecord = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  toolId: string;
  toolTitle: string;
  language: AppLanguage;
  jurisdiction: JurisdictionCode;
  method: { id: string; version: string; name: string; formulaSummary: string };
  inputs: RecordedValue[];
  outputs: RecordedValue[];
  assumptions: string[];
  sources: SourceReference[];
  quality: CalculationQuality;
  complianceState: string;
  requiredVerification: string[];
  contentFingerprint: string;
};

export type NewCalculationRecord = Omit<CalculationRecord, 'schemaVersion' | 'id' | 'createdAt' | 'contentFingerprint'>;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createCalculationRecord(draft: NewCalculationRecord): CalculationRecord {
  const createdAt = new Date().toISOString();
  const id = `calc-${createdAt.replace(/[^0-9]/g, '').slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;
  const base = { schemaVersion: 1 as const, id, createdAt, ...draft };
  return { ...base, contentFingerprint: fingerprint(base) };
}

export function recordMissingInputs(record: CalculationRecord) {
  return record.inputs.filter(input => input.origin === 'missing' || input.value === null || input.value === '');
}
