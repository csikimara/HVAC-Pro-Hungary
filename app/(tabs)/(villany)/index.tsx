import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { ChevronDown, ChevronUp, Zap, Activity, Cpu } from 'lucide-react-native';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const HVAC_YELLOW = '#F59E0B';
const HVAC_PURPLE = '#A855F7';

// ─── Ohm's Law Calculator ─────────────────────────────────────────────────────

function OhmLawCalculator() {
  const [open, setOpen] = useState(true);
  const [U, setU] = useState('');
  const [I, setI] = useState('');
  const [R, setR] = useState('');
  const [P, setP] = useState('');

  type OhmResult = { U: string; I: string; R: string; P: string };
  const [result, setResult] = useState<OhmResult | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    console.log('[Villany] Ohm-törvény számítás, U:', U, 'I:', I, 'R:', R, 'P:', P);
    const uVal = U !== '' ? parseFloat(U) : null;
    const iVal = I !== '' ? parseFloat(I) : null;
    const rVal = R !== '' ? parseFloat(R) : null;
    const pVal = P !== '' ? parseFloat(P) : null;

    const known = [uVal, iVal, rVal, pVal].filter(v => v !== null && !isNaN(v as number));
    if (known.length < 2) {
      setError('Legalább 2 értéket adj meg!');
      setResult(null);
      return;
    }
    setError('');

    let calcU = uVal;
    let calcI = iVal;
    let calcR = rVal;
    let calcP = pVal;

    // Solve iteratively
    for (let iter = 0; iter < 5; iter++) {
      if (calcU !== null && calcI !== null) {
        if (calcR === null) calcR = calcU / calcI;
        if (calcP === null) calcP = calcU * calcI;
      }
      if (calcU !== null && calcR !== null) {
        if (calcI === null) calcI = calcU / calcR;
        if (calcP === null) calcP = (calcU * calcU) / calcR;
      }
      if (calcI !== null && calcR !== null) {
        if (calcU === null) calcU = calcI * calcR;
        if (calcP === null) calcP = calcI * calcI * calcR;
      }
      if (calcP !== null && calcU !== null) {
        if (calcI === null) calcI = calcP / calcU;
        if (calcR === null) calcR = (calcU * calcU) / calcP;
      }
      if (calcP !== null && calcI !== null) {
        if (calcU === null) calcU = calcP / calcI;
        if (calcR === null) calcR = calcP / (calcI * calcI);
      }
      if (calcP !== null && calcR !== null) {
        if (calcU === null) calcU = Math.sqrt(calcP * calcR);
        if (calcI === null) calcI = Math.sqrt(calcP / calcR);
      }
    }

    if (calcU === null || calcI === null || calcR === null || calcP === null) {
      setError('Nem sikerült kiszámítani. Ellenőrizd az értékeket!');
      setResult(null);
      return;
    }

    setResult({
      U: calcU.toFixed(2),
      I: calcI.toFixed(4),
      R: calcR.toFixed(4),
      P: calcP.toFixed(2),
    });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Villany] Ohm-törvény kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Zap size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Ohm-törvény kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.hintText}>Töltsd ki bármelyik 2 mezőt, a többi kiszámításra kerül.</Text>

          <Text style={styles.label}>Feszültség U (V)</Text>
          <TextInput
            style={styles.input}
            value={U}
            onChangeText={setU}
            keyboardType="numeric"
            placeholder="pl. 230"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Áramerősség I (A)</Text>
          <TextInput
            style={styles.input}
            value={I}
            onChangeText={setI}
            keyboardType="numeric"
            placeholder="pl. 10"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Ellenállás R (Ω)</Text>
          <TextInput
            style={styles.input}
            value={R}
            onChangeText={setR}
            keyboardType="numeric"
            placeholder="pl. 23"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Teljesítmény P (W)</Text>
          <TextInput
            style={styles.input}
            value={P}
            onChangeText={setP}
            keyboardType="numeric"
            placeholder="pl. 2300"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Számítás</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="Feszültség U" value={result.U} unit="V" highlight={HVAC_YELLOW} />
              <ResultRow label="Áramerősség I" value={result.I} unit="A" />
              <ResultRow label="Ellenállás R" value={result.R} unit="Ω" />
              <ResultRow label="Teljesítmény P" value={result.P} unit="W" highlight={HVAC_BLUE} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Single-Phase Power ───────────────────────────────────────────────────────

