export const SUPPORTED_LOCALES = ['hu', 'ro', 'de', 'en', 'sk', 'fr', 'it', 'hr'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export type CalculationMode = 'complete-inputs' | 'guided-estimate';
export type AccuracyLevel = 'manufacturer' | 'engineering' | 'engineering-estimate' | 'estimate';
export type VerificationRequirement = 'none' | 'commissioning' | 'designer-review' | 'manufacturer-document';

export type SourceReference = {
  kind: 'standard' | 'manufacturer' | 'engineering-reference';
  title: string;
  edition?: string;
  pageOrSection?: string;
  url?: string;
};

/**
 * Language-neutral evidence stored with every calculation. User-facing labels are
 * translated at render time, so a saved project cannot lose its quality warning
 * when the UI language changes.
 */
export type CalculationQuality = {
  level: AccuracyLevel;
  mode: CalculationMode;
  methodId: string;
  methodVersion: string;
  dataCompletenessPercent: number;
  assumedInputKeys: string[];
  missingRequiredInputKeys: string[];
  sources: SourceReference[];
  verificationRequired: VerificationRequirement;
};

export type QualityEvidence = Omit<CalculationQuality, 'level' | 'dataCompletenessPercent'> & {
  requiredInputCount: number;
  suppliedRequiredInputCount: number;
  manufacturerProductConfirmed?: boolean;
  manufacturerRangeConfirmed?: boolean;
};

export function classifyCalculationQuality(evidence: QualityEvidence): CalculationQuality {
  const total = Math.max(0, evidence.requiredInputCount);
  const supplied = Math.min(total, Math.max(0, evidence.suppliedRequiredInputCount));
  const dataCompletenessPercent = total === 0 ? 100 : Math.round((supplied / total) * 100);
  const hasManufacturerSource = evidence.sources.some(source => source.kind === 'manufacturer');
  const complete = supplied === total && evidence.missingRequiredInputKeys.length === 0;
  const noAssumptions = evidence.assumedInputKeys.length === 0;

  let level: AccuracyLevel;
  if (evidence.manufacturerProductConfirmed && evidence.manufacturerRangeConfirmed && hasManufacturerSource && complete) {
    level = 'manufacturer';
  } else if (evidence.mode === 'complete-inputs' && complete && noAssumptions && evidence.sources.length > 0) {
    level = 'engineering';
  } else if (evidence.sources.length > 0 && supplied > 0) {
    level = 'engineering-estimate';
  } else {
    level = 'estimate';
  }

  return {
    level,
    mode: evidence.mode,
    methodId: evidence.methodId,
    methodVersion: evidence.methodVersion,
    dataCompletenessPercent,
    assumedInputKeys: [...evidence.assumedInputKeys],
    missingRequiredInputKeys: [...evidence.missingRequiredInputKeys],
    sources: evidence.sources.map(source => ({ ...source })),
    verificationRequired: evidence.verificationRequired,
  };
}

export const ACCURACY_TRANSLATION_KEYS: Record<AccuracyLevel, string> = {
  manufacturer: 'accuracy.manufacturer',
  engineering: 'accuracy.engineering',
  'engineering-estimate': 'accuracy.engineeringEstimate',
  estimate: 'accuracy.quickEstimate',
};
