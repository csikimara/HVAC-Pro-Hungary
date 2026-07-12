import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Zap, Gauge, FlaskConical, Table2, Thermometer, Activity, Ruler, Wind, Layers, Plus, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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
  const [open, setOpen] = useState(true);
  const [unit, setUnit] = useState<'bar' | 'kPa' | 'Pa'>('bar');
  const [startP, setStartP] = useState('');
  const [endP, setEndP] = useState('');
  const [duration, setDuration] = useState('');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');

  const UNITS: Array<'bar' | 'kPa' | 'Pa'> = ['bar', 'kPa', 'Pa'];

  const result = useMemo(() => {
    const p1g = parseFloat(startP);
    const p2g = parseFloat(endP);
    const T1c = parseFloat(t1);
    const T2c = parseFloat(t2);
    if (isNaN(p1g) || isNaN(p2g) || isNaN(T1c) || isNaN(T2c)) return null;

    // atmospheric offset in the current unit
    const atm = unit === 'bar' ? 1 : unit === 'kPa' ? 100 : 100000;

    const p1abs = p1g + atm;
    const p2abs = p2g + atm;
    const T1K = T1c + 273.15;
    const T2K = T2c + 273.15;

    const p2TheoAbs = p1abs * (T2K / T1K);
    const p2TheoGauge = p2TheoAbs - atm;
    const deltaP = p2TheoGauge - p2g;

    // Format helpers
    const fmt = (v: number) =>
      unit === 'bar' ? v.toFixed(3) : unit === 'kPa' ? v.toFixed(1) : Math.round(v).toString();

    return {
      p2Theo: fmt(p2TheoGauge),
      deltaP: fmt(deltaP),
      deltaPRaw: deltaP,
    };
  }, [startP, endP, t1, t2, unit]);

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

          <Text style={styles.label}>Végnyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={endP}
            onChangeText={v => { console.log('[Hűtéstechnika] Végnyomás input:', v); setEndP(v); }}
            keyboardType="numeric"
            placeholder="pl. 39.8"
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

          <Text style={styles.label}>Eltelt idő (perc) – opcionális</Text>
          <TextInput
            style={styles.inputLarge}
            value={duration}
            onChangeText={v => { console.log('[Hűtéstechnika] Eltelt idő input:', v); setDuration(v); }}
            keyboardType="numeric"
            placeholder="pl. 30"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="Elméleti végnyomás (hőm.-korr.)" value={result?.p2Theo ?? '—'} unit={result ? unit : undefined} />
            <ResultRow label="Eltérés (elméleti – mért)" value={result?.deltaP ?? '—'} unit={result ? unit : undefined} highlight={result ? (Math.abs(result.deltaPRaw) < (unit === 'bar' ? 0.05 : unit === 'kPa' ? 5 : 5000) ? HVAC_GREEN : HVAC_YELLOW) : undefined} />
          </View>

          <Text style={styles.noteText}>
            Csak hőmérséklet-korrigált ellenőrzés, nem minősül hivatalos nyomáspróbának.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 4. PT tábla ──────────────────────────────────────────────────────────────

// ─── PT data: [pressure_bar, temp_°C] saturation points ──────────────────────
const PT_DATA: Record<string, [number, number][]> = {
  R32: [
    [1.65, -40], [2.09, -35], [2.62, -30], [3.25, -25], [3.99, -20],
    [4.86, -15], [5.87, -10], [7.03, -5],  [8.36, 0],   [9.87, 5],
    [11.58, 10], [13.50, 15], [15.65, 20], [18.05, 25], [20.72, 30],
    [23.68, 35], [26.95, 40], [30.55, 45], [34.51, 50],
  ],
  R410A: [
    [2.48, -40], [3.10, -35], [3.84, -30], [4.72, -25], [5.75, -20],
    [6.95, -15], [8.33, -10], [9.92, -5],  [11.73, 0],  [13.78, 5],
    [16.09, 10], [18.68, 15], [21.58, 20], [24.81, 25], [28.40, 30],
    [32.37, 35], [36.76, 40], [41.60, 45], [46.93, 50],
  ],
  R134a: [
    [0.51, -40], [0.66, -35], [0.84, -30], [1.06, -25], [1.33, -20],
    [1.65, -15], [2.01, -10], [2.43, -5],  [2.93, 0],   [3.50, 5],
    [4.15, 10],  [4.89, 15],  [5.72, 20],  [6.65, 25],  [7.70, 30],
    [8.87, 35],  [10.17, 40], [11.60, 45], [13.18, 50],
  ],
};

// Unit conversion to bar
function toBar(val: number, unit: string): number {
  if (unit === 'bar')  return val;
  if (unit === 'kPa')  return val / 100;
  if (unit === 'Pa')   return val / 100000;
  if (unit === 'psig') return val * 0.0689476 + 1.01325; // gauge to absolute bar
  return val;
}

function interpolatePT(table: [number, number][], pBar: number): { temp: string; exact: boolean; outOfRange: boolean } {
  if (pBar <= 0) return { temp: '', exact: false, outOfRange: true };
  const min = table[0][0];
  const max = table[table.length - 1][0];
  if (pBar < min || pBar > max) return { temp: '', exact: false, outOfRange: true };

  for (let i = 0; i < table.length; i++) {
    if (Math.abs(table[i][0] - pBar) < 0.001) {
      return { temp: table[i][1].toFixed(1), exact: true, outOfRange: false };
    }
    if (i < table.length - 1 && pBar > table[i][0] && pBar < table[i + 1][0]) {
      const [p0, t0] = table[i];
      const [p1, t1] = table[i + 1];
      const t = t0 + (t1 - t0) * (pBar - p0) / (p1 - p0);
      return { temp: t.toFixed(1), exact: false, outOfRange: false };
    }
  }
  return { temp: '', exact: false, outOfRange: true };
}

