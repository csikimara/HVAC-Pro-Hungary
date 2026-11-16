import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Plus, Trash2, ChevronRight } from 'lucide-react-native';
import { AccuracyNotice } from '@/components/AccuracyNotice';
import { HelpText } from '@/contexts/HelpContext';
import {
  calculateDuctPathPressure,
  DUCT_MATERIALS,
  FITTING_TYPES,
  TERMINAL_TYPES,
  type DuctMaterialId,
  type FittingTypeId,
  type TerminalTypeId,
} from '@/domain/ductPressure';
import { VERIFIED_MANUFACTURER_CURVES, manufacturersWithVerifiedData, pressureFromManufacturerCurve, type SupportedManufacturer } from '@/domain/manufacturerPressureData';
import { classifyVelocity, recommendedDiameter, STANDARD_ROUND_DIAMETERS_MM } from '@/domain/airsideWorkflows';
import { CalculationReportButton } from '@/components/CalculationReportButton';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { classifyCalculationQuality } from '@/domain/calculationQuality';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';

const CARD = '#161A1F';
const SURFACE = '#1C2128';
const BORDER = '#2A2F38';
const TEXT = '#E8ECF0';
const MUTED = '#98A3AF';
const BLUE = '#1E90FF';
const YELLOW = '#F59E0B';
const GREEN = '#22C55E';
const RED = '#EF4444';

type SegmentRow = { id: number; name: string; material: DuctMaterialId; length: string; diameter: string; airflow: string; followFlow: 'pathStart' | 'endpoint' | null; manufacturerLoss: string };
type FittingRow = { id: number; type: FittingTypeId; count: string; segmentId: number; secondaryDiameter: string; manufacturer: SupportedManufacturer; manufacturerConfirmed: boolean; verifiedK: string; sourceReference: string };
type TerminalRow = { id: number; type: TerminalTypeId; nominalSize: string; count: string; lossPa: string; manufacturer: SupportedManufacturer; manufacturerCurveId: string | null; manufacturerConfirmed: boolean };

const materialIds = Object.keys(DUCT_MATERIALS) as DuctMaterialId[];
const fittingIds = Object.keys(FITTING_TYPES) as FittingTypeId[];
const terminalIds = Object.keys(TERMINAL_TYPES) as TerminalTypeId[];

function numberOf(value: string, fallback = 0): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function flowLabel(value: string): string {
  return Math.round(numberOf(value)).toLocaleString('hu-HU');
}

function nextOf<T extends string>(items: T[], current: T): T {
  return items[(items.indexOf(current) + 1) % items.length];
}

function Field({ label, value, onChangeText, suffix, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; suffix?: string; placeholder?: string }) {
  return <View style={{ flex: 1, minWidth: 120 }}>
    <Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11 }}>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder={placeholder} placeholderTextColor="#66717E" style={{ color: TEXT, fontSize: 16, padding: 12, flex: 1 }} />
      {suffix && <Text style={{ color: MUTED, fontSize: 13, marginRight: 10 }}>{suffix}</Text>}
    </View>
  </View>;
}

