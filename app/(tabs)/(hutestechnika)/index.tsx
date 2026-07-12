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
  const [qInput, setQInput] = useState('');   // hőteljesítmény kW
  const [pInput, setPInput] = useState('');   // felvett teljesítmény kW

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => { console.log('[Hűtéstechnika] COP/EER toggled'); setOpen(o => !o); }} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Gauge size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>COP / EER</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Mode selector */}
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
            onChangeText={v => { console.log('[Hűtéstechnika] Q input:', v); setQInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 5.0"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Felvett villamos teljesítmény (kW)</Text>
          <TextInput
            style={styles.inputLarge}
            value={pInput}
            onChangeText={v => { console.log('[Hűtéstechnika] P input:', v); setPInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 1.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Result */}
          <View style={styles.resultBox}>
            <ResultRow label={mode} value="—" />
            <ResultRow label="Minősítés" value="—" />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 3. Nyomáspróba ───────────────────────────────────────────────────────────

function Nyomaspróba() {
  const [open, setOpen] = useState(true);
  const [testPressure, setTestPressure] = useState('');
  const [initialPressure, setInitialPressure] = useState('');
  const [finalPressure, setFinalPressure] = useState('');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState<'bar' | 'Pa' | 'kPa'>('bar');

  const UNITS: Array<'bar' | 'Pa' | 'kPa'> = ['bar', 'kPa', 'Pa'];

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => { console.log('[Hűtéstechnika] Nyomáspróba toggled'); setOpen(o => !o); }} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <FlaskConical size={20} color={HVAC_GREEN} />
          <Text style={styles.cardTitle}>Nyomáspróba</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Pressure unit selector */}
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

          <Text style={styles.label}>Előírt próbanyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={testPressure}
            onChangeText={v => { console.log('[Hűtéstechnika] Próbanyomás input:', v); setTestPressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 40"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Kezdeti nyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={initialPressure}
            onChangeText={v => { console.log('[Hűtéstechnika] Kezdeti nyomás input:', v); setInitialPressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 40"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Záró nyomás ({unit})</Text>
          <TextInput
            style={styles.inputLarge}
            value={finalPressure}
            onChangeText={v => { console.log('[Hűtéstechnika] Záró nyomás input:', v); setFinalPressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 39.8"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Próbaidő (perc)</Text>
          <TextInput
            style={styles.inputLarge}
            value={duration}
            onChangeText={v => { console.log('[Hűtéstechnika] Próbaidő input:', v); setDuration(v); }}
            keyboardType="numeric"
            placeholder="pl. 30"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.noteText}>
            Hűtőköri nyomáspróba: az előírt próbanyomást a rendszer típusától és a hűtőközegtől függően a vonatkozó szabvány (pl. EN 378) határozza meg.
          </Text>

          {/* Result */}
          <View style={styles.resultBox}>
            <ResultRow label="Nyomásesés" value="—" unit={unit} />
            <ResultRow label="Nyomásesés / perc" value="—" unit={`${unit}/perc`} />
            <ResultRow label="Eredmény" value="—" />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 4. PT tábla ──────────────────────────────────────────────────────────────

function PtTabla() {
  const [open, setOpen] = useState(true);
  const [refrigerant, setRefrigerant] = useState<'R32' | 'R410A' | 'R134a' | 'R404A'>('R32');
  const [pressure, setPressure] = useState('');
  const [temperature, setTemperature] = useState('');

  const REFRIGERANTS: Array<'R32' | 'R410A' | 'R134a' | 'R404A'> = ['R32', 'R410A', 'R134a', 'R404A'];

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => { console.log('[Hűtéstechnika] PT tábla toggled'); setOpen(o => !o); }} activeOpacity={0.7}>
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

          <Text style={styles.label}>Nyomás (bar)</Text>
          <TextInput
            style={styles.inputLarge}
            value={pressure}
            onChangeText={v => { console.log('[Hűtéstechnika] PT tábla nyomás input:', v); setPressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 10.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={temperature}
            onChangeText={v => { console.log('[Hűtéstechnika] PT tábla hőmérséklet input:', v); setTemperature(v); }}
            keyboardType="numeric"
            placeholder="pl. 28.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="Telítési hőmérséklet" value="—" unit="°C" />
            <ResultRow label="Telítési nyomás" value="—" unit="bar" />
          </View>

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            A PT tábla a hűtőközeg telítési görbéjét mutatja. Hamarosan elérhető.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 5. Túlhevítés / utóhűtés ────────────────────────────────────────────────

function TulhevitesUtohutes() {
  const [open, setOpen] = useState(true);
  const [suctionTemp, setSuctionTemp] = useState('');
  const [saturationTemp, setSaturationTemp] = useState('');
  const [liquidTemp, setLiquidTemp] = useState('');
  const [condensationTemp, setCondensationTemp] = useState('');

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => { console.log('[Hűtéstechnika] Túlhevítés/utóhűtés toggled'); setOpen(o => !o); }} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Thermometer size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Túlhevítés / utóhűtés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Szívócső hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={suctionTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] Szívócső hőmérséklet input:', v); setSuctionTemp(v); }}
            keyboardType="numeric"
            placeholder="pl. 15"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Telítési hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={saturationTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] Telítési hőmérséklet input:', v); setSaturationTemp(v); }}
            keyboardType="numeric"
            placeholder="pl. 5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Folyékony fázis hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={liquidTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] Folyékony fázis hőmérséklet input:', v); setLiquidTemp(v); }}
            keyboardType="numeric"
            placeholder="pl. 30"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Kondenzációs hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={condensationTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] Kondenzációs hőmérséklet input:', v); setCondensationTemp(v); }}
            keyboardType="numeric"
            placeholder="pl. 40"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="Túlhevítés (SH)" value="—" unit="K" />
            <ResultRow label="Utóhűtés (SC)" value="—" unit="K" />
          </View>

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            Számítás hamarosan elérhető.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 6. Hűtőkör gyors ellenőrzés ─────────────────────────────────────────────

function HutokörGyorsEllenorzes() {
  const [open, setOpen] = useState(true);
  const [suctionPressure, setSuctionPressure] = useState('');
  const [dischargePressure, setDischargePressure] = useState('');
  const [suctionLineTemp, setSuctionLineTemp] = useState('');
  const [currentDraw, setCurrentDraw] = useState('');

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => { console.log('[Hűtéstechnika] Hűtőkör gyors ellenőrzés toggled'); setOpen(o => !o); }} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Activity size={20} color={HVAC_RED} />
          <Text style={styles.cardTitle}>Hűtőkör gyors ellenőrzés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Szívónyomás (bar)</Text>
          <TextInput
            style={styles.inputLarge}
            value={suctionPressure}
            onChangeText={v => { console.log('[Hűtéstechnika] Szívónyomás input:', v); setSuctionPressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 5.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Nyomónyomás (bar)</Text>
          <TextInput
            style={styles.inputLarge}
            value={dischargePressure}
            onChangeText={v => { console.log('[Hűtéstechnika] Nyomónyomás input:', v); setDischargePressure(v); }}
            keyboardType="numeric"
            placeholder="pl. 22"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Szívócső hőmérséklet (°C)</Text>
          <TextInput
            style={styles.inputLarge}
            value={suctionLineTemp}
            onChangeText={v => { console.log('[Hűtéstechnika] Szívócső hőmérséklet input:', v); setSuctionLineTemp(v); }}
            keyboardType="numeric"
            placeholder="pl. 15"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Kompresszor áramfelvétel (A)</Text>
          <TextInput
            style={styles.inputLarge}
            value={currentDraw}
            onChangeText={v => { console.log('[Hűtéstechnika] Kompresszor áramfelvétel input:', v); setCurrentDraw(v); }}
            keyboardType="numeric"
            placeholder="pl. 8.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="Kompressziós arány" value="—" />
            <ResultRow label="Szívócső túlhevítés" value="—" />
            <ResultRow label="Áramfelvétel értékelés" value="—" />
            <ResultRow label="Összesített állapot" value="—" />
          </View>

          <Text style={[styles.noteText, { marginTop: 10 }]}>
            Diagnosztikai logika hamarosan elérhető.
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
