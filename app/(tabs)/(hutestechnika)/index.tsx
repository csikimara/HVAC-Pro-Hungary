import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Zap, Gauge, FlaskConical, Table2, Thermometer, Activity, Ruler, Wind, Layers, Plus, Trash2, Home } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ToolGuide } from '@/components/AccuracyNotice';
import { PT_SATURATION_DATA, type RefrigerantId } from '@/domain/ptData';
import { HeatLoadWizard } from '@/components/HeatLoadWizard';
import { CalculationReportButton } from '@/components/CalculationReportButton';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { classifyCalculationQuality } from '@/domain/calculationQuality';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const HVAC_CYAN = '#06B6D4';
const HVAC_GREEN = '#22C55E';
const HVAC_YELLOW = '#F59E0B';
const HVAC_RED = '#EF4444';

function numeric(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

// ─── Shared ResultRow ─────────────────────────────────────────────────────────

function ResultRow({ label, value, unit, highlight }: {
  label: string;
  value: string;
  unit?: string;
  highlight?: string;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={[styles.resultValue, highlight ? { color: highlight } : {}]}>{value}</Text>
        {unit ? <Text style={styles.resultUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

// ─── 1. Teljesítmény átváltó ──────────────────────────────────────────────────

type PowerUnit = 'kW' | 'W' | 'BTU/h' | 'kcal/h' | 'tonna hűtés';
const POWER_UNITS: PowerUnit[] = ['kW', 'W', 'BTU/h', 'kcal/h', 'tonna hűtés'];
const TO_KW: Record<PowerUnit, number> = {
  'kW': 1,
  'W': 0.001,
  'BTU/h': 1 / 3412.14,
  'kcal/h': 1 / 860,
  'tonna hűtés': 3.51685,
};
const FROM_KW: Record<PowerUnit, number> = {
  'kW': 1,
  'W': 1000,
  'BTU/h': 3412.14,
  'kcal/h': 860,
  'tonna hűtés': 1 / 3.51685,
};

function TeljesitmenyAtvalto() {
  const [open, setOpen] = useState(true);
  const [fromUnit, setFromUnit] = useState<PowerUnit>('kW');
  const [toUnit, setToUnit] = useState<PowerUnit>('BTU/h');
  const [inputVal, setInputVal] = useState('');

  const result = useMemo(() => {
    const v = parseFloat(inputVal);
    if (isNaN(v) || v < 0) return null;
    const kw = v * TO_KW[fromUnit];
    const out = kw * FROM_KW[toUnit];
    if (toUnit === 'kW') return out.toFixed(2);
    if (toUnit === 'W') return Math.round(out).toString();
    if (toUnit === 'BTU/h') return Math.round(out).toLocaleString('hu-HU');
    if (toUnit === 'kcal/h') return Math.round(out).toLocaleString('hu-HU');
    if (toUnit === 'tonna hűtés') return out.toFixed(3);
    return out.toFixed(2);
  }, [inputVal, fromUnit, toUnit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Teljesítmény átváltó toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Zap size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>Teljesítmény átváltó</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Ebből</Text>
          <View style={styles.unitRow}>
            {POWER_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, fromUnit === u && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] Teljesítmény from unit:', u); setFromUnit(u); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, fromUnit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Ebbe</Text>
          <View style={styles.unitRow}>
            {POWER_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, toUnit === u && { backgroundColor: HVAC_CYAN + '33', borderColor: HVAC_CYAN }]}
                onPress={() => { console.log('[Hűtéstechnika] Teljesítmény to unit:', u); setToUnit(u); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, toUnit === u && { color: HVAC_CYAN }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Érték</Text>
          <TextInput
            style={styles.inputLarge}
            value={inputVal}
            onChangeText={v => { console.log('[Hűtéstechnika] Teljesítmény input:', v); setInputVal(v); }}
            keyboardType="numeric"
            placeholder="pl. 3.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow
              label="Átváltott érték"
              value={result ?? '—'}
              unit={result ? toUnit : undefined}
              highlight={result ? HVAC_CYAN : undefined}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 2. COP / EER ─────────────────────────────────────────────────────────────

function CopEer() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'COP' | 'EER'>('COP');
  const [qInput, setQInput] = useState('');
  const [pInput, setPInput] = useState('');

  const result = useMemo(() => {
    const q = parseFloat(qInput);
    const p = parseFloat(pInput);
    if (isNaN(q) || isNaN(p) || p <= 0 || q <= 0) return null;
    const val = q / p;
    let rating: string;
    let color: string;
    if (val >= 4.5) { rating = 'Kiváló'; color = HVAC_GREEN; }
    else if (val >= 3.5) { rating = 'Jó'; color = HVAC_GREEN; }
    else if (val >= 2.5) { rating = 'Közepes'; color = HVAC_YELLOW; }
    else { rating = 'Gyenge'; color = HVAC_RED; }
    return { val: val.toFixed(2), rating, color };
  }, [qInput, pInput, mode]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] COP/EER toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Gauge size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>COP / EER</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['COP', 'EER'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] COP/EER mode:', m); setMode(m); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{mode === 'COP' ? 'Fűtési teljesítmény (kW)' : 'Hűtési teljesítmény (kW)'}</Text>
          <TextInput
            style={styles.inputLarge}
            value={qInput}
            onChangeText={v => { console.log('[Hűtéstechnika] COP/EER Q input:', v); setQInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 5.0"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Felvett villamos teljesítmény (kW)</Text>
          <TextInput
            style={styles.inputLarge}
            value={pInput}
            onChangeText={v => { console.log('[Hűtéstechnika] COP/EER P input:', v); setPInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 1.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label={mode} value={result?.val ?? '—'} highlight={result?.color} />
            <ResultRow label="Értékelés" value={result?.rating ?? '—'} highlight={result?.color} />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 3. Nyomáspróba ───────────────────────────────────────────────────────────

function Nyomaspróba() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [open, setOpen] = useState(true);
  const [unit, setUnit] = useState<'bar' | 'kPa' | 'Pa'>('bar');
  const [startP, setStartP] = useState('');
  const [endP, setEndP] = useState('');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [atmosphericBar, setAtmosphericBar] = useState('1,01325');
  const [toleranceBar, setToleranceBar] = useState('0,20');
  const [testMedium, setTestMedium] = useState('Nitrogén');
  const [pressureInstrument, setPressureInstrument] = useState('');
  const [temperatureInstrument, setTemperatureInstrument] = useState('');
  const [toleranceSource, setToleranceSource] = useState('');

  const UNITS: Array<'bar' | 'kPa' | 'Pa'> = ['bar', 'kPa', 'Pa'];

  const result = useMemo(() => {
    const p1g = numeric(startP);
    const measuredEnd = endP.trim() ? numeric(endP) : null;
    const T1c = numeric(t1);
    const T2c = numeric(t2);
    const atmosphericPressureBar = numeric(atmosphericBar);
    const toleranceInBar = numeric(toleranceBar);
    if (![p1g, T1c, T2c, atmosphericPressureBar, toleranceInBar].every(Number.isFinite) || atmosphericPressureBar <= 0 || toleranceInBar < 0) return null;

    // atmospheric offset in the current unit
    const unitPerBar = unit === 'bar' ? 1 : unit === 'kPa' ? 100 : 100000;
    const atm = atmosphericPressureBar * unitPerBar;
    const tolerance = toleranceInBar * unitPerBar;

    const p1abs = p1g + atm;
    const T1K = T1c + 273.15;
    const T2K = T2c + 273.15;
    if (T1K <= 0 || T2K <= 0) return null;

    const p2TheoAbs = p1abs * (T2K / T1K);
    const p2TheoGauge = p2TheoAbs - atm;
    const minimum = p2TheoGauge - tolerance;
    const difference = measuredEnd == null || !Number.isFinite(measuredEnd) ? null : measuredEnd - p2TheoGauge;
    const status = difference == null ? null : measuredEnd! < minimum ? 'below' : Math.abs(difference) <= tolerance ? 'within' : 'above';

    // Format helpers
    const fmt = (v: number) =>
      unit === 'bar' ? v.toFixed(3) : unit === 'kPa' ? v.toFixed(1) : Math.round(v).toString();

    return {
      p2Theo: fmt(p2TheoGauge),
      minimum: fmt(minimum),
      difference: difference == null ? null : fmt(difference),
      status,
    };
  }, [startP, endP, t1, t2, unit, atmosphericBar, toleranceBar]);

  const pressureRequired: Array<readonly [string, string]> = completeMode ? [
    ['testMedium', testMedium], ['pressureInstrument', pressureInstrument],
    ['temperatureInstrument', temperatureInstrument], ['toleranceSource', toleranceSource],
  ] as const : [];
  const pressureMissing = pressureRequired.filter(([, value]) => !value.trim()).map(([key]) => key);
  const pressureQuality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'ideal-gas-pressure-temperature-correction', methodVersion: '2.0.0',
    requiredInputCount: completeMode ? 9 : 5, suppliedRequiredInputCount: completeMode ? 9 - pressureMissing.length : 5,
    assumedInputKeys: completeMode ? [] : ['instrumentUncertaintyNotDocumented'], missingRequiredInputKeys: pressureMissing,
    sources: [{ kind: 'engineering-reference', title: 'Ideális gáz állapotegyenlet – zárt térfogat hőmérséklet-korrekciója' }], verificationRequired: 'commissioning',
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Nyomáspróba toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <FlaskConical size={20} color={HVAC_GREEN} />
          <Text style={styles.cardTitle}>Nyomáspróba</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Nyomásegység</Text>
          <View style={styles.unitRow}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] Nyomáspróba unit:', u); setUnit(u); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Kezdő nyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={startP}
            onChangeText={v => { console.log('[Hűtéstechnika] Kezdő nyomás input:', v); setStartP(v); }}
            keyboardType="numeric"
            placeholder="pl. 40"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Kezdeti hőmérséklet T₁ (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={t1}
            onChangeText={v => { console.log('[Hűtéstechnika] T1 input:', v); setT1(v); }}
            keyboardType="numeric"
            placeholder="pl. 20"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Végső hőmérséklet T₂ (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={t2}
            onChangeText={v => { console.log('[Hűtéstechnika] T2 input:', v); setT2(v); }}
            keyboardType="numeric"
            placeholder="pl. 22"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Helyi légköri nyomás (bar abs.)</Text>
          <TextInput
            style={styles.inputLarge}
            value={atmosphericBar}
            onChangeText={setAtmosphericBar}
            keyboardType="numeric"
            placeholder="1,01325"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {completeMode && <>
            <Text style={styles.label}>Próbaközeg</Text><TextInput style={styles.inputLarge} value={testMedium} onChangeText={setTestMedium} placeholder="pl. száraz nitrogén" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Nyomásmérő azonosító / típus / kalibrálás</Text><TextInput style={styles.inputLarge} value={pressureInstrument} onChangeText={setPressureInstrument} placeholder="műszer és kalibrálási adat" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Hőmérő azonosító / típus / kalibrálás</Text><TextInput style={styles.inputLarge} value={temperatureInstrument} onChangeText={setTemperatureInstrument} placeholder="műszer és kalibrálási adat" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Elfogadási tűrés forrása</Text><TextInput style={styles.inputLarge} value={toleranceSource} onChangeText={setToleranceSource} placeholder="gyártói előírás / projektkövetelmény" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            {pressureMissing.length > 0 && <Text style={[styles.noteText, { color: HVAC_YELLOW }]}>A mérnöki számításhoz még {pressureMissing.length} bizonyító adat hiányzik.</Text>}
          </>}

          <View style={styles.resultBox}>
            <ResultRow label="Ennyit kell mutatnia a végén" value={result?.p2Theo ?? '—'} unit={result ? unit : undefined} highlight={result ? HVAC_BLUE : undefined} />
          </View>

          <Text style={styles.label}>Ténylegesen mért végnyomás ({unit}) – opcionális</Text>
          <TextInput style={styles.inputLarge} value={endP} onChangeText={setEndP} keyboardType="numeric" placeholder="pl. 39,8" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <Text style={styles.label}>Figyelembe vett mérési eltérés (bar)</Text>
          <TextInput style={styles.inputLarge} value={toleranceBar} onChangeText={setToleranceBar} keyboardType="numeric" placeholder="pl. 0,20" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <View style={styles.resultBox}>
            <ResultRow label="Beállított alsó összehasonlítási határ" value={result?.minimum ?? '—'} unit={result ? unit : undefined} />
            <ResultRow label="Mért érték eltérése az elméletitől" value={result?.difference ?? '—'} unit={result?.difference != null ? unit : undefined} highlight={result?.status === 'below' ? HVAC_RED : result?.status === 'within' ? HVAC_GREEN : result?.status === 'above' ? HVAC_YELLOW : undefined} />
            <ResultRow label="Értékelés" value={result?.status === 'below' ? 'Az alsó határ alatt – ellenőrizd a rendszert' : result?.status === 'within' ? 'A beállított mérési tartományon belül' : result?.status === 'above' ? 'Az elméleti érték felett – hőkiegyenlítődés/mérés ellenőrzendő' : 'Add meg a mért végnyomást az összehasonlításhoz'} highlight={result?.status === 'below' ? HVAC_RED : result?.status === 'within' ? HVAC_GREEN : result?.status === 'above' ? HVAC_YELLOW : undefined} />
          </View>

          <Text style={styles.noteText}>
            Az eltelt idő nem része a hőmérséklet-korrekció képletének. A piros jelzés a saját magad által beállított mérési eltéréshez viszonyít; nem önkényes szivárgási határ és nem helyettesíti a szabályosan végzett nyomáspróbát.
          </Text>
          {result && <CalculationReportButton buildRecord={() => ({
            toolId: 'pressure-test', toolTitle: 'Nyomáspróba hőmérséklet-korrekció', language, jurisdiction,
            method: { id: pressureQuality.methodId, version: pressureQuality.methodVersion, name: 'Zárt gáztér hőmérséklet-korrekciója', formulaSummary: 'P₂,abs = P₁,abs × T₂/T₁; a manométeres nyomás abszolútra alakítva, a hőmérséklet Kelvinben.' },
            inputs: [
              { key: 'startPressure', label: 'Kezdő relatív nyomás', value: numeric(startP), unit, origin: 'measured' },
              { key: 'startTemperature', label: 'Kezdeti hőmérséklet', value: numeric(t1), unit: '°C', origin: 'measured' },
              { key: 'endTemperature', label: 'Végső hőmérséklet', value: numeric(t2), unit: '°C', origin: 'measured' },
              { key: 'atmosphericPressure', label: 'Légköri nyomás', value: numeric(atmosphericBar), unit: 'bar abs.', origin: 'measured' },
              { key: 'measuredEndPressure', label: 'Mért végnyomás', value: endP.trim() ? numeric(endP) : null, unit, origin: endP.trim() ? 'measured' : 'missing' },
              { key: 'tolerance', label: 'Összehasonlítási tűrés', value: numeric(toleranceBar), unit: 'bar', origin: completeMode ? 'measured' : 'selected-typical' },
              ...pressureRequired.map(([key, value]) => ({ key, label: key, value: value || null, origin: value ? 'measured' as const : 'missing' as const })),
            ],
            outputs: [
              { key: 'theoreticalEndPressure', label: 'Elméleti végnyomás', value: result.p2Theo, unit, origin: 'calculated' },
              { key: 'comparisonMinimum', label: 'Alsó összehasonlítási határ', value: result.minimum, unit, origin: 'calculated' },
              { key: 'difference', label: 'Mért eltérés', value: result.difference, unit, origin: 'calculated' },
            ],
            assumptions: pressureQuality.assumedInputKeys, sources: pressureQuality.sources, quality: pressureQuality,
            complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
            requiredVerification: ['Stabilizált közeghőmérséklet igazolása', 'A teljes rendszer szabályos szivárgásvizsgálata', 'Gyártói maximális próbanyomás betartása'],
          })} />}
        </View>
      )}
    </View>
  );
}

// ─── 4. PT tábla ──────────────────────────────────────────────────────────────

type PtPressureUnit = 'bar' | 'kPa' | 'MPa' | 'psi';
type PressureBasis = 'gauge' | 'absolute';

const REFRIGERANT_LABELS: Record<RefrigerantId, string> = {
  R32: 'R32', R410A: 'R410A', R134a: 'R134a', R404A: 'R404A', R407C: 'R407C',
  R290: 'R290 (propán)', R600a: 'R600a (izobután)', R1234yf: 'R1234yf',
  R22: 'R22 (régi rendszer)', R744: 'R744 / CO₂', R454B: 'R454B', R454C: 'R454C',
  R448A: 'R448A', R449A: 'R449A',
};

function pressureToAbsoluteBar(value: number, unit: PtPressureUnit, basis: PressureBasis, atmosphericBar: number): number {
  const bar = unit === 'bar' ? value : unit === 'kPa' ? value / 100 : unit === 'MPa' ? value * 10 : value * 0.0689475729;
  return basis === 'gauge' ? bar + atmosphericBar : bar;
}

function saturationTemperature(refrigerant: RefrigerantId, absoluteBar: number, phase: 'bubble' | 'dew') {
  const rows = PT_SATURATION_DATA[refrigerant];
  const column = phase === 'bubble' ? 1 : 2;
  if (absoluteBar < rows[0][column] || absoluteBar > rows[rows.length - 1][column]) return null;
  for (let index = 0; index < rows.length - 1; index += 1) {
    const current = rows[index];
    const next = rows[index + 1];
    const p0 = current[column];
    const p1 = next[column];
    if (absoluteBar >= p0 && absoluteBar <= p1) {
      const ratio = p1 === p0 ? 0 : (absoluteBar - p0) / (p1 - p0);
      return current[0] + ratio * (next[0] - current[0]);
    }
  }
  return null;
}

function PtTabla() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [open, setOpen] = useState(true);
  const [refrigerant, setRefrigerant] = useState<RefrigerantId>('R32');
  const [pressure, setPressure] = useState('');
  const [unit, setUnit] = useState<PtPressureUnit>('bar');
  const [basis, setBasis] = useState<PressureBasis>('gauge');
  const [atmosphericBar, setAtmosphericBar] = useState('1.01325');
  const [pressureInstrument, setPressureInstrument] = useState('');
  const [refrigerantEvidence, setRefrigerantEvidence] = useState('');

  const REFRIGERANTS = Object.keys(PT_SATURATION_DATA) as RefrigerantId[];
  const UNITS: PtPressureUnit[] = ['bar', 'kPa', 'MPa', 'psi'];

  const result = useMemo(() => {
    const v = parseFloat(pressure);
    const atm = parseFloat(atmosphericBar.replace(',', '.'));
    if (isNaN(v) || v < 0 || isNaN(atm) || atm <= 0) return null;
    const absoluteBar = pressureToAbsoluteBar(v, unit, basis, atm);
    const bubble = saturationTemperature(refrigerant, absoluteBar, 'bubble');
    const dew = saturationTemperature(refrigerant, absoluteBar, 'dew');
    return { absoluteBar, bubble, dew, outOfRange: bubble === null || dew === null };
  }, [pressure, unit, basis, atmosphericBar, refrigerant]);
  const ptRequired: Array<readonly [string, string]> = completeMode ? [['pressureInstrument', pressureInstrument], ['refrigerantEvidence', refrigerantEvidence]] : [];
  const ptMissing = ptRequired.filter(([, value]) => !value.trim()).map(([key]) => key);
  const ptQuality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'coolprop-pt-interpolation', methodVersion: '2.0.0',
    requiredInputCount: completeMode ? 6 : 4, suppliedRequiredInputCount: completeMode ? 6 - ptMissing.length : 4,
    assumedInputKeys: completeMode ? [] : ['instrumentAccuracyNotDocumented', 'refrigerantIdentityUserSelected'], missingRequiredInputKeys: ptMissing,
    sources: [{ kind: 'engineering-reference', title: 'CoolProp 8.0.0 telítési tulajdonságadatok' }], verificationRequired: 'manufacturer-document',
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] PT tábla toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Table2 size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>PT tábla</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Hűtőközeg</Text>
          <View style={[styles.segmentRow, { flexWrap: 'wrap' }]}>
            {REFRIGERANTS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.segmentBtn, refrigerant === r && styles.segmentBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] PT tábla refrigerant:', r); setRefrigerant(r); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, refrigerant === r && styles.segmentTextActive]}>{REFRIGERANT_LABELS[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>A műszeren kijelzett nyomás</Text>
          <View style={styles.segmentRow}>
            {([['gauge', 'Relatív / manométeres'], ['absolute', 'Abszolút']] as const).map(([value, label]) => (
              <TouchableOpacity key={value} style={[styles.segmentBtn, basis === value && styles.segmentBtnActive]} onPress={() => setBasis(value)} activeOpacity={0.7}>
                <Text style={[styles.segmentText, basis === value && styles.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nyomásegység</Text>
          <View style={styles.unitRow}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] PT tábla unit:', u); setUnit(u); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={pressure}
            onChangeText={v => { console.log('[Hűtéstechnika] PT tábla nyomás input:', v); setPressure(v); }}
            keyboardType="numeric"
            placeholder={unit === 'bar' ? 'pl. 10,5' : unit === 'kPa' ? 'pl. 1050' : unit === 'MPa' ? 'pl. 1,05' : 'pl. 152'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {basis === 'gauge' && <>
            <Text style={styles.label}>Helyi légköri nyomás (bar abs.)</Text>
            <TextInput style={styles.inputLarge} value={atmosphericBar} onChangeText={setAtmosphericBar} keyboardType="numeric" placeholder="1,01325" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          </>}
          {completeMode && <>
            <Text style={styles.label}>Nyomásmérő azonosító / pontosság / kalibrálás</Text><TextInput style={styles.inputLarge} value={pressureInstrument} onChangeText={setPressureInstrument} placeholder="pl. digitális manifold, bizonylat" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>A hűtőközeg azonosításának bizonyítéka</Text><TextInput style={styles.inputLarge} value={refrigerantEvidence} onChangeText={setRefrigerantEvidence} placeholder="adattábla / szervizdokumentum / analizátor" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          </>}

          <View style={styles.resultBox}>
            <ResultRow
              label="Telítési hőmérséklet – buborékpont"
              value={result?.outOfRange ? 'Tartományon kívül' : result?.bubble?.toFixed(1) ?? '—'}
              unit={!result?.outOfRange && result?.bubble != null ? '°C' : undefined}
              highlight={result?.outOfRange ? HVAC_YELLOW : result?.bubble != null ? HVAC_CYAN : undefined}
            />
            <ResultRow
              label="Telítési hőmérséklet – harmatpont"
              value={result?.outOfRange ? 'Tartományon kívül' : result?.dew?.toFixed(1) ?? '—'}
              unit={!result?.outOfRange && result?.dew != null ? '°C' : undefined}
              highlight={result?.outOfRange ? HVAC_YELLOW : result?.dew != null ? HVAC_CYAN : undefined}
            />
            <ResultRow label="Számításhoz használt abszolút nyomás" value={result ? result.absoluteBar.toFixed(4) : '—'} unit={result ? 'bar abs.' : undefined} />
          </View>

          <Text style={styles.noteText}>
            CoolProp 8.0.0 telítési adatok, 0,5 K-es táblából interpolálva. Túlhevítéshez harmatpontot, utóhűtéshez buborékpontot használj. A program a relatív nyomást előbb abszolút nyomásra alakítja.
          </Text>
          {result && !result.outOfRange && result.bubble != null && result.dew != null && <CalculationReportButton buildRecord={() => ({
            toolId: 'pt-table', toolTitle: 'Nyomás–hőmérséklet (PT)', language, jurisdiction,
            method: { id: ptQuality.methodId, version: ptQuality.methodVersion, name: 'Hűtőközeg telítési hőmérséklete', formulaSummary: 'Relatív nyomás abszolútra alakítása és lineáris interpoláció a 0,5 K felbontású CoolProp telítési táblában; keverékeknél külön buborék- és harmatpont.' },
            inputs: [
              { key: 'refrigerant', label: 'Hűtőközeg', value: refrigerant, origin: completeMode ? 'measured' : 'selected-typical' },
              { key: 'pressure', label: 'Mért nyomás', value: numeric(pressure), unit, origin: 'measured' },
              { key: 'pressureBasis', label: 'Nyomásalap', value: basis, origin: 'measured' },
              { key: 'atmosphericPressure', label: 'Légköri nyomás', value: basis === 'gauge' ? numeric(atmosphericBar) : null, unit: 'bar abs.', origin: basis === 'gauge' ? 'measured' : 'missing' },
              ...ptRequired.map(([key, value]) => ({ key, label: key, value: value || null, origin: value ? 'measured' as const : 'missing' as const })),
            ],
            outputs: [
              { key: 'absolutePressure', label: 'Abszolút nyomás', value: Number(result.absoluteBar.toFixed(5)), unit: 'bar abs.', origin: 'calculated' },
              { key: 'bubbleTemperature', label: 'Buborékpont', value: Number(result.bubble!.toFixed(2)), unit: '°C', origin: 'calculated' },
              { key: 'dewTemperature', label: 'Harmatpont', value: Number(result.dew!.toFixed(2)), unit: '°C', origin: 'calculated' },
            ],
            assumptions: ptQuality.assumedInputKeys, sources: ptQuality.sources, quality: ptQuality,
            complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
            requiredVerification: ['Hűtőközeg tényleges azonosítása', 'Nyomásmérő nullpontjának és kalibrálásának ellenőrzése'],
          })} />}
        </View>
      )}
    </View>
  );
}

// ─── 5. Túlhevítés / utóhűtés ────────────────────────────────────────────────

function TulhevitesUtohutes() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'SH' | 'SC'>('SH');
  const [refrigerant, setRefrigerant] = useState<RefrigerantId>('R32');
  const [pressure, setPressure] = useState('');
  const [pressureUnit, setPressureUnit] = useState<PtPressureUnit>('bar');
  const [pressureBasis, setPressureBasis] = useState<PressureBasis>('gauge');
  const [atmosphericBar, setAtmosphericBar] = useState('1,01325');
  const [pipeTemp, setPipeTemp] = useState('');
  const [pressureInstrument, setPressureInstrument] = useState('');
  const [temperatureInstrument, setTemperatureInstrument] = useState('');
  const [manufacturerTarget, setManufacturerTarget] = useState('');
  const [manufacturerReference, setManufacturerReference] = useState('');

  const REFRIGERANTS = Object.keys(PT_SATURATION_DATA) as RefrigerantId[];
  const PUNITS: PtPressureUnit[] = ['bar', 'kPa', 'MPa', 'psi'];

  const result = useMemo(() => {
    const p = numeric(pressure);
    const t = numeric(pipeTemp);
    const atm = numeric(atmosphericBar);
    if (!Number.isFinite(p) || p < 0 || !Number.isFinite(t) || !Number.isFinite(atm) || atm <= 0) return null;
    const absoluteBar = pressureToAbsoluteBar(p, pressureUnit, pressureBasis, atm);
    const tSatValue = saturationTemperature(refrigerant, absoluteBar, mode === 'SH' ? 'dew' : 'bubble');
    if (tSatValue == null) return { outOfRange: true };
    const tSat = tSatValue;
    const delta = mode === 'SH' ? t - tSat : tSat - t;

    let quality: string;
    let qualityColor: string;
    if (mode === 'SH') {
      if (delta < 0)       { quality = 'Nedves gőz – veszélyes!'; qualityColor = HVAC_RED; }
      else if (delta < 5)  { quality = 'Alacsony – ellenőrizendő'; qualityColor = HVAC_YELLOW; }
      else if (delta <= 12){ quality = 'Megfelelő'; qualityColor = HVAC_GREEN; }
      else                 { quality = 'Magas – ellenőrizendő'; qualityColor = HVAC_YELLOW; }
    } else {
      if (delta < 0)       { quality = 'Nincs utóhűtés'; qualityColor = HVAC_YELLOW; }
      else if (delta < 3)  { quality = 'Alacsony'; qualityColor = HVAC_YELLOW; }
      else if (delta <= 10){ quality = 'Megfelelő'; qualityColor = HVAC_GREEN; }
      else                 { quality = 'Magas – ellenőrizendő'; qualityColor = HVAC_YELLOW; }
    }

    return {
      outOfRange: false,
      tSat: tSat.toFixed(1),
      delta: delta.toFixed(1),
      quality,
      qualityColor,
    };
  }, [pressure, pressureUnit, pressureBasis, atmosphericBar, pipeTemp, refrigerant, mode]);

  const shscRequired: Array<readonly [string, string]> = completeMode ? [
    ['pressureInstrument', pressureInstrument], ['temperatureInstrument', temperatureInstrument],
    ['manufacturerTarget', manufacturerTarget], ['manufacturerReference', manufacturerReference],
  ] as const : [];
  const shscMissing = shscRequired.filter(([, value]) => !value.trim()).map(([key]) => key);
  const shscQuality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'superheat-subcool-from-pt', methodVersion: '2.0.0',
    requiredInputCount: completeMode ? 9 : 5, suppliedRequiredInputCount: completeMode ? 9 - shscMissing.length : 5,
    assumedInputKeys: completeMode ? [] : ['genericTargetRange', 'instrumentAccuracyNotDocumented'], missingRequiredInputKeys: shscMissing,
    sources: [
      { kind: 'engineering-reference', title: 'CoolProp 8.0.0 telítési tulajdonságadatok' },
      ...(manufacturerReference ? [{ kind: 'manufacturer' as const, title: manufacturerReference }] : []),
    ], verificationRequired: 'manufacturer-document',
    manufacturerProductConfirmed: completeMode && !!manufacturerReference, manufacturerRangeConfirmed: completeMode && !!manufacturerTarget,
  });

  const modeLabel = mode === 'SH' ? 'Túlhevítés' : 'Utóhűtés';
  const pipeTempLabel = mode === 'SH' ? 'Szívócső hőmérséklete (°C)' : 'Folyékonyvezeték hőmérséklete (°C)';
  const pipeTempPlaceholder = mode === 'SH' ? 'pl. 15' : 'pl. 30';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Túlhevítés/utóhűtés toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Thermometer size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Túlhevítés / utóhűtés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Mode toggle */}
          <View style={[styles.segmentRow, { flexWrap: 'wrap' }]}>
            {(['SH', 'SC'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] SH/SC mode:', m); setMode(m); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                  {m === 'SH' ? 'Túlhevítés (SH)' : 'Utóhűtés (SC)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Refrigerant */}
          <Text style={styles.label}>Hűtőközeg</Text>
          <View style={styles.segmentRow}>
            {REFRIGERANTS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.segmentBtn, refrigerant === r && styles.segmentBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] SH/SC refrigerant:', r); setRefrigerant(r); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, refrigerant === r && styles.segmentTextActive]}>{REFRIGERANT_LABELS[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>A műszer nyomásalapja</Text>
          <View style={styles.segmentRow}>
            {([['gauge', 'Relatív / manométeres'], ['absolute', 'Abszolút']] as const).map(([value, label]) => <TouchableOpacity key={value} style={[styles.segmentBtn, pressureBasis === value && styles.segmentBtnActive]} onPress={() => setPressureBasis(value)} activeOpacity={0.7}><Text style={[styles.segmentText, pressureBasis === value && styles.segmentTextActive]}>{label}</Text></TouchableOpacity>)}
          </View>

          {/* Pressure unit */}
          <Text style={styles.label}>Nyomásegység</Text>
          <View style={styles.unitRow}>
            {PUNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, pressureUnit === u && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] SH/SC pressure unit:', u); setPressureUnit(u); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, pressureUnit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pressure input */}
          <Text style={styles.label}>
            {mode === 'SH' ? 'Szívónyomás' : 'Kondenzációs nyomás'} ({pressureUnit})
          </Text>
          <TextInput
            style={styles.inputLarge}
            value={pressure}
            onChangeText={v => { console.log('[Hűtéstechnika] SH/SC nyomás input:', v); setPressure(v); }}
            keyboardType="numeric"
            placeholder={pressureUnit === 'bar' ? 'pl. 8,5' : pressureUnit === 'kPa' ? 'pl. 850' : pressureUnit === 'MPa' ? 'pl. 0,85' : 'pl. 123'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {completeMode && <>
            <Text style={styles.label}>Nyomásmérő azonosító / kalibrálás</Text><TextInput style={styles.inputLarge} value={pressureInstrument} onChangeText={setPressureInstrument} placeholder="műszer és bizonylat" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Csőhőmérő azonosító / kalibrálás</Text><TextInput style={styles.inputLarge} value={temperatureInstrument} onChangeText={setTemperatureInstrument} placeholder="műszer és bizonylat" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Gyártói célérték vagy céltartomány (K)</Text><TextInput style={styles.inputLarge} value={manufacturerTarget} onChangeText={setManufacturerTarget} placeholder="pl. 6–10 K" placeholderTextColor={HVAC_TEXT_SECONDARY} />
            <Text style={styles.label}>Gyártói dokumentum / modell / üzemállapot</Text><TextInput style={styles.inputLarge} value={manufacturerReference} onChangeText={setManufacturerReference} placeholder="dokumentum és táblázati pont" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          </>}

          {pressureBasis === 'gauge' && <><Text style={styles.label}>Helyi légköri nyomás (bar abs.)</Text><TextInput style={styles.inputLarge} value={atmosphericBar} onChangeText={setAtmosphericBar} keyboardType="numeric" placeholder="1,01325" placeholderTextColor={HVAC_TEXT_SECONDARY} /></>}

          {/* Pipe temp input */}
          <Text style={styles.label}>{pipeTempLabel}</Text>
          <TextInput
            style={styles.inputLarge}
            value={pipeTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] SH/SC cső hőmérséklet input:', v); setPipeTemp(v); }}
            keyboardType="numeric"
            placeholder={pipeTempPlaceholder}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Result box */}
          <View style={styles.resultBox}>
            <ResultRow
              label="Telítési hőmérséklet"
              value={result?.outOfRange ? 'Tartományon kívül' : (result?.tSat ?? '—')}
              unit={(!result?.outOfRange && result?.tSat) ? '°C' : undefined}
              highlight={result?.outOfRange ? HVAC_YELLOW : undefined}
            />
            <ResultRow
              label={modeLabel}
              value={result?.outOfRange ? '—' : (result?.delta ?? '—')}
              unit={(!result?.outOfRange && result?.delta) ? 'K' : undefined}
              highlight={result?.outOfRange ? undefined : result?.qualityColor}
            />
            <ResultRow
              label="Értékelés"
              value={result?.outOfRange ? '—' : (result?.quality ?? '—')}
              highlight={result?.outOfRange ? undefined : result?.qualityColor}
            />
          </View>

          <Text style={styles.noteText}>
            {mode === 'SH'
              ? 'SH = szívócső hőmérséklete − harmatpont. Az 5–12 K csak általános iránytartomány; a gyártó adott üzemállapotra előírt célértéke az elsődleges.'
              : 'SC = buborékpont − folyadékcső hőmérséklete. A 3–10 K csak általános iránytartomány; a gyártó adott üzemállapotra előírt célértéke az elsődleges.'}
          </Text>
          {result && !result.outOfRange && result.tSat && result.delta && <CalculationReportButton buildRecord={() => ({
            toolId: 'superheat-subcool', toolTitle: modeLabel, language, jurisdiction,
            method: { id: shscQuality.methodId, version: shscQuality.methodVersion, name: mode === 'SH' ? 'Túlhevítés meghatározása' : 'Utóhűtés meghatározása', formulaSummary: mode === 'SH' ? 'SH = mért szívócső-hőmérséklet − nyomásból számolt harmatpont.' : 'SC = nyomásból számolt buborékpont − mért folyadékcső-hőmérséklet.' },
            inputs: [
              { key: 'refrigerant', label: 'Hűtőközeg', value: refrigerant, origin: completeMode ? 'measured' : 'selected-typical' },
              { key: 'pressure', label: mode === 'SH' ? 'Szívónyomás' : 'Kondenzációs nyomás', value: numeric(pressure), unit: pressureUnit, origin: 'measured' },
              { key: 'pressureBasis', label: 'Nyomásalap', value: pressureBasis, origin: 'measured' },
              { key: 'atmosphericPressure', label: 'Légköri nyomás', value: numeric(atmosphericBar), unit: 'bar abs.', origin: 'measured' },
              { key: 'pipeTemperature', label: pipeTempLabel, value: numeric(pipeTemp), unit: '°C', origin: 'measured' },
              ...shscRequired.map(([key, value]) => ({ key, label: key, value: value || null, origin: key.startsWith('manufacturer') && value ? 'manufacturer' as const : value ? 'measured' as const : 'missing' as const })),
            ],
            outputs: [
              { key: 'saturationTemperature', label: 'Telítési hőmérséklet', value: Number(result.tSat), unit: '°C', origin: 'calculated' },
              { key: 'delta', label: modeLabel, value: Number(result.delta), unit: 'K', origin: 'calculated' },
              { key: 'assessment', label: 'Értékelés', value: completeMode && manufacturerTarget ? `A gyártói ${manufacturerTarget} K tartományhoz ellenőrizendő` : result.quality ?? null, origin: 'calculated' },
            ],
            assumptions: shscQuality.assumedInputKeys, sources: shscQuality.sources, quality: shscQuality,
            complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
            requiredVerification: ['Stabil üzemállapot igazolása', 'Mérési pontok megfelelő rögzítése és hőszigetelése', 'Gyártói célérték összevetése az aktuális terhelési állapottal'],
          })} />}
        </View>
      )}
    </View>
  );
}

// ─── 6. Hűtőkör gyors ellenőrzés ─────────────────────────────────────────────

function HutokörGyorsEllenorzes() {
  const [open, setOpen] = useState(true);
  const [shInput, setShInput] = useState('');
  const [scInput, setScInput] = useState('');

  const result = useMemo(() => {
    const sh = parseFloat(shInput);
    const sc = parseFloat(scInput);
    const hasSH = !isNaN(sh);
    const hasSC = !isNaN(sc);
    if (!hasSH && !hasSC) return null;

    // Classify SH
    const shLow  = hasSH && sh < 5;
    const shOk   = hasSH && sh >= 5 && sh <= 12;
    const shHigh = hasSH && sh > 12;

    // Classify SC
    const scLow  = hasSC && sc < 3;
    const scOk   = hasSC && sc >= 3 && sc <= 10;
    const scHigh = hasSC && sc > 10;

    let diagnosis: string;
    let color: string;

    if (hasSH && hasSC) {
      if (shHigh && scLow)       { diagnosis = 'Valószínű alultöltés'; color = HVAC_RED; }
      else if (shLow && scHigh)  { diagnosis = 'Valószínű túltöltés'; color = HVAC_RED; }
      else if (shLow && scLow)   { diagnosis = 'Expanziós / adagoló probléma'; color = HVAC_YELLOW; }
      else if (shHigh && scHigh) { diagnosis = 'Légáram vagy hőleadás probléma'; color = HVAC_YELLOW; }
      else if (shOk && scOk)     { diagnosis = 'Nagyjából rendben'; color = HVAC_GREEN; }
      else if (shOk && scLow)    { diagnosis = 'SC alacsony – ellenőrizendő'; color = HVAC_YELLOW; }
      else if (shOk && scHigh)   { diagnosis = 'SC magas – ellenőrizendő'; color = HVAC_YELLOW; }
      else if (shLow && scOk)    { diagnosis = 'SH alacsony – nedves gőz kockázat'; color = HVAC_YELLOW; }
      else if (shHigh && scOk)   { diagnosis = 'SH magas – ellenőrizendő'; color = HVAC_YELLOW; }
      else                       { diagnosis = 'Ellenőrizendő'; color = HVAC_YELLOW; }
    } else if (hasSH) {
      if (sh < 0)       { diagnosis = 'Nedves gőz – veszélyes!'; color = HVAC_RED; }
      else if (shLow)   { diagnosis = 'SH alacsony – nedves gőz kockázat'; color = HVAC_YELLOW; }
      else if (shOk)    { diagnosis = 'SH megfelelő'; color = HVAC_GREEN; }
      else              { diagnosis = 'SH magas – ellenőrizendő'; color = HVAC_YELLOW; }
    } else {
      if (scLow)        { diagnosis = 'SC alacsony – ellenőrizendő'; color = HVAC_YELLOW; }
      else if (scOk)    { diagnosis = 'SC megfelelő'; color = HVAC_GREEN; }
      else              { diagnosis = 'SC magas – ellenőrizendő'; color = HVAC_YELLOW; }
    }

    return {
      sh: hasSH ? sh.toFixed(1) : null,
      sc: hasSC ? sc.toFixed(1) : null,
      diagnosis,
      color,
    };
  }, [shInput, scInput]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Hűtőkör gyors ellenőrzés toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Activity size={20} color={HVAC_RED} />
          <Text style={styles.cardTitle}>Hűtőkör gyors ellenőrzés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Túlhevítés – SH (K) – opcionális</Text>
          <TextInput
            style={styles.inputLarge}
            value={shInput}
            onChangeText={v => { console.log('[Hűtéstechnika] SH input:', v); setShInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 8"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Utóhűtés – SC (K) – opcionális</Text>
          <TextInput
            style={styles.inputLarge}
            value={scInput}
            onChangeText={v => { console.log('[Hűtéstechnika] SC input:', v); setScInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="SH" value={result?.sh ?? '—'} unit={result?.sh ? 'K' : undefined} />
            <ResultRow label="SC" value={result?.sc ?? '—'} unit={result?.sc ? 'K' : undefined} />
            <ResultRow label="Diagnózis" value={result?.diagnosis ?? '—'} highlight={result?.color} />
          </View>

          <Text style={styles.noteText}>
            Az SH és SC kombinációján alapuló becslés. Pontos értékeléshez PT táblával mérd meg mindkét értéket.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Méretezés section ────────────────────────────────────────────────────────

const STANDARD_COOLING_CLASSES = [2.5, 3.5, 5.0, 7.1, 10.0, 12.5, 14.0];

function recommendedClass(kW: number): string {
  const match = STANDARD_COOLING_CLASSES.find(c => c >= kW);
  return match ? `${match} kW` : `>${STANDARD_COOLING_CLASSES[STANDARD_COOLING_CLASSES.length - 1]} kW – több egység`;
}

function SplitGyorsmerezezo() {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState('');
  const [height, setHeight] = useState('');
  const [orientation, setOrientation] = useState<'Észak' | 'Kelet' | 'Dél' | 'Nyugat'>('Dél');
  const [insulation, setInsulation] = useState<'Gyenge' | 'Közepes' | 'Jó'>('Közepes');

  const result = useMemo(() => {
    const a = parseFloat(area);
    if (isNaN(a) || a <= 0) return null;
    const h = parseFloat(height);
    const heightFactor = (!isNaN(h) && h > 2.7) ? 1 + Math.round((h - 2.7) / 0.1) * 0.05 : 1.0;
    const orientMult: Record<string, number> = { 'Észak': 0.90, 'Kelet': 1.00, 'Dél': 1.15, 'Nyugat': 1.10 };
    const insMult: Record<string, number> = { 'Gyenge': 1.20, 'Közepes': 1.00, 'Jó': 0.85 };
    const kW = (a * 70 * heightFactor * orientMult[orientation] * insMult[insulation]) / 1000;
    const btu = kW * 3412.14;
    return { kW: kW.toFixed(2), btu: Math.round(btu).toLocaleString('hu-HU') };
  }, [area, height, orientation, insulation]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Split gyorsméretező toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Ruler size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Split gyorsméretező</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Helyiség alapterülete (m²)</Text>
          <TextInput
            style={styles.inputLarge}
            value={area}
            onChangeText={v => { console.log('[Hűtéstechnika] Split gyorsméretező alapterület:', v); setArea(v); }}
            keyboardType="numeric"
            placeholder="pl. 25"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Belmagasság (m) – opcionális</Text>
          <TextInput
            style={styles.inputLarge}
            value={height}
            onChangeText={v => { console.log('[Hűtéstechnika] Split gyorsméretező belmagasság:', v); setHeight(v); }}
            keyboardType="numeric"
            placeholder="pl. 2.7"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Tájolás</Text>
          <View style={styles.unitRow}>
            {(['Észak', 'Kelet', 'Dél', 'Nyugat'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.unitBtn, orientation === d && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] Split gyorsméretező tájolás:', d); setOrientation(d); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, orientation === d && styles.unitBtnTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Szigetelés minősége</Text>
          <View style={styles.unitRow}>
            {(['Gyenge', 'Közepes', 'Jó'] as const).map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.unitBtn, insulation === q && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] Split gyorsméretező szigetelés:', q); setInsulation(q); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, insulation === q && styles.unitBtnTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.resultBox}>
            <ResultRow label="Becsült igény" value={result?.kW ?? '—'} unit={result ? 'kW' : undefined} highlight={result ? HVAC_CYAN : undefined} />
            <ResultRow label="Egyenérték BTU/h" value={result?.btu ?? '—'} unit={result ? 'BTU/h' : undefined} />
            <ResultRow
              label="Javasolt méretosztály"
              value={result ? recommendedClass(parseFloat(result.kW)) : '—'}
              highlight={result ? HVAC_BLUE : undefined}
            />
          </View>

          <Text style={styles.noteText}>
            70 W/m² alapú becslés, tájolás és szigetelés korrekcióval. Pontos méretezéshez hőveszteség-számítás szükséges.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Room type for DuctedSplitValaszto ───────────────────────────────────────
type DuctedRoom = {
  id: string;
  name: string;
  length: string;
  width: string;
  height: string;
  orientation: 'Észak' | 'Kelet' | 'Dél' | 'Nyugat';
  insulation: 'Gyenge' | 'Közepes' | 'Jó';
  windowSize: 'Kicsi' | 'Közepes' | 'Nagy';
};

const ORIENT_MULT: Record<string, number> = { 'Észak': 0.90, 'Kelet': 1.00, 'Dél': 1.15, 'Nyugat': 1.10 };
const INS_MULT: Record<string, number>    = { 'Gyenge': 1.20, 'Közepes': 1.00, 'Jó': 0.85 };
const WIN_MULT: Record<string, number>    = { 'Kicsi': 0.95, 'Közepes': 1.00, 'Nagy': 1.10 };

function calcRoomDemand(room: DuctedRoom): number | null {
  const l = parseFloat(room.length);
  const w = parseFloat(room.width);
  if (isNaN(l) || l <= 0 || isNaN(w) || w <= 0) return null;
  const area = l * w;
  const h = parseFloat(room.height);
  const heightFactor = (!isNaN(h) && h > 2.7) ? 1 + Math.round((h - 2.7) / 0.1) * 0.05 : 1.0;
  return (area * 70 * heightFactor * ORIENT_MULT[room.orientation] * INS_MULT[room.insulation] * WIN_MULT[room.windowSize]) / 1000;
}

function DuctedSplitValaszto() {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<DuctedRoom[]>([]);

  function addRoom() {
    const id = Date.now().toString();
    setRooms(prev => [...prev, {
      id,
      name: `${prev.length + 1}. helyiség`,
      length: '',
      width: '',
      height: '',
      orientation: 'Dél',
      insulation: 'Közepes',
      windowSize: 'Közepes',
    }]);
    console.log('[Hűtéstechnika] Ducted split – új helyiség hozzáadva, id:', id);
  }

  function updateRoom(id: string, field: keyof DuctedRoom, value: string) {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    console.log('[Hűtéstechnika] Ducted split – helyiség frissítve, id:', id, 'mező:', field);
  }

  function deleteRoom(id: string) {
    setRooms(prev => prev.filter(r => r.id !== id));
    console.log('[Hűtéstechnika] Ducted split – helyiség törölve, id:', id);
  }

  const summary = useMemo(() => {
    if (rooms.length === 0) return null;
    let total = 0;
    let anyValid = false;
    for (const room of rooms) {
      const d = calcRoomDemand(room);
      if (d !== null) { total += d; anyValid = true; }
    }
    if (!anyValid) return null;
    return {
      kW: total.toFixed(2),
      btu: Math.round(total * 3412.14).toLocaleString('hu-HU'),
    };
  }, [rooms]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Ducted split választó toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Wind size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>Ducted split választó</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Room count summary */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.label, { marginBottom: 0 }]}>
              {rooms.length === 0 ? 'Még nincs helyiség' : `${rooms.length} helyiség`}
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: HVAC_BLUE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
              onPress={addRoom}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Helyiség</Text>
            </TouchableOpacity>
          </View>

          {/* Room cards */}
          {rooms.map((room, idx) => (
            <View
              key={room.id}
              style={{ backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER, borderRadius: 14, padding: 14, marginBottom: 10 }}
            >
              {/* Room header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: HVAC_TEXT }}>{room.name || `${idx + 1}. helyiség`}</Text>
                <TouchableOpacity onPress={() => deleteRoom(room.id)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={15} color={HVAC_RED} />
                </TouchableOpacity>
              </View>

              {/* Room name */}
              <Text style={styles.label}>Helyiség neve</Text>
              <TextInput
                style={[styles.inputLarge, { fontSize: 15, padding: 12, marginBottom: 10 }]}
                value={room.name}
                onChangeText={v => updateRoom(room.id, 'name', v)}
                placeholder="pl. Nappali"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />

              {/* Dimensions row */}
              <Text style={styles.label}>Méretek (m)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { fontSize: 11 }]}>Hossz</Text>
                  <TextInput
                    style={[styles.inputLarge, { fontSize: 15, padding: 12, marginBottom: 0 }]}
                    value={room.length}
                    onChangeText={v => updateRoom(room.id, 'length', v)}
                    keyboardType="numeric"
                    placeholder="pl. 5"
                    placeholderTextColor={HVAC_TEXT_SECONDARY}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { fontSize: 11 }]}>Szélesség</Text>
                  <TextInput
                    style={[styles.inputLarge, { fontSize: 15, padding: 12, marginBottom: 0 }]}
                    value={room.width}
                    onChangeText={v => updateRoom(room.id, 'width', v)}
                    keyboardType="numeric"
                    placeholder="pl. 4"
                    placeholderTextColor={HVAC_TEXT_SECONDARY}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { fontSize: 11 }]}>Magasság</Text>
                  <TextInput
                    style={[styles.inputLarge, { fontSize: 15, padding: 12, marginBottom: 0 }]}
                    value={room.height}
                    onChangeText={v => updateRoom(room.id, 'height', v)}
                    keyboardType="numeric"
                    placeholder="pl. 2.7"
                    placeholderTextColor={HVAC_TEXT_SECONDARY}
                  />
                </View>
              </View>

              {/* Orientation */}
              <Text style={styles.label}>Tájolás</Text>
              <View style={[styles.unitRow, { marginBottom: 10 }]}>
                {(['Észak', 'Kelet', 'Dél', 'Nyugat'] as const).map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[styles.unitBtn, room.orientation === o && styles.unitBtnActive]}
                    onPress={() => updateRoom(room.id, 'orientation', o)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitBtnText, room.orientation === o && styles.unitBtnTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Insulation */}
              <Text style={styles.label}>Szigetelés</Text>
              <View style={[styles.unitRow, { marginBottom: 10 }]}>
                {(['Gyenge', 'Közepes', 'Jó'] as const).map(q => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.unitBtn, room.insulation === q && styles.unitBtnActive]}
                    onPress={() => updateRoom(room.id, 'insulation', q)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitBtnText, room.insulation === q && styles.unitBtnTextActive]}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Window size */}
              <Text style={styles.label}>Ablakfelület</Text>
              <View style={[styles.unitRow, { marginBottom: 0 }]}>
                {(['Kicsi', 'Közepes', 'Nagy'] as const).map(w => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.unitBtn, room.windowSize === w && styles.unitBtnActive]}
                    onPress={() => updateRoom(room.id, 'windowSize', w)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitBtnText, room.windowSize === w && styles.unitBtnTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {(() => {
                const d = calcRoomDemand(room);
                return d !== null ? (
                  <Text style={{ fontSize: 12, color: HVAC_CYAN, marginTop: 8, fontWeight: '600' }}>
                    Becsült igény: {d.toFixed(2)} kW
                  </Text>
                ) : null;
              })()}
            </View>
          ))}

          {/* Summary placeholder */}
          {rooms.length > 0 && (
            <View style={styles.resultBox}>
              <ResultRow label="Helyiségek száma" value={`${rooms.length}`} unit="db" />
              <ResultRow
                label="Összesített igény"
                value={summary?.kW ?? '—'}
                unit={summary ? 'kW' : undefined}
                highlight={summary ? HVAC_CYAN : undefined}
              />
              <ResultRow
                label="Egyenérték BTU/h"
                value={summary?.btu ?? '—'}
                unit={summary ? 'BTU/h' : undefined}
              />
              <ResultRow
                label="Javasolt méretosztály"
                value={summary ? recommendedClass(parseFloat(summary.kW)) : '—'}
                highlight={summary ? HVAC_BLUE : undefined}
              />
            </View>
          )}

          <Text style={styles.noteText}>
            {rooms.length === 0
              ? 'Adj hozzá helyiségeket a méretezéshez.'
              : 'Az összesített igény alapján javasolt méretosztály jelenik meg.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function FanCoilMerezezo() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'cooling' | 'heating'>('cooling');
  const [demand, setDemand] = useState('');
  const [waterTemp, setWaterTemp] = useState<'7/12°C' | '6/12°C' | '45/40°C' | '55/45°C'>('7/12°C');

  const COOLING_TEMPS: Array<'7/12°C' | '6/12°C'> = ['7/12°C', '6/12°C'];
  const HEATING_TEMPS: Array<'45/40°C' | '55/45°C'> = ['45/40°C', '55/45°C'];

  // Reset water temp when mode changes
  const handleModeChange = (m: 'cooling' | 'heating') => {
    setMode(m);
    setWaterTemp(m === 'cooling' ? '7/12°C' : '45/40°C');
    console.log('[Hűtéstechnika] Fan-coil mód:', m);
  };

  const result = useMemo(() => {
    const d = parseFloat(demand);
    if (isNaN(d) || d <= 0) return null;

    const derating: Record<string, number> = {
      '7/12°C': 1.00, '6/12°C': 1.05,
      '45/40°C': 1.00, '55/45°C': 1.20,
    };
    const adjusted = d / derating[waterTemp];

    let category: string;
    let color: string;
    if (adjusted <= 1.5)      { category = 'Kis méret (FCU-S)';      color = HVAC_GREEN; }
    else if (adjusted <= 3.0) { category = 'Közepes méret (FCU-M)';  color = HVAC_GREEN; }
    else if (adjusted <= 5.0) { category = 'Nagy méret (FCU-L)';     color = HVAC_BLUE; }
    else if (adjusted <= 8.0) { category = 'Extra nagy (FCU-XL)';    color = HVAC_YELLOW; }
    else                      { category = 'Több egység javasolt';    color = HVAC_RED; }

    return {
      adjusted: adjusted.toFixed(2),
      category,
      color,
    };
  }, [demand, waterTemp]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Hűtéstechnika] Fan-coil méretező toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Layers size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Fan-coil méretező</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Mode toggle */}
          <View style={styles.segmentRow}>
            {(['cooling', 'heating'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                onPress={() => handleModeChange(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                  {m === 'cooling' ? 'Hűtés' : 'Fűtés'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Demand input */}
          <Text style={styles.label}>
            {mode === 'cooling' ? 'Hűtési igény (kW)' : 'Fűtési igény (kW)'}
          </Text>
          <TextInput
            style={styles.inputLarge}
            value={demand}
            onChangeText={v => { console.log('[Hűtéstechnika] Fan-coil igény input:', v); setDemand(v); }}
            keyboardType="numeric"
            placeholder="pl. 3.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Water temperature */}
          <Text style={styles.label}>Vízoldali hőmérséklet</Text>
          <View style={styles.unitRow}>
            {(mode === 'cooling' ? COOLING_TEMPS : HEATING_TEMPS).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.unitBtn, waterTemp === t && styles.unitBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] Fan-coil vízhőmérséklet:', t); setWaterTemp(t); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitBtnText, waterTemp === t && styles.unitBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Result */}
          <View style={styles.resultBox}>
            <ResultRow
              label="Korrigált névleges igény"
              value={result?.adjusted ?? '—'}
              unit={result ? 'kW' : undefined}
            />
            <ResultRow
              label="Javasolt méretkategória"
              value={result?.category ?? '—'}
              highlight={result?.color}
            />
          </View>

          <Text style={styles.noteText}>
            A korrigált igény a vízoldali hőmérséklet eltérése miatt különbözhet a megadott értéktől. Pontos kiválasztáshoz gyártói teljesítménytáblázat szükséges.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HutestechnikaScreen() {
  const router = useRouter();
  const { tool } = useLocalSearchParams<{ tool?: string }>();

  const backBtn = {
    position: 'absolute' as const,
    top: 20,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <TouchableOpacity
          style={backBtn}
          onPress={() => router.push('/(tabs)/(home)')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Home size={22} color="#60A5FA" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>{tool ? 'Hűtőkör számítás' : 'Hűtéstechnika'}</Text>

        {tool === 'pt-table' && <><ToolGuide title="Nyomás–hőmérséklet (PT)" useWhen="A mért hűtőközeg-nyomáshoz tartozó telítési hőmérsékletet keresed." needs="Válaszd ki a hűtőközeget, a műszer nyomásegységét és azt, hogy relatív/manométeres vagy abszolút értéket mutat; majd írd be a nyomást." accuracy="engineering" accuracyNote="CoolProp 8.0.0 telítési adatok 0,5 K-es táblából interpolálva, keverékeknél külön buborék- és harmatponttal, extrapoláció nélkül." /><PtTabla /></>}
        {tool === 'superheat-subcool' && <><ToolGuide title="Túlhevítés és utóhűtés" useWhen="A hűtőkör állapotát a nyomásból számolt telítési hőmérséklet és a csövön mért hőmérséklet különbségével ellenőrzöd." needs="Hűtőközeg, szívó- vagy folyadékoldali nyomás és ugyanazon ponton helyesen mért csőhőmérséklet." accuracy="engineering" /><TulhevitesUtohutes /></>}
        {tool === 'pressure-test' && <><ToolGuide title="Nyomáspróba hőmérséklet-korrekció" useWhen="Meg akarod tudni, hogy a kezdő nyomásnak a megváltozott hőmérsékleten elméletileg mekkorának kell lennie, majd ezt összehasonlítanád a műszerrel." needs="Kezdő relatív nyomás, kezdő és jelenlegi hőmérséklet. A tényleges végnyomás csak az összehasonlításhoz kell; az eltelt idő nem része a képletnek." accuracy="engineering" accuracyNote="Abszolút nyomással és Kelvinben végzett ideálisgáz-korrekció. A mérési eltérés külön, általad beállítható; nem önkényes szivárgási határ." /><Nyomaspróba /></>}
        {tool === 'split-sizing' && <><ToolGuide title="Mekkora klímaberendezés kell?" useWhen="Egy helyiség hűtési hőterhelését szeretnéd tételesen előméretezni, nem egyszerű W/m² ökölszabállyal." needs="Alapterület, belmagasság, fal és szigetelés, szint/tető, ablak típusa és mérete, tájolás, árnyékolás, létszám és gépterhelés." accuracy="engineering-estimate" accuracyNote="Elfogadott hőtechnikai összefüggésekből készülő tételes előméretezés. Pontos rétegrend és órás meteorológiai adatok nélkül nem teljes tervezői hűtésterhelés-számítás." /><HeatLoadWizard /></>}

        {!tool && <>
        <TeljesitmenyAtvalto /><CopEer /><Nyomaspróba /><PtTabla /><TulhevitesUtohutes /><HutokörGyorsEllenorzes />

        {/* Méretezés section */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: HVAC_TEXT, marginTop: 16, marginBottom: 12, letterSpacing: -0.2 }}>
          Méretezés
        </Text>
        <SplitGyorsmerezezo />
        <DuctedSplitValaszto />
        <FanCoilMerezezo />
        </>}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: HVAC_BG },
  container: { flex: 1, backgroundColor: HVAC_BG },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: HVAC_TEXT, marginBottom: 20, letterSpacing: -0.3 },
  card: { backgroundColor: HVAC_CARD, borderWidth: 1, borderColor: HVAC_BORDER, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: HVAC_TEXT },
  cardBody: { paddingHorizontal: 16, paddingBottom: 20 },
  label: { fontSize: 13, color: HVAC_TEXT_SECONDARY, marginBottom: 6 },
  inputLarge: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 12,
    padding: 16,
    color: HVAC_TEXT,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER },
  unitBtnActive: { backgroundColor: HVAC_BLUE, borderColor: HVAC_BLUE },
  unitBtnText: { fontSize: 13, fontWeight: '600', color: HVAC_TEXT_SECONDARY },
  unitBtnTextActive: { color: '#FFFFFF' },
  segmentRow: { flexDirection: 'row', backgroundColor: HVAC_SURFACE, borderRadius: 12, padding: 4, marginBottom: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: HVAC_BLUE },
  segmentText: { fontSize: 14, fontWeight: '600', color: HVAC_TEXT_SECONDARY },
  segmentTextActive: { color: '#FFFFFF' },
  resultBox: { backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER, borderRadius: 16, padding: 16, gap: 12, marginTop: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 14, color: HVAC_TEXT_SECONDARY, flex: 1 },
  resultValue: { fontSize: 20, fontWeight: '700', color: HVAC_TEXT },
  resultUnit: { fontSize: 13, color: HVAC_TEXT_SECONDARY },
  noteText: { fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 19, marginTop: 12, marginBottom: 0 },
});