function ChoiceButton({ label, onPress, color = BLUE }: { label: string; onPress: () => void; color?: string }) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${color}14`, borderColor: `${color}66`, borderWidth: 1, borderRadius: 11, padding: 12 }}>
    <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', flex: 1 }}>{label}</Text>
    <ChevronRight size={18} color={color} />
  </TouchableOpacity>;
}

function exactTerminalProduct(manufacturer: SupportedManufacturer, type: TerminalTypeId, nominalSize: string) {
  return VERIFIED_MANUFACTURER_CURVES.find(item => item.componentKind === 'terminal'
    && item.genericType === type
    && item.source.manufacturer === manufacturer
    && item.nominalSizeMm === numberOf(nominalSize, -1));
}

function needsSecondDiameter(type: FittingTypeId): boolean {
  return type === 'reducer' || type === 'expander';
}

function exactFittingProduct(manufacturer: SupportedManufacturer, type: FittingTypeId, nominalSizeMm: number, secondaryNominalSizeMm?: number) {
  return VERIFIED_MANUFACTURER_CURVES.find(item => item.componentKind === 'fitting'
    && item.genericType === type
    && item.source.manufacturer === manufacturer
    && item.nominalSizeMm === nominalSizeMm
    && (secondaryNominalSizeMm == null || item.secondaryNominalSizeMm === secondaryNominalSizeMm));
}

function availableSecondDiameters(type: FittingTypeId, nominalSizeMm: number): number[] {
  if (!needsSecondDiameter(type)) return [];
  const official = VERIFIED_MANUFACTURER_CURVES
    .filter(item => item.componentKind === 'fitting'
      && item.genericType === type
      && item.nominalSizeMm === nominalSizeMm
      && item.secondaryNominalSizeMm != null)
    .map(item => item.secondaryNominalSizeMm!)
    .filter((value, index, values) => values.indexOf(value) === index);
  if (official.length > 0) return official;
  return STANDARD_ROUND_DIAMETERS_MM.filter(value => type === 'reducer' ? value < nominalSizeMm : value > nominalSizeMm);
}

export function PressurePathBuilder({ externalAirflow, downstreamAirflow }: { externalAirflow?: string; downstreamAirflow?: string } = {}) {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [airflow, setAirflow] = useState('500');
  const activeAirflow = externalAirflow ?? airflow;
  const terminalAirflow = downstreamAirflow ?? activeAirflow;
  const [availableEsp, setAvailableEsp] = useState('');
  const [temperature, setTemperature] = useState('20');
  const [atmosphericPressure, setAtmosphericPressure] = useState('101325');
  const [segments, setSegments] = useState<SegmentRow[]>([
    { id: 1, name: 'Géptől induló szakasz', material: 'sonodecTight', length: '5', diameter: '200', airflow: externalAirflow ?? '500', followFlow: externalAirflow ? 'pathStart' : null, manufacturerLoss: '' },
    { id: 2, name: 'Y utáni / végponti szakasz', material: 'spiral', length: '10', diameter: '200', airflow: downstreamAirflow ?? externalAirflow ?? '500', followFlow: downstreamAirflow ? 'endpoint' : externalAirflow ? 'pathStart' : null, manufacturerLoss: '' },
    { id: 3, name: 'Utolsó csőszakasz', material: 'plastic', length: '3', diameter: '200', airflow: downstreamAirflow ?? externalAirflow ?? '500', followFlow: downstreamAirflow ? 'endpoint' : externalAirflow ? 'pathStart' : null, manufacturerLoss: '' },
  ]);
  const [fittings, setFittings] = useState<FittingRow[]>([
    { id: 1, type: 'elbow90Sharp', count: '3', segmentId: 2, secondaryDiameter: '', manufacturer: 'Általános', manufacturerConfirmed: false, verifiedK: '', sourceReference: '' },
    { id: 2, type: 'bend90Long', count: '2', segmentId: 1, secondaryDiameter: '', manufacturer: 'Általános', manufacturerConfirmed: false, verifiedK: '', sourceReference: '' },
  ]);
  const [terminals, setTerminals] = useState<TerminalRow[]>([
    { id: 1, type: 'supplyValve', nominalSize: '125', count: '1', lossPa: '30', manufacturer: 'Általános', manufacturerCurveId: null, manufacturerConfirmed: false },
  ]);

  useEffect(() => {
    setSegments(rows => rows.map(row => row.followFlow === 'pathStart' && externalAirflow != null
      ? { ...row, airflow: externalAirflow }
      : row.followFlow === 'endpoint' && downstreamAirflow != null
        ? { ...row, airflow: downstreamAirflow }
        : row));
  }, [externalAirflow, downstreamAirflow]);

  const calculationInput = useMemo(() => ({
    airflowM3h: numberOf(activeAirflow, -1), airTemperatureC: numberOf(temperature, 20), atmosphericPressurePa: numberOf(atmosphericPressure, 101325),
    segments: segments.map(item => ({
      id: item.id,
      material: item.material,
      lengthM: numberOf(item.length, -1),
      diameterMm: numberOf(item.diameter, -1),
      airflowM3h: numberOf(item.airflow, -1),
      manufacturerLossPaPerM: item.manufacturerLoss.trim() ? numberOf(item.manufacturerLoss, -1) : null,
    })),
    fittings: fittings.map(item => {
      const segment = segments.find(entry => entry.id === item.segmentId);
      const curve = item.manufacturerConfirmed && segment
        ? exactFittingProduct(item.manufacturer, item.type, numberOf(segment.diameter, -1), needsSecondDiameter(item.type) ? numberOf(item.secondaryDiameter, -1) : undefined)
        : null;
      const curveResult = curve ? pressureFromManufacturerCurve(curve, numberOf(segment?.airflow ?? '', -1)) : null;
      const manufacturerPressure = curveResult?.status === 'ok' ? curveResult.pressurePa : null;
      return {
        type: item.type,
        count: numberOf(item.count, -1),
        segmentId: item.segmentId,
        verifiedPressurePaEach: manufacturerPressure,
        verifiedCoefficient: manufacturerPressure == null && item.verifiedK.trim() && item.sourceReference.trim() ? numberOf(item.verifiedK, -1) : null,
        verifiedProductData: manufacturerPressure != null,
      };
    }),
    terminals: terminals.map(item => {
      const curve = item.manufacturerConfirmed && item.manufacturerCurveId ? VERIFIED_MANUFACTURER_CURVES.find(entry => entry.id === item.manufacturerCurveId) : null;
      const curveResult = curve ? pressureFromManufacturerCurve(curve, numberOf(terminalAirflow, -1)) : null;
      return { type: item.type, count: numberOf(item.count, -1), lossPaEach: curveResult?.status === 'ok' ? curveResult.pressurePa : numberOf(item.lossPa, -1), verifiedProductData: curveResult?.status === 'ok' };
    }),
  }), [activeAirflow, terminalAirflow, temperature, atmosphericPressure, segments, fittings, terminals]);

  const result = useMemo(() => calculateDuctPathPressure(calculationInput), [calculationInput]);

  const requiredEntries = [
    ['airflow', activeAirflow], ['airTemperature', temperature], ['atmosphericPressure', atmosphericPressure],
    ...segments.flatMap((item, index) => [[`segment.${index + 1}.length`, item.length], [`segment.${index + 1}.diameter`, item.diameter], [`segment.${index + 1}.airflow`, item.airflow]] as const),
    ...fittings.flatMap((item, index) => [
      [`fitting.${index + 1}.count`, item.count] as const,
      ...(needsSecondDiameter(item.type) ? [[`fitting.${index + 1}.secondaryDiameter`, item.secondaryDiameter] as const] : []),
    ]),
    ...terminals.flatMap((item, index) => [[`terminal.${index + 1}.count`, item.count], [`terminal.${index + 1}.loss`, item.manufacturerConfirmed ? 'confirmed-manufacturer-curve' : item.lossPa]] as const),
  ];
  const missingRequired = requiredEntries.filter(([, value]) => !String(value).trim() || numberOf(String(value), -1) < 0 && value !== 'confirmed-manufacturer-curve').map(([key]) => key);
  const activeFittingProducts = fittings.map(item => {
    const segment = segments.find(entry => entry.id === item.segmentId);
    const curve = item.manufacturerConfirmed && segment
      ? exactFittingProduct(item.manufacturer, item.type, numberOf(segment.diameter, -1), needsSecondDiameter(item.type) ? numberOf(item.secondaryDiameter, -1) : undefined)
      : null;
    const resultAtFlow = curve && segment ? pressureFromManufacturerCurve(curve, numberOf(segment.airflow, -1)) : null;
    return resultAtFlow?.status === 'ok' ? curve : null;
  });
  const generalDataKeys = [
    ...segments.filter(item => !item.manufacturerLoss.trim()).map((_, index) => `segment.${index + 1}.roughness`),
    ...fittings.filter((item, index) => !activeFittingProducts[index] && (!item.verifiedK.trim() || !item.sourceReference.trim())).map((_, index) => `fitting.${index + 1}.K`),
    ...terminals.filter(item => !item.manufacturerConfirmed).map((_, index) => `terminal.${index + 1}.loss`),
  ];
  const verifiedManufacturerCount = activeFittingProducts.filter(Boolean).length + terminals.filter(item => item.manufacturerConfirmed && item.manufacturerCurveId).length;
  const quality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate',
    methodId: 'duct-path-darcy-weisbach', methodVersion: '2.1.0',
    requiredInputCount: requiredEntries.length, suppliedRequiredInputCount: requiredEntries.length - missingRequired.length,
    assumedInputKeys: generalDataKeys, missingRequiredInputKeys: missingRequired,
    sources: [
      { kind: 'engineering-reference', title: 'Darcy–Weisbach, Swamee–Jain és helyi veszteségtényezők' },
      ...activeFittingProducts.filter(Boolean).map(item => ({ kind: 'manufacturer' as const, title: `${item!.source.documentTitle} · ${item!.source.productCode}` })),
      ...terminals.filter(item => item.manufacturerConfirmed && item.manufacturerCurveId).map(item => ({ kind: 'manufacturer' as const, title: VERIFIED_MANUFACTURER_CURVES.find(curve => curve.id === item.manufacturerCurveId)?.source.documentTitle ?? 'Ellenőrzött gyártói görbe' })),
    ],
    verificationRequired: 'commissioning',
    manufacturerProductConfirmed: verifiedManufacturerCount > 0 && generalDataKeys.length === 0,
    manufacturerRangeConfirmed: verifiedManufacturerCount > 0 && generalDataKeys.length === 0,
  });

  const recommendations = useMemo(() => {
    if (!result) return [] as string[];
    const notes: string[] = [];
    const esp = availableEsp.trim() ? numberOf(availableEsp, -1) : null;
    const deficit = esp != null && esp >= 0 ? result.totalPressurePa - esp : null;
    for (const segment of result.segments) {
      if (classifyVelocity(segment.velocityMs, 'main') !== 'comfort') {
        const row = segments.find(item => item.id === segment.id);
        const target = recommendedDiameter(segment.airflowM3h, row?.followFlow === 'pathStart' && downstreamAirflow == null ? 'main' : 'branch', 'comfort');
        if (row && target > numberOf(row.diameter)) notes.push(`${row.name}: Ø${row.diameter} → Ø${target} mm esetén a légsebesség komfortos tartományba kerülhet.`);
      }
    }
    if (deficit != null && deficit > 0) {
      for (const fitting of fittings) {
        const segment = result.segments.find(item => item.id === fitting.segmentId);
        if (!segment || numberOf(fitting.count) < 1) continue;
        const row = segments.find(item => item.id === fitting.segmentId);
        const curve = fitting.manufacturerConfirmed && row ? exactFittingProduct(fitting.manufacturer, fitting.type, numberOf(row.diameter, -1), needsSecondDiameter(fitting.type) ? numberOf(fitting.secondaryDiameter, -1) : undefined) : null;
        const curveResult = curve && row ? pressureFromManufacturerCurve(curve, numberOf(row.airflow, -1)) : null;
        const activeK = fitting.verifiedK.trim() && fitting.sourceReference.trim() ? numberOf(fitting.verifiedK) : FITTING_TYPES[fitting.type].coefficient;
        const saving = curveResult?.status === 'ok' ? curveResult.pressurePa : activeK * 0.5 * result.airDensityKgM3 * segment.velocityMs ** 2;
        if (saving >= deficit) notes.push(`Egy „${FITTING_TYPES[fitting.type].label}” elhagyása vagy kisebb veszteségű kivitelre cserélése kb. ${saving.toFixed(1)} Pa-t takarít meg, ami várhatóan megszünteti az ESP-hiányt.`);
      }
      let best: { name: string; from: number; to: number; saving: number } | null = null;
      for (const row of segments) {
        const from = numberOf(row.diameter);
        const to = STANDARD_ROUND_DIAMETERS_MM.find(value => value > from);
        if (!to) continue;
        const trial = calculateDuctPathPressure({ ...calculationInput, segments: calculationInput.segments.map(segment => segment.id === row.id ? { ...segment, diameterMm: to } : segment) });
        const saving = trial ? result.totalPressurePa - trial.totalPressurePa : 0;
        if (!best || saving > best.saving) best = { name: row.name, from, to, saving };
      }
      if (best && best.saving > 0) notes.push(`${best.name}: Ø${best.from} → Ø${best.to} mm várhatóan ${best.saving.toFixed(1)} Pa nyomásveszteséget csökkent.`);
      if (!notes.some(note => note.includes('ESP-hiányt')) && result.totalPressurePa > esp!) notes.push(`A rendszerhez legalább ${result.totalPressurePa.toFixed(0)} Pa külső statikus nyomás kell ezen a légúton; a megadott ${esp!.toFixed(0)} Pa nem elegendő.`);
    }
    return notes.slice(0, 5);
  }, [availableEsp, calculationInput, downstreamAirflow, fittings, result, segments]);

  const updateSegment = (id: number, patch: Partial<SegmentRow>) => setSegments(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const updateFitting = (id: number, patch: Partial<FittingRow>) => setFittings(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const updateTerminal = (id: number, patch: Partial<TerminalRow>) => setTerminals(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));

  return <View style={{ gap: 14 }}>
    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>1. A légút alapadatai</Text>
      <HelpText>Mindig egyetlen útvonalat adj meg a ventilátortól egy kiválasztott légszelepig vagy rácsig. Ne add össze a külön helyiségekbe vezető párhuzamos ágakat.</HelpText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {externalAirflow == null
          ? <Field label="Légmennyiség" value={airflow} onChangeText={setAirflow} suffix="m³/h" />
          : <View style={{ flex: 1, minWidth: 190 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Mértékadó út légmennyisége</Text><View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 11, padding: 12 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: '800' }}>{downstreamAirflow && Math.abs(numberOf(activeAirflow) - numberOf(downstreamAirflow)) >= 0.5 ? `${flowLabel(activeAirflow)} m³/h az elágazás előtt\n${flowLabel(downstreamAirflow)} m³/h az elágazás után` : `${flowLabel(activeAirflow)} m³/h végig ezen az ágon`}</Text></View></View>}
        <Field label="A gép rendelkezésre álló ESP-je – ha ismert" value={availableEsp} onChangeText={setAvailableEsp} suffix="Pa" />
        <Field label="Levegő hőmérséklete" value={temperature} onChangeText={setTemperature} suffix="°C" />
        <Field label="Légköri nyomás" value={atmosphericPressure} onChangeText={setAtmosphericPressure} suffix="Pa" />
      </View>
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '800' }}>2. Csőszakaszok</Text>
      <HelpText>Minden eltérő csőtípust vagy átmérőt külön sorban adj meg. Például az 5 m Sonodec és a 10 m spirálkorcolt cső két külön szakasz.</HelpText>
      {segments.map((row, index) => {
        const calc = result?.segments.find(item => item.id === row.id);
        return <View key={row.id} style={{ backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: TEXT, fontSize: 15, fontWeight: '800' }}>Szakasz {index + 1}</Text>
            {segments.length > 1 && <TouchableOpacity onPress={() => setSegments(items => items.filter(item => item.id !== row.id))}><Trash2 size={19} color="#EF4444" /></TouchableOpacity>}
          </View>
          <ChoiceButton label={DUCT_MATERIALS[row.material].label} onPress={() => updateSegment(row.id, { material: nextOf(materialIds, row.material) })} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            <Field label="Hossz" value={row.length} onChangeText={value => updateSegment(row.id, { length: value })} suffix="m" />
            <Field label="Belső átmérő" value={row.diameter} onChangeText={value => { updateSegment(row.id, { diameter: value }); setFittings(items => items.map(item => item.segmentId === row.id ? { ...item, manufacturer: 'Általános', manufacturerConfirmed: false } : item)); }} suffix="mm" />
            <Field label="Ezen a szakaszon haladó levegő" value={row.airflow} onChangeText={value => updateSegment(row.id, { airflow: value, followFlow: null })} suffix="m³/h" />
          </View>
          <View style={{ marginTop: 10 }}><Field label="Gyártói fajlagos veszteség – ha van" value={row.manufacturerLoss} onChangeText={value => updateSegment(row.id, { manufacturerLoss: value })} suffix="Pa/m" placeholder="üres = számított becslés" /></View>
          {calc && <Text style={{ color: calc.source === 'user-entered-product-data' ? GREEN : YELLOW, fontSize: 13, lineHeight: 19, marginTop: 9 }}>
            {calc.airflowM3h.toFixed(0)} m³/h · {calc.pressurePa.toFixed(1)} Pa · {calc.pressurePaPerM.toFixed(2)} Pa/m · {calc.velocityMs.toFixed(2)} m/s · {calc.source === 'user-entered-product-data' ? 'kézzel megadott termékadat' : 'általános anyagmodell'}
          </Text>}
        </View>;
      })}
      <TouchableOpacity onPress={() => setSegments(items => [...items, { id: Math.max(0, ...items.map(item => item.id)) + 1, name: 'Új szakasz', material: 'spiral', length: '1', diameter: '160', airflow: terminalAirflow, followFlow: downstreamAirflow ? 'endpoint' : null, manufacturerLoss: '' }])} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 }}>
        <Plus size={18} color={BLUE} /><Text style={{ color: BLUE, fontWeight: '800' }}>Új csőszakasz</Text>
      </TouchableOpacity>
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '800' }}>3. Idomok az útvonalon</Text>
      <HelpText>Válaszd ki az idomot, add meg a darabszámot és azt a szakaszt, amelybe az idom ténylegesen kerül. Így az app a megfelelő légsebességgel számol.</HelpText>
      {fittings.map(row => {
        const selectedSegment = segments.find(item => item.id === row.segmentId);
        const nominalSize = numberOf(selectedSegment?.diameter ?? '', -1);
        const secondDiameter = needsSecondDiameter(row.type) ? numberOf(row.secondaryDiameter, -1) : undefined;
        const secondDiameters = availableSecondDiameters(row.type, nominalSize);
        const availableManufacturers = manufacturersWithVerifiedData('fitting', row.type, nominalSize, secondDiameter);
        const manufacturerCurve = exactFittingProduct(row.manufacturer, row.type, nominalSize, secondDiameter);
        const manufacturerResult = manufacturerCurve && selectedSegment
          ? pressureFromManufacturerCurve(manufacturerCurve, numberOf(selectedSegment.airflow, -1))
          : null;
        return <View key={row.id} style={{ backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={{ flex: 1 }}><ChoiceButton label={FITTING_TYPES[row.type].label} onPress={() => { const type = nextOf(fittingIds, row.type); const secondaryDiameter = needsSecondDiameter(type) ? String(availableSecondDiameters(type, nominalSize)[0] ?? '') : ''; const allowed = manufacturersWithVerifiedData('fitting', type, nominalSize, secondaryDiameter ? numberOf(secondaryDiameter) : undefined); updateFitting(row.id, { type, secondaryDiameter, manufacturer: allowed.includes(row.manufacturer) ? row.manufacturer : 'Általános', manufacturerConfirmed: false }); }} color={YELLOW} /></View><TouchableOpacity onPress={() => setFittings(items => items.filter(item => item.id !== row.id))}><Trash2 size={19} color="#EF4444" /></TouchableOpacity></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <Field label="Darabszám" value={row.count} onChangeText={value => updateFitting(row.id, { count: value })} suffix="db" />
          <View style={{ flex: 1, minWidth: 120 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Melyik szakaszon?</Text><ChoiceButton label={`Szakasz ${Math.max(1, segments.findIndex(item => item.id === row.segmentId) + 1)}`} onPress={() => { const ids = segments.map(item => item.id); const at = Math.max(0, ids.indexOf(row.segmentId)); updateFitting(row.id, { segmentId: ids[(at + 1) % ids.length], manufacturer: 'Általános', manufacturerConfirmed: false }); }} /></View>
        </View>
        {needsSecondDiameter(row.type) && <View style={{ marginTop: 10 }}>
          <Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Kilépő csőátmérő</Text>
          <ChoiceButton label={row.secondaryDiameter ? `Ø${row.secondaryDiameter} mm` : 'Válassz kilépő átmérőt'} onPress={() => { const current = numberOf(row.secondaryDiameter, -1); const at = Math.max(-1, secondDiameters.indexOf(current)); const secondaryDiameter = String(secondDiameters[(at + 1) % secondDiameters.length] ?? ''); updateFitting(row.id, { secondaryDiameter, manufacturer: 'Általános', manufacturerConfirmed: false }); }} color={BLUE} />
          <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 6 }}>Az app a kijelölt szakasz Ø{nominalSize} mm belépő méretével és a választott kilépő mérettel keresi a pontos gyári idomot.</Text>
        </View>}
        <View style={{ marginTop: 10 }}><ChoiceButton label={`Gyártó: ${row.manufacturer}`} onPress={() => { const manufacturer = nextOf(availableManufacturers, row.manufacturer); updateFitting(row.id, { manufacturer, manufacturerConfirmed: false }); }} color={row.manufacturer === 'Általános' ? YELLOW : GREEN} /></View>
        {availableManufacturers.length === 1 && <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 7 }}>Ehhez a pontos idomtípushoz és {needsSecondDiameter(row.type) ? `Ø${nominalSize} → Ø${row.secondaryDiameter || '?'} mm méretpárhoz` : `Ø${nominalSize} mm mérethez`} még nincs beépített gyártói rekord.</Text>}
        {manufacturerCurve && <View style={{ marginTop: 10, backgroundColor: '#101820', borderColor: row.manufacturerConfirmed ? GREEN : BLUE, borderWidth: 1, borderRadius: 11, padding: 11 }}>
          <Text style={{ color: MUTED, fontSize: 12, fontWeight: '800' }}>ELLENŐRIZD A TERMÉKKÓDOT</Text>
          <Text style={{ color: TEXT, fontWeight: '900', fontSize: 17, marginTop: 4 }}>{manufacturerCurve.source.productCode}</Text>
          <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{manufacturerCurve.source.installationVariant}</Text>
          <TouchableOpacity onPress={() => updateFitting(row.id, { manufacturerConfirmed: !row.manufacturerConfirmed })} style={{ backgroundColor: row.manufacturerConfirmed ? `${GREEN}28` : `${BLUE}28`, borderRadius: 9, padding: 10, marginTop: 9 }}><Text style={{ color: row.manufacturerConfirmed ? GREEN : BLUE, textAlign: 'center', fontWeight: '900' }}>{row.manufacturerConfirmed ? '✓ Termékkód jóváhagyva – gyártói görbe aktív' : 'Igen, ez a termékkód stimmel'}</Text></TouchableOpacity>
        </View>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <Field label="Ellenőrzött K – ha ismert" value={row.verifiedK} onChangeText={value => updateFitting(row.id, { verifiedK: value })} placeholder={`általános: ${FITTING_TYPES[row.type].coefficient}`} />
          <View style={{ flex: 1, minWidth: 180 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Forrás / pontos termékkód</Text><View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11 }}><TextInput value={row.sourceReference} onChangeText={value => updateFitting(row.id, { sourceReference: value })} placeholder="adatlap, oldal, kód" placeholderTextColor="#66717E" style={{ color: TEXT, fontSize: 16, padding: 12, flex: 1 }} /></View></View>
        </View>
        {row.manufacturerConfirmed && manufacturerCurve && manufacturerResult?.status === 'ok'
          ? <Text style={{ color: GREEN, fontSize: 12, lineHeight: 18, marginTop: 8 }}>Hivatalos Lindab görbéből: {manufacturerResult.pressurePa.toFixed(2)} Pa/db, {numberOf(selectedSegment?.airflow ?? '').toFixed(0)} m³/h légmennyiségnél. Nincs extrapoláció.</Text>
          : row.manufacturerConfirmed && manufacturerCurve
            ? <Text style={{ color: RED, fontSize: 12, lineHeight: 18, marginTop: 8 }}>A légmennyiség kívül esik a gyártó által közzétett görbetartományon; a gyári adatot nem használjuk.</Text>
            : <Text style={{ color: row.verifiedK.trim() && row.sourceReference.trim() ? GREEN : YELLOW, fontSize: 12, marginTop: 8 }}>{row.verifiedK.trim() && row.sourceReference.trim() ? `Ellenőrzött K = ${row.verifiedK} aktív a kijelölt szakasz sebességnyomásával.` : `Általános K = ${FITTING_TYPES[row.type].coefficient}; geometria- és termékspecifikus pontosság nem igazolt.`}</Text>}
      </View>})}
      <TouchableOpacity onPress={() => setFittings(items => [...items, { id: Math.max(0, ...items.map(item => item.id)) + 1, type: 'elbow90Pressed', count: '1', segmentId: segments[0].id, secondaryDiameter: '', manufacturer: 'Általános', manufacturerConfirmed: false, verifiedK: '', sourceReference: '' }])} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 }}><Plus size={18} color={BLUE} /><Text style={{ color: BLUE, fontWeight: '800' }}>Új idom</Text></TouchableOpacity>
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '800' }}>4. Légszelepek és berendezések</Text>
      <HelpText>Előbb válaszd ki a végpont fajtáját és méretét, majd a gyártót. Ha találunk pontos hivatalos terméket, megmutatjuk a termékkódot; a gyári adat csak a kód jóváhagyása után lesz aktív.</HelpText>
      {terminals.map(row => <View key={row.id} style={{ backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={{ flex: 1 }}><ChoiceButton label={TERMINAL_TYPES[row.type].label} onPress={() => { const type = nextOf(terminalIds, row.type); const allowed = manufacturersWithVerifiedData('terminal', type, numberOf(row.nominalSize, -1)); const manufacturer = allowed.includes(row.manufacturer) ? row.manufacturer : 'Általános'; const match = exactTerminalProduct(manufacturer, type, row.nominalSize); updateTerminal(row.id, { type, manufacturer, lossPa: String(TERMINAL_TYPES[type].defaultLossPa), manufacturerCurveId: match?.id ?? null, manufacturerConfirmed: false }); }} color={GREEN} /></View><TouchableOpacity onPress={() => setTerminals(items => items.filter(item => item.id !== row.id))}><Trash2 size={19} color="#EF4444" /></TouchableOpacity></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <Field label="Névleges méret" value={row.nominalSize} onChangeText={value => { const allowed = manufacturersWithVerifiedData('terminal', row.type, numberOf(value, -1)); const manufacturer = allowed.includes(row.manufacturer) ? row.manufacturer : 'Általános'; const match = exactTerminalProduct(manufacturer, row.type, value); updateTerminal(row.id, { nominalSize: value, manufacturer, manufacturerCurveId: match?.id ?? null, manufacturerConfirmed: false }); }} suffix="mm" />
          <View style={{ flex: 1, minWidth: 120 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Gyártó</Text><ChoiceButton label={row.manufacturer} onPress={() => { const allowed = manufacturersWithVerifiedData('terminal', row.type, numberOf(row.nominalSize, -1)); const manufacturer = nextOf(allowed, row.manufacturer); const match = exactTerminalProduct(manufacturer, row.type, row.nominalSize); updateTerminal(row.id, { manufacturer, manufacturerCurveId: match?.id ?? null, manufacturerConfirmed: false }); }} color={row.manufacturer === 'Általános' ? YELLOW : GREEN} /></View>
        </View>
        {row.manufacturer !== 'Általános' && !row.manufacturerCurveId && <Text style={{ color: YELLOW, fontSize: 12, lineHeight: 18, marginTop: 7 }}>Ehhez a gyártó–terméktípus pároshoz még nincs ellenőrzött hivatalos rekord. Az általános mérnöki érték marad aktív.</Text>}
        {row.manufacturerCurveId && <View style={{ marginTop: 10, backgroundColor: '#101820', borderColor: row.manufacturerConfirmed ? GREEN : BLUE, borderWidth: 1, borderRadius: 11, padding: 11 }}><Text style={{ color: MUTED, fontSize: 12, fontWeight: '800' }}>ELLENŐRIZD A DOBOZON / ADATLAPON</Text><Text style={{ color: TEXT, fontWeight: '900', fontSize: 17, marginTop: 4 }}>Termékkód: {VERIFIED_MANUFACTURER_CURVES.find(item => item.id === row.manufacturerCurveId)?.source.productCode}</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>{VERIFIED_MANUFACTURER_CURVES.find(item => item.id === row.manufacturerCurveId)?.label}</Text><TouchableOpacity onPress={() => updateTerminal(row.id, { manufacturerConfirmed: !row.manufacturerConfirmed })} style={{ backgroundColor: row.manufacturerConfirmed ? `${GREEN}28` : `${BLUE}28`, borderRadius: 9, padding: 10, marginTop: 9 }}><Text style={{ color: row.manufacturerConfirmed ? GREEN : BLUE, textAlign: 'center', fontWeight: '900' }}>{row.manufacturerConfirmed ? '✓ Termékkód jóváhagyva – gyártói adat aktív' : 'Igen, ez a termékkód stimmel'}</Text></TouchableOpacity></View>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}><Field label="Darabszám" value={row.count} onChangeText={value => updateTerminal(row.id, { count: value })} suffix="db" /><Field label={row.manufacturerCurveId ? 'Tartalékolt általános adat (csak tartományon kívül)' : 'Általános veszteség darabonként'} value={row.lossPa} onChangeText={value => updateTerminal(row.id, { lossPa: value })} suffix="Pa" /></View>
        {row.manufacturerConfirmed && row.manufacturerCurveId && (() => { const curve = VERIFIED_MANUFACTURER_CURVES.find(item => item.id === row.manufacturerCurveId); const curveResult = curve ? pressureFromManufacturerCurve(curve, numberOf(terminalAirflow, -1)) : null; return curveResult?.status === 'ok' ? <Text style={{ color: GREEN, fontSize: 12, marginTop: 8 }}>Hivatalos görbéből interpolálva: {curveResult.pressurePa.toFixed(1)} Pa. Nincs extrapoláció.</Text> : <Text style={{ color: RED, fontSize: 12, marginTop: 8 }}>A megadott légmennyiség kívül esik a gyártói görbe tartományán; ezt a termékadatot nem használjuk.</Text>; })()}
      </View>)}
      <TouchableOpacity onPress={() => setTerminals(items => [...items, { id: Math.max(0, ...items.map(item => item.id)) + 1, type: 'supplyValve', nominalSize: '125', count: '1', lossPa: '30', manufacturer: 'Általános', manufacturerCurveId: null, manufacturerConfirmed: false }])} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 }}><Plus size={18} color={BLUE} /><Text style={{ color: BLUE, fontWeight: '800' }}>Új végpont vagy berendezés</Text></TouchableOpacity>
    </View>

    <View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 20, fontWeight: '900', marginBottom: 12 }}>Eredmény ezen a légúton</Text>
      {!result ? <Text style={{ color: '#EF4444', fontSize: 14 }}>Ellenőrizd a hiányzó vagy hibás adatokat.</Text> : <>
        {[
          ['Egyenes csőszakaszok', result.straightPressurePa],
          ['Idomok', result.fittingPressurePa],
          ['Végpontok és berendezések', result.terminalPressurePa],
        ].map(([label, value]) => <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ color: MUTED, fontSize: 14 }}>{label as string}</Text><Text style={{ color: TEXT, fontSize: 15, fontWeight: '700' }}>{(value as number).toFixed(1)} Pa</Text></View>)}
        <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: '800' }}>Teljes nyomásveszteség</Text><Text style={{ color: BLUE, fontSize: 28, fontWeight: '900' }}>{result.totalPressurePa.toFixed(1)} Pa</Text></View>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>Számított légsűrűség: {result.airDensityKgM3.toFixed(3)} kg/m³</Text>
        <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 3 }}>Módszer: {result.method}</Text>
        <Text style={{ color: result.usesEstimate ? YELLOW : GREEN, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{result.usesEstimate ? `${result.generalDataItems} tételnél általános adat szerepel; az eredmény ajánlás ismert és tipikus adatokból.` : 'Minden veszteségi adatot kézzel adtál meg; ellenőrizd őket a termék hivatalos adatlapján.'}</Text>
        <Text style={{ color: missingRequired.length ? RED : quality.assumedInputKeys.length ? YELLOW : GREEN, fontSize: 12, lineHeight: 18, marginTop: 3 }}>Adatkitöltöttség: {quality.dataCompletenessPercent}% · {missingRequired.length ? `Hiányzik: ${missingRequired.join(', ')}` : quality.assumedInputKeys.length ? `${quality.assumedInputKeys.length} általános adat dokumentálva` : 'nincs hiányzó vagy feltételezett adat'}</Text>
        <CalculationReportButton buildRecord={() => ({
          toolId: 'pressure-drop', toolTitle: 'Egy légút nyomásvesztesége', language, jurisdiction,
          method: { id: quality.methodId, version: quality.methodVersion, name: 'Darcy–Weisbach légútszámítás', formulaSummary: 'Szakaszonkénti súrlódási veszteség + idomok helyi vesztesége + végpontok/berendezések nyomásvesztesége.' },
          inputs: [
            { key: 'airflow', label: 'Kiinduló légmennyiség', value: numberOf(activeAirflow), unit: 'm³/h', origin: 'measured' },
            { key: 'airTemperature', label: 'Levegő-hőmérséklet', value: numberOf(temperature), unit: '°C', origin: 'measured' },
            { key: 'atmosphericPressure', label: 'Légköri nyomás', value: numberOf(atmosphericPressure), unit: 'Pa', origin: 'measured' },
            ...segments.flatMap((item, index) => [
              { key: `segment.${index + 1}.material`, label: `${index + 1}. szakasz anyaga`, value: DUCT_MATERIALS[item.material].label, origin: item.manufacturerLoss.trim() ? 'manufacturer' as const : 'selected-typical' as const },
              { key: `segment.${index + 1}.length`, label: `${index + 1}. szakasz hossza`, value: numberOf(item.length), unit: 'm', origin: 'measured' as const },
              { key: `segment.${index + 1}.diameter`, label: `${index + 1}. szakasz belső átmérője`, value: numberOf(item.diameter), unit: 'mm', origin: 'measured' as const },
              { key: `segment.${index + 1}.airflow`, label: `${index + 1}. szakasz légmennyisége`, value: numberOf(item.airflow), unit: 'm³/h', origin: 'measured' as const },
            ]),
            ...fittings.flatMap((item, index) => [
              { key: `fitting.${index + 1}`, label: FITTING_TYPES[item.type].label, value: numberOf(item.count), unit: 'db', origin: activeFittingProducts[index] || item.verifiedK.trim() && item.sourceReference.trim() ? 'manufacturer' as const : 'selected-typical' as const },
              ...(needsSecondDiameter(item.type) ? [{ key: `fitting.${index + 1}.secondaryDiameter`, label: `${FITTING_TYPES[item.type].label} kilépő átmérő`, value: numberOf(item.secondaryDiameter), unit: 'mm', origin: 'measured' as const }] : []),
            ]),
            ...terminals.map((item, index) => ({ key: `terminal.${index + 1}`, label: TERMINAL_TYPES[item.type].label, value: numberOf(item.count), unit: 'db', origin: item.manufacturerConfirmed ? 'manufacturer' as const : 'selected-typical' as const })),
          ],
          outputs: [
            { key: 'straightPressure', label: 'Egyenes szakaszok vesztesége', value: Number(result.straightPressurePa.toFixed(2)), unit: 'Pa', origin: 'calculated' },
            { key: 'fittingPressure', label: 'Idomveszteség', value: Number(result.fittingPressurePa.toFixed(2)), unit: 'Pa', origin: 'calculated' },
            { key: 'terminalPressure', label: 'Végpontok vesztesége', value: Number(result.terminalPressurePa.toFixed(2)), unit: 'Pa', origin: 'calculated' },
            { key: 'totalPressure', label: 'Teljes nyomásveszteség', value: Number(result.totalPressurePa.toFixed(2)), unit: 'Pa', origin: 'calculated' },
          ],
          assumptions: quality.assumedInputKeys, sources: quality.sources, quality,
          complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
          requiredVerification: ['Gyártói ventilátorgörbe ellenőrzése az üzemi pontban', 'Helyszíni légmennyiség- és nyomásmérés', 'A hálózat beszabályozása'],
        })} />
      </>}
    </View>

    {recommendations.length > 0 && <View style={{ backgroundColor: '#1A160D', borderColor: YELLOW, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: YELLOW, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Konkrét javítási javaslatok</Text>
      {recommendations.map((recommendation, index) => <Text key={`${index}-${recommendation}`} style={{ color: TEXT, fontSize: 14, lineHeight: 20, marginBottom: 7 }}>• {recommendation}</Text>)}
    </View>}

    <AccuracyNotice level="engineering-estimate" note="A csősúrlódást elfogadott Darcy–Weisbach-módszerrel számoljuk. Ahol nincs pontos termékadat, ott általános anyagérdesség, idom-K vagy végpontveszteség szerepel, ezért az eredmény szakmailag számított, de nem gyári pontosságú. Azonosított hivatalos gyártói adat mindig elsőbbséget kap." />
    <Text style={{ color: MUTED, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>Ha a légszelepek külön párhuzamos ágakon vannak, készíts külön légutat mindegyikhez, vagy használd a Légcsatornaág-tervezés és ESP eszközt. A párhuzamos ágak veszteségeit nem szabad összeadni.</Text>
  </View>;
}