function PtTabla() {
  const [open, setOpen] = useState(true);
  const [refrigerant, setRefrigerant] = useState<'R32' | 'R410A' | 'R134a'>('R32');
  const [pressure, setPressure] = useState('');
  const [unit, setUnit] = useState<'bar' | 'kPa' | 'Pa' | 'psig'>('bar');

  const REFRIGERANTS: Array<'R32' | 'R410A' | 'R134a'> = ['R32', 'R410A', 'R134a'];
  const UNITS: Array<'bar' | 'kPa' | 'Pa' | 'psig'> = ['bar', 'kPa', 'Pa', 'psig'];

  const result = useMemo(() => {
    const v = parseFloat(pressure);
    if (isNaN(v) || v <= 0) return null;
    const pBar = toBar(v, unit);
    const table = PT_DATA[refrigerant];
    return interpolatePT(table, pBar);
  }, [pressure, unit, refrigerant]);

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
          <View style={styles.segmentRow}>
            {REFRIGERANTS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.segmentBtn, refrigerant === r && styles.segmentBtnActive]}
                onPress={() => { console.log('[Hűtéstechnika] PT tábla refrigerant:', r); setRefrigerant(r); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, refrigerant === r && styles.segmentTextActive]}>{r}</Text>
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
            placeholder={unit === 'bar' ? 'pl. 10.5' : unit === 'kPa' ? 'pl. 1050' : unit === 'psig' ? 'pl. 137' : 'pl. 1050000'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow
              label="Telítési hőmérséklet"
              value={result?.outOfRange ? 'Tartományon kívül' : (result?.temp ?? '—')}
              unit={(!result?.outOfRange && result?.temp) ? '°C' : undefined}
              highlight={result?.outOfRange ? HVAC_YELLOW : (result?.temp ? HVAC_CYAN : undefined)}
            />
            <ResultRow
              label="Adat forrása"
              value={result === null ? '—' : result.outOfRange ? '—' : result.exact ? 'Táblapont egyezés' : 'Interpolált érték'}
              highlight={result === null || result.outOfRange ? undefined : result.exact ? HVAC_GREEN : HVAC_BLUE}
            />
          </View>

          <Text style={styles.noteText}>
            Telítési görbe alapján (abszolút nyomás). psig: 1,01325 bar atmoszferikus nyomással számolva.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 5. Túlhevítés / utóhűtés ────────────────────────────────────────────────

function TulhevitesUtohutes() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'SH' | 'SC'>('SH');
  const [refrigerant, setRefrigerant] = useState<'R32' | 'R410A' | 'R134a'>('R32');
  const [pressure, setPressure] = useState('');
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'kPa' | 'Pa' | 'psig'>('bar');
  const [pipeTemp, setPipeTemp] = useState('');

  const REFRIGERANTS: Array<'R32' | 'R410A' | 'R134a'> = ['R32', 'R410A', 'R134a'];
  const PUNITS: Array<'bar' | 'kPa' | 'Pa' | 'psig'> = ['bar', 'kPa', 'Pa', 'psig'];

  const result = useMemo(() => {
    const p = parseFloat(pressure);
    const t = parseFloat(pipeTemp);
    if (isNaN(p) || p <= 0 || isNaN(t)) return null;

    const pBar = toBar(p, pressureUnit);
    const ptResult = interpolatePT(PT_DATA[refrigerant], pBar);
    if (ptResult.outOfRange || !ptResult.temp) return { outOfRange: true };

    const tSat = parseFloat(ptResult.temp);
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
  }, [pressure, pressureUnit, pipeTemp, refrigerant, mode]);

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
          <View style={styles.segmentRow}>
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
                <Text style={[styles.segmentText, refrigerant === r && styles.segmentTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
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
            placeholder={pressureUnit === 'bar' ? 'pl. 8.5' : pressureUnit === 'kPa' ? 'pl. 850' : pressureUnit === 'psig' ? 'pl. 108' : 'pl. 850000'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

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
              ? 'SH = szívócső hőm. − telítési hőm. Normál tartomány: 5–12 K.'
              : 'SC = telítési hőm. − folyékonyvezeték hőm. Normál tartomány: 3–10 K.'}
          </Text>
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

  const backBtn = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 16,
    marginTop: 24,
    alignSelf: 'flex-start' as const,
  };
  const backBtnText = { fontSize: 13, color: HVAC_BLUE, fontWeight: '500' as const };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <TouchableOpacity style={backBtn} onPress={() => { console.log('[Hűtéstechnika] Back to home pressed'); router.push('/(tabs)/(home)'); }} activeOpacity={0.7}>
          <ChevronLeft size={16} color={HVAC_BLUE} />
          <Text style={backBtnText}>Vissza a kezdőlapra</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Hűtéstechnika</Text>

        <TeljesitmenyAtvalto />
        <CopEer />
        <Nyomaspróba />
        <PtTabla />
        <TulhevitesUtohutes />
        <HutokörGyorsEllenorzes />

        {/* Méretezés section */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: HVAC_TEXT, marginTop: 16, marginBottom: 12, letterSpacing: -0.2 }}>
          Méretezés
        </Text>
        <SplitGyorsmerezezo />
        <DuctedSplitValaszto />
        <FanCoilMerezezo />
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
