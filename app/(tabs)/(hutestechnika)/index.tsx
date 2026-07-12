import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Zap, Gauge, FlaskConical, Table2, Thermometer, Activity } from 'lucide-react-native';
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
    // choose decimal places by magnitude
    if (out >= 1000) return out.toFixed(1);
    if (out >= 10)   return out.toFixed(2);
    return out.toFixed(4);
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
              label="Eredmény"
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
            <ResultRow label="Minősítés" value={result?.rating ?? '—'} highlight={result?.color} />
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

  const UNITS: Array<'bar' | 'kPa' | 'Pa'> = ['bar', 'kPa', 'Pa'];

  const result = useMemo(() => {
    const p1 = parseFloat(startP);
    const p2 = parseFloat(endP);
    if (isNaN(p1) || isNaN(p2)) return null;
    const drop = p1 - p2;
    const t = parseFloat(duration);
    const dropPerMin = (!isNaN(t) && t > 0) ? drop / t : null;

    // thresholds depend on unit
    const threshold = unit === 'bar' ? 0.1 : unit === 'kPa' ? 10 : 10000;
    let status: string;
    let statusColor: string;
    if (drop < 0) {
      status = 'Ellenőrizendő';
      statusColor = HVAC_YELLOW;
    } else if (drop <= threshold * 0.05) {
      status = 'Tartja';
      statusColor = HVAC_GREEN;
    } else if (drop <= threshold) {
      status = 'Ellenőrizendő';
      statusColor = HVAC_YELLOW;
    } else {
      status = 'Nem tartja';
      statusColor = HVAC_RED;
    }

    return {
      drop: drop.toFixed(unit === 'Pa' ? 0 : 3),
      dropPerMin: dropPerMin !== null ? dropPerMin.toFixed(unit === 'Pa' ? 1 : 4) : null,
      status,
      statusColor,
    };
  }, [startP, endP, duration, unit]);

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

          <Text style={styles.label}>Eltelt idő (perc)</Text>
          <TextInput
            style={styles.inputLarge}
            value={duration}
            onChangeText={v => { console.log('[Hűtéstechnika] Eltelt idő input:', v); setDuration(v); }}
            keyboardType="numeric"
            placeholder="pl. 30"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.noteText}>
            Megjegyzés: a környezeti hőmérséklet változása befolyásolhatja a nyomásmérési eredményt. Stabil hőmérsékleten végzett mérés pontosabb eredményt ad.
          </Text>

          <View style={styles.resultBox}>
            <ResultRow label="Nyomásesés" value={result?.drop ?? '—'} unit={result ? unit : undefined} />
            <ResultRow label="Nyomásesés / perc" value={result?.dropPerMin ?? '—'} unit={result?.dropPerMin ? `${unit}/perc` : undefined} />
            <ResultRow label="Eredmény" value={result?.status ?? '—'} highlight={result?.statusColor} />
          </View>
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
            {result?.outOfRange ? (
              <ResultRow label="Telítési hőmérséklet" value="Tartományon kívül" highlight={HVAC_YELLOW} />
            ) : (
              <>
                <ResultRow
                  label="Telítési hőmérséklet"
                  value={result?.temp ?? '—'}
                  unit={result?.temp ? '°C' : undefined}
                  highlight={result?.temp ? HVAC_CYAN : undefined}
                />
                <ResultRow
                  label="Forrás"
                  value={result === null ? '—' : result.exact ? 'Táblapont egyezés' : 'Interpolált érték'}
                  highlight={result === null ? undefined : result.exact ? HVAC_GREEN : HVAC_BLUE}
                />
              </>
            )}
          </View>

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            Az adatok telítési görbén alapulnak (abszolút nyomás). psig esetén 1,01325 bar atmoszferikus nyomással számol.
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
            {result?.outOfRange ? (
              <ResultRow label="Telítési hőmérséklet" value="Tartományon kívül" highlight={HVAC_YELLOW} />
            ) : (
              <>
                <ResultRow
                  label="Telítési hőmérséklet (PT)"
                  value={result?.tSat ?? '—'}
                  unit={result?.tSat ? '°C' : undefined}
                />
                <ResultRow
                  label={modeLabel}
                  value={result?.delta ?? '—'}
                  unit={result?.delta ? 'K' : undefined}
                  highlight={result?.qualityColor}
                />
                <ResultRow
                  label="Értékelés"
                  value={result?.quality ?? '—'}
                  highlight={result?.qualityColor}
                />
              </>
            )}
          </View>

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            A telítési hőmérséklet a PT táblából kerül meghatározásra. SH = szívócső hőmérséklet − telítési hőmérséklet. SC = telítési hőmérséklet − folyékonyvezeték hőmérséklete.
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
          <Text style={styles.label}>Túlhevítés – SH (K)</Text>
          <TextInput
            style={styles.inputLarge}
            value={shInput}
            onChangeText={v => { console.log('[Hűtéstechnika] SH input:', v); setShInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 8"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Utóhűtés – SC (K)</Text>
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

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            A diagnózis az SH és SC értékek kombinációján alapul. Pontos értékeléshez mérje meg mindkét értéket a PT táblával.
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
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
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
    marginBottom: 14,
  },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER },
  unitBtnActive: { backgroundColor: HVAC_BLUE, borderColor: HVAC_BLUE },
  unitBtnText: { fontSize: 13, fontWeight: '600', color: HVAC_TEXT_SECONDARY },
  unitBtnTextActive: { color: '#FFFFFF' },
  segmentRow: { flexDirection: 'row', backgroundColor: HVAC_SURFACE, borderRadius: 12, padding: 4, marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: HVAC_BLUE },
  segmentText: { fontSize: 14, fontWeight: '600', color: HVAC_TEXT_SECONDARY },
  segmentTextActive: { color: '#FFFFFF' },
  resultBox: { backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER, borderRadius: 16, padding: 16, gap: 10, marginTop: 4 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 14, color: HVAC_TEXT_SECONDARY, flex: 1 },
  resultValue: { fontSize: 20, fontWeight: '700', color: HVAC_TEXT },
  resultUnit: { fontSize: 13, color: HVAC_TEXT_SECONDARY },
  noteText: { fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 19, marginBottom: 12 },
});
