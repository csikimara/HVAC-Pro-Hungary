import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { ChevronDown, ChevronUp, Snowflake, BarChart2, FlaskConical } from 'lucide-react-native';

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

// ─── BTU/kW Converter ─────────────────────────────────────────────────────────

function BtuKwConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [direction, setDirection] = useState<'btu2kw' | 'kw2btu'>('btu2kw');

  type BtuResult = { W: string; kW: string; BTUh: string; kcalh: string };
  const [result, setResult] = useState<BtuResult | null>(null);

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      setResult(null);
      return;
    }
    let kw: number;
    if (direction === 'btu2kw') {
      kw = v / 3412.14;
    } else {
      kw = v;
    }
    const w = kw * 1000;
    const btuh = kw * 3412.14;
    const kcalh = kw * 860;
    setResult({
      W: w.toFixed(2),
      kW: kw.toFixed(4),
      BTUh: btuh.toFixed(2),
      kcalh: kcalh.toFixed(2),
    });
  }, [value, direction]);

  const inputLabel = direction === 'btu2kw' ? 'Érték (BTU/h)' : 'Érték (kW)';
  const inputPlaceholder = direction === 'btu2kw' ? 'pl. 12000' : 'pl. 3.5';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Hűtéstechnika] BTU/kW kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Snowflake size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>BTU/kW átváltó</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['btu2kw', 'kw2btu'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.segmentBtn, direction === d && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Hűtéstechnika] BTU/kW irány:', d);
                  setDirection(d);
                  setValue('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, direction === d && styles.segmentTextActive]}>
                  {d === 'btu2kw' ? 'BTU/h → kW' : 'kW → BTU/h'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{inputLabel}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Hűtéstechnika] BTU/kW input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder={inputPlaceholder}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="W" value={result.W} unit="W" />
              <ResultRow label="kW" value={result.kW} unit="kW" highlight={HVAC_CYAN} />
              <ResultRow label="BTU/h" value={result.BTUh} unit="BTU/h" highlight={HVAC_BLUE} />
              <ResultRow label="kcal/h" value={result.kcalh} unit="kcal/h" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── COP / EER Calculator ─────────────────────────────────────────────────────

function getCopColor(cop: number): string {
  if (cop >= 4.0) return HVAC_GREEN;
  if (cop >= 2.5) return HVAC_YELLOW;
  return HVAC_RED;
}

function getCopClass(cop: number): string {
  if (cop >= 4.0) return 'Kiváló';
  if (cop >= 3.0) return 'Jó';
  if (cop >= 2.5) return 'Közepes';
  return 'Gyenge';
}

function getEerColor(eer: number): string {
  if (eer >= 3.5) return HVAC_GREEN;
  if (eer >= 2.5) return HVAC_YELLOW;
  return HVAC_RED;
}

function getEerClass(eer: number): string {
  if (eer >= 8.5) return 'A+++';
  if (eer >= 6.1) return 'A++';
  if (eer >= 5.1) return 'A+';
  if (eer >= 4.1) return 'A';
  if (eer >= 3.1) return 'B';
  if (eer >= 2.6) return 'C';
  return 'D';
}

function CopEerCalculator() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<'cop' | 'eer'>('cop');
  const [Qh, setQh] = useState('');
  const [Qc, setQc] = useState('');
  const [Pel, setPel] = useState('');

  type CopResult = { value: string; color: string; classification: string };
  const [result, setResult] = useState<CopResult | null>(null);

  function calculate() {
    console.log('[Hűtéstechnika] COP/EER számítás, mód:', mode, 'Q:', mode === 'cop' ? Qh : Qc, 'P_el:', Pel);
    const pelVal = parseFloat(Pel);
    if (isNaN(pelVal) || pelVal <= 0) {
      setResult(null);
      return;
    }

    if (mode === 'cop') {
      const qhVal = parseFloat(Qh);
      if (isNaN(qhVal)) { setResult(null); return; }
      const cop = qhVal / pelVal;
      setResult({
        value: cop.toFixed(2),
        color: getCopColor(cop),
        classification: getCopClass(cop),
      });
    } else {
      const qcVal = parseFloat(Qc);
      if (isNaN(qcVal)) { setResult(null); return; }
      const eer = qcVal / pelVal;
      setResult({
        value: eer.toFixed(2),
        color: getEerColor(eer),
        classification: getEerClass(eer),
      });
    }
  }

  const metricLabel = mode === 'cop' ? 'COP' : 'EER';
  const valueColor = result?.color ?? HVAC_TEXT;
  const classificationText = result?.classification ?? '—';
  const resultValue = result?.value ?? '—';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Hűtéstechnika] COP/EER kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <BarChart2 size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>COP / EER számítás</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['cop', 'eer'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Hűtéstechnika] COP/EER mód:', m);
                  setMode(m);
                  setResult(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                  {m === 'cop' ? 'COP (fűtés)' : 'EER (hűtés)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'cop' ? (
            <>
              <Text style={styles.label}>Hasznos hőteljesítmény Q_h (kW)</Text>
              <TextInput
                style={styles.input}
                value={Qh}
                onChangeText={setQh}
                keyboardType="numeric"
                placeholder="pl. 10"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Hasznos hűtőteljesítmény Q_c (kW)</Text>
              <TextInput
                style={styles.input}
                value={Qc}
                onChangeText={setQc}
                keyboardType="numeric"
                placeholder="pl. 8"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          <Text style={styles.label}>Felvett villamos teljesítmény P_el (kW)</Text>
          <TextInput
            style={styles.input}
            value={Pel}
            onChangeText={setPel}
            keyboardType="numeric"
            placeholder="pl. 2.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          <View style={styles.resultBox}>
            <View style={styles.copMainRow}>
              <Text style={styles.copLabel}>{metricLabel}</Text>
              <Text style={[styles.copValue, { color: valueColor }]}>{resultValue}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Besorolás</Text>
              <Text style={[styles.resultValue, { color: valueColor }]}>{classificationText}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Pressure Test ────────────────────────────────────────────────────────────

function PressureTestTool() {
  const [open, setOpen] = useState(true);
  const [V, setV] = useState('');
  const [pProba, setPProba] = useState('1.5');
  const [pAtm, setPAtm] = useState('1.013');
  const [T, setT] = useState('20');
  const [t, setT2] = useState('30');

  type PressureTestResult = {
    pAbs: string;
    dpMax5: string;
    dpMax5Pa: string;
    dpMax2: string;
    dpMax2Pa: string;
    duration: string;
  };

  const [result, setResult] = useState<PressureTestResult | null>(null);

  function calculate() {
    console.log('[Hűtéstechnika] Nyomáspróba számítás, V:', V, 'P_próba:', pProba, 'P_atm:', pAtm, 'T:', T, 't:', t);
    const vVal = parseFloat(V);
    const pProbaVal = parseFloat(pProba);
    const pAtmVal = parseFloat(pAtm);

    if (isNaN(vVal) || isNaN(pProbaVal) || isNaN(pAtmVal) || pProbaVal <= 0) {
      setResult(null);
      return;
    }

    const pAbs = pProbaVal + pAtmVal;
    const dpMax5 = pProbaVal * 0.05;
    const dpMax2 = pProbaVal * 0.02;

    setResult({
      pAbs: pAbs.toFixed(3),
      dpMax5: dpMax5.toFixed(4),
      dpMax5Pa: (dpMax5 * 100000).toFixed(0),
      dpMax2: dpMax2.toFixed(4),
      dpMax2Pa: (dpMax2 * 100000).toFixed(0),
      duration: t,
    });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Hűtéstechnika] Nyomáspróba kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <FlaskConical size={20} color={HVAC_CYAN} />
          <Text style={styles.cardTitle}>Nyomáspróba kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Rendszer térfogata V (m³)</Text>
          <TextInput style={styles.input} value={V} onChangeText={setV} keyboardType="numeric" placeholder="pl. 0.5" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Próbanyomás P_próba (bar)</Text>
          <TextInput style={styles.input} value={pProba} onChangeText={setPProba} keyboardType="numeric" placeholder="1.5" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Légköri nyomás P_atm (bar)</Text>
          <TextInput style={styles.input} value={pAtm} onChangeText={setPAtm} keyboardType="numeric" placeholder="1.013" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Hőmérséklet T (°C)</Text>
          <TextInput style={styles.input} value={T} onChangeText={setT} keyboardType="numeric" placeholder="20" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Próba időtartama t (perc)</Text>
          <TextInput style={styles.input} value={t} onChangeText={setT2} keyboardType="numeric" placeholder="30" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="Abszolút próbanyomás" value={result.pAbs} unit="bar" highlight={HVAC_CYAN} />
              <View style={styles.divider} />
              <Text style={[styles.resultLabel, { fontWeight: '600', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }]}>Max. megengedett nyomáscsökkenés (5%)</Text>
              <ResultRow label="bar" value={result.dpMax5} unit="bar" />
              <ResultRow label="Pascal" value={result.dpMax5Pa} unit="Pa" />
              <View style={styles.divider} />
              <Text style={[styles.resultLabel, { fontWeight: '600', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }]}>Max. megengedett nyomáscsökkenés (2%)</Text>
              <ResultRow label="bar" value={result.dpMax2} unit="bar" />
              <ResultRow label="Pascal" value={result.dpMax2Pa} unit="Pa" />
              <View style={styles.divider} />
              <Text style={styles.noteText}>
                A próba sikeres, ha a nyomáscsökkenés nem haladja meg a megengedett értéket a(z) {result.duration} perces időtartam alatt.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Shared ResultRow ─────────────────────────────────────────────────────────

function ResultRow({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: string }) {
  const valueColor = highlight ?? HVAC_TEXT;
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <View style={styles.resultValueRow}>
        <Text style={[styles.resultValue, { color: valueColor }]}>{value}</Text>
        <Text style={styles.resultUnit}> {unit}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HutestechnikaScreen() {
  const isIOS = process.env.EXPO_OS === 'ios';
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={isIOS ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Hűtéstechnika</Text>
        <BtuKwConverter />
        <CopEerCalculator />
        <PressureTestTool />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: HVAC_BG },
  container: { flex: 1, backgroundColor: HVAC_BG },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: HVAC_TEXT,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: HVAC_CARD,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: HVAC_TEXT,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
  },
  segmentBtnActive: {
    backgroundColor: HVAC_CYAN,
    borderColor: HVAC_CYAN,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: HVAC_TEXT_SECONDARY,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 12,
    padding: 14,
    color: HVAC_TEXT,
    fontSize: 16,
    marginBottom: 12,
  },
  calcBtn: {
    backgroundColor: HVAC_BLUE,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  resultBox: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultLabel: {
    fontSize: 14,
    color: HVAC_TEXT_SECONDARY,
    flex: 1,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: HVAC_TEXT,
  },
  resultUnit: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
  },
  copMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: HVAC_TEXT_SECONDARY,
  },
  copValue: {
    fontSize: 36,
    fontWeight: '800',
    color: HVAC_TEXT,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: HVAC_BORDER,
    marginVertical: 4,
  },
  noteText: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    lineHeight: 19,
    marginTop: 4,
  },
});