function SinglePhasePower() {
  const [open, setOpen] = useState(true);
  const [U, setU] = useState('230');
  const [I, setI] = useState('');
  const [cosP, setCosP] = useState('0.85');

  type SinglePhaseResult = {
    S_VA: string; S_kVA: string;
    P_W: string; P_kW: string;
    Q_VAr: string; Q_kVAr: string;
    cosPhi: string;
  };
  const [result, setResult] = useState<SinglePhaseResult | null>(null);

  function calculate() {
    console.log('[Villany] Egyfázisú teljesítmény számítás, U:', U, 'I:', I, 'cosφ:', cosP);
    const uVal = parseFloat(U);
    const iVal = parseFloat(I);
    const cosPVal = parseFloat(cosP);

    if (isNaN(uVal) || isNaN(iVal) || isNaN(cosPVal) || iVal <= 0 || cosPVal < 0 || cosPVal > 1) {
      setResult(null);
      return;
    }

    const S = uVal * iVal;
    const P = S * cosPVal;
    const Q = Math.sqrt(Math.max(0, S * S - P * P));

    setResult({
      S_VA: S.toFixed(2),
      S_kVA: (S / 1000).toFixed(4),
      P_W: P.toFixed(2),
      P_kW: (P / 1000).toFixed(4),
      Q_VAr: Q.toFixed(2),
      Q_kVAr: (Q / 1000).toFixed(4),
      cosPhi: cosPVal.toFixed(3),
    });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Villany] Egyfázisú teljesítmény kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Activity size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Egyfázisú teljesítmény</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Feszültség U (V)</Text>
          <TextInput style={styles.input} value={U} onChangeText={setU} keyboardType="numeric" placeholder="230" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Áramerősség I (A)</Text>
          <TextInput style={styles.input} value={I} onChangeText={setI} keyboardType="numeric" placeholder="pl. 10" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Teljesítménytényező cos φ</Text>
          <TextInput style={styles.input} value={cosP} onChangeText={setCosP} keyboardType="numeric" placeholder="0.85" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="Látszólagos teljesítmény S" value={result.S_VA} unit="VA" />
              <ResultRow label="" value={result.S_kVA} unit="kVA" />
              <View style={styles.divider} />
              <ResultRow label="Hatásos teljesítmény P" value={result.P_W} unit="W" highlight={HVAC_BLUE} />
              <ResultRow label="" value={result.P_kW} unit="kW" highlight={HVAC_BLUE} />
              <View style={styles.divider} />
              <ResultRow label="Meddő teljesítmény Q" value={result.Q_VAr} unit="VAr" />
              <ResultRow label="" value={result.Q_kVAr} unit="kVAr" />
              <View style={styles.divider} />
              <ResultRow label="cos φ" value={result.cosPhi} unit="" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Three-Phase Power ────────────────────────────────────────────────────────

function ThreePhasePower() {
  const [open, setOpen] = useState(true);
  const [Uv, setUv] = useState('400');
  const [I, setI] = useState('');
  const [cosP, setCosP] = useState('0.85');

  type ThreePhaseResult = {
    Uf: string;
    S_VA: string; S_kVA: string;
    P_W: string; P_kW: string;
    Q_VAr: string; Q_kVAr: string;
  };
  const [result, setResult] = useState<ThreePhaseResult | null>(null);

  const SQRT3 = Math.sqrt(3);

  function calculate() {
    console.log('[Villany] Háromfázisú teljesítmény számítás, U_v:', Uv, 'I:', I, 'cosφ:', cosP);
    const uvVal = parseFloat(Uv);
    const iVal = parseFloat(I);
    const cosPVal = parseFloat(cosP);

    if (isNaN(uvVal) || isNaN(iVal) || isNaN(cosPVal) || iVal <= 0 || cosPVal < 0 || cosPVal > 1) {
      setResult(null);
      return;
    }

    const S = SQRT3 * uvVal * iVal;
    const P = S * cosPVal;
    const Q = Math.sqrt(Math.max(0, S * S - P * P));
    const Uf = uvVal / SQRT3;

    setResult({
      Uf: Uf.toFixed(2),
      S_VA: S.toFixed(2),
      S_kVA: (S / 1000).toFixed(4),
      P_W: P.toFixed(2),
      P_kW: (P / 1000).toFixed(4),
      Q_VAr: Q.toFixed(2),
      Q_kVAr: (Q / 1000).toFixed(4),
    });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Villany] Háromfázisú teljesítmény kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Cpu size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Háromfázisú teljesítmény</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Vonali feszültség U_v (V)</Text>
          <TextInput style={styles.input} value={Uv} onChangeText={setUv} keyboardType="numeric" placeholder="400" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Áramerősség I (A)</Text>
          <TextInput style={styles.input} value={I} onChangeText={setI} keyboardType="numeric" placeholder="pl. 16" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Teljesítménytényező cos φ</Text>
          <TextInput style={styles.input} value={cosP} onChangeText={setCosP} keyboardType="numeric" placeholder="0.85" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="Fázisfeszültség U_f" value={result.Uf} unit="V" highlight={HVAC_PURPLE} />
              <View style={styles.divider} />
              <ResultRow label="Látszólagos teljesítmény S" value={result.S_VA} unit="VA" />
              <ResultRow label="" value={result.S_kVA} unit="kVA" />
              <View style={styles.divider} />
              <ResultRow label="Hatásos teljesítmény P" value={result.P_W} unit="W" highlight={HVAC_BLUE} />
              <ResultRow label="" value={result.P_kW} unit="kW" highlight={HVAC_BLUE} />
              <View style={styles.divider} />
              <ResultRow label="Meddő teljesítmény Q" value={result.Q_VAr} unit="VAr" />
              <ResultRow label="" value={result.Q_kVAr} unit="kVAr" />
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
        {unit !== '' && <Text style={styles.resultUnit}> {unit}</Text>}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VillanyScreen() {
  const isIOS = process.env.EXPO_OS === 'ios';
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={isIOS ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Villany</Text>
        <OhmLawCalculator />
        <SinglePhasePower />
        <ThreePhasePower />
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
  hintText: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    marginBottom: 12,
    lineHeight: 18,
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
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 8,
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
  divider: {
    height: 1,
    backgroundColor: HVAC_BORDER,
    marginVertical: 2,
  },
});
