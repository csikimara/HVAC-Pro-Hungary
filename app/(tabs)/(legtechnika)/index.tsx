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
import { ChevronDown, ChevronUp, Pipette, Ruler, TrendingDown } from 'lucide-react-native';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const HVAC_GREEN = '#22C55E';
const HVAC_YELLOW = '#F59E0B';
const HVAC_RED = '#EF4444';

const STANDARD_DIAMETERS = [80, 100, 125, 150, 160, 200, 250, 315, 355, 400, 450, 500, 560, 630];

function getVelocityColor(v: number): string {
  if (v <= 3.5) return HVAC_GREEN;
  if (v <= 5) return HVAC_YELLOW;
  return HVAC_RED;
}

function getPressureDropColor(r: number): string {
  if (r <= 1.0) return HVAC_GREEN;
  if (r <= 2.0) return HVAC_YELLOW;
  return HVAC_RED;
}

// ─── Duct Sizing ──────────────────────────────────────────────────────────────

function DuctSizingTool() {
  const [open, setOpen] = useState(true);
  const [ductType, setDuctType] = useState<'kor' | 'teglalap'>('kor');
  const [Q, setQ] = useState('');
  const [v, setV] = useState('3.0');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  type DuctResult = {
    calcDiameter: string;
    stdDiameter: string;
    actualVelocity: string;
    velocityColor: string;
    eqDiameter: string;
    rectVelocity: string;
    rectVelocityColor: string;
    area: string;
  };

  const [result, setResult] = useState<DuctResult | null>(null);

  function calculate() {
    console.log('[Légtechnika] Légcsatorna méretezés számítás, Q:', Q, 'v:', v, 'típus:', ductType);
    const qVal = parseFloat(Q);
    const vVal = parseFloat(v);

    if (ductType === 'kor') {
      if (isNaN(qVal) || isNaN(vVal) || vVal <= 0) {
        setResult(null);
        return;
      }
      const A = qVal / (vVal * 3600);
      const D = Math.sqrt((4 * A) / Math.PI) * 1000;
      const stdD = STANDARD_DIAMETERS.find(d => d >= D) ?? STANDARD_DIAMETERS[STANDARD_DIAMETERS.length - 1];
      const areaStd = Math.PI * Math.pow(stdD / 1000, 2) / 4;
      const vActual = qVal / (3600 * areaStd);
      setResult({
        calcDiameter: D.toFixed(1),
        stdDiameter: stdD.toString(),
        actualVelocity: vActual.toFixed(2),
        velocityColor: getVelocityColor(vActual),
        eqDiameter: '—',
        rectVelocity: '—',
        rectVelocityColor: HVAC_TEXT,
        area: (A * 10000).toFixed(2),
      });
    } else {
      const aVal = parseFloat(a);
      const bVal = parseFloat(b);
      if (isNaN(qVal) || isNaN(aVal) || isNaN(bVal) || aVal <= 0 || bVal <= 0) {
        setResult(null);
        return;
      }
      const De = 1.3 * Math.pow(aVal * bVal, 0.625) / Math.pow(aVal + bVal, 0.25);
      const area = (aVal * bVal) / 1_000_000;
      const velocity = qVal / (3600 * area);
      setResult({
        calcDiameter: '—',
        stdDiameter: '—',
        actualVelocity: '—',
        velocityColor: HVAC_TEXT,
        eqDiameter: De.toFixed(1),
        rectVelocity: velocity.toFixed(2),
        rectVelocityColor: getVelocityColor(velocity),
        area: (area * 10000).toFixed(2),
      });
    }
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Légtechnika] Légcsatorna kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Ruler size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Légcsatorna méretezés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['kor', 'teglalap'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.segmentBtn, ductType === t && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Légtechnika] Csatorna típus:', t);
                  setDuctType(t);
                  setResult(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, ductType === t && styles.segmentTextActive]}>
                  {t === 'kor' ? 'Kör' : 'Téglalap'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Légmennyiség Q (m³/h)</Text>
          <TextInput
            style={styles.input}
            value={Q}
            onChangeText={setQ}
            keyboardType="numeric"
            placeholder="pl. 500"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {ductType === 'kor' && (
            <>
              <Text style={styles.label}>Max. légsebesség v (m/s)</Text>
              <TextInput
                style={styles.input}
                value={v}
                onChangeText={setV}
                keyboardType="numeric"
                placeholder="3.0"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          {ductType === 'teglalap' && (
            <>
              <Text style={styles.label}>Szélesség a (mm)</Text>
              <TextInput
                style={styles.input}
                value={a}
                onChangeText={setA}
                keyboardType="numeric"
                placeholder="pl. 400"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság b (mm)</Text>
              <TextInput
                style={styles.input}
                value={b}
                onChangeText={setB}
                keyboardType="numeric"
                placeholder="pl. 200"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              {ductType === 'kor' ? (
                <>
                  <ResultRow label="Számított átmérő" value={result.calcDiameter} unit="mm" />
                  <ResultRow label="Ajánlott szabványméret" value={result.stdDiameter} unit="mm" highlight={HVAC_BLUE} />
                  <ResultRow label="Légsebesség (szabványmérettel)" value={result.actualVelocity} unit="m/s" highlight={result.velocityColor} />
                </>
              ) : (
                <>
                  <ResultRow label="Ekvivalens átmérő" value={result.eqDiameter} unit="mm" />
                  <ResultRow label="Keresztmetszet" value={result.area} unit="cm²" />
                  <ResultRow label="Légsebesség" value={result.rectVelocity} unit="m/s" highlight={result.rectVelocityColor} />
                </>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Pressure Drop ────────────────────────────────────────────────────────────

function PressureDropTool() {
  const [open, setOpen] = useState(true);
  const [Q, setQ] = useState('');
  const [D, setD] = useState('');
  const [L, setL] = useState('');
  const [lambda, setLambda] = useState('0.02');

  type PressureDropResult = {
    velocity: string;
    pressureDrop: string;
    specificDrop: string;
    specificColor: string;
  };

  const [result, setResult] = useState<PressureDropResult | null>(null);

  function calculate() {
    console.log('[Légtechnika] Nyomásesés számítás, Q:', Q, 'D:', D, 'L:', L, 'λ:', lambda);
    const qVal = parseFloat(Q);
    const dVal = parseFloat(D);
    const lVal = parseFloat(L);
    const lambdaVal = parseFloat(lambda);

    if (isNaN(qVal) || isNaN(dVal) || isNaN(lVal) || isNaN(lambdaVal) || dVal <= 0 || lVal <= 0) {
      setResult(null);
      return;
    }

    const dM = dVal / 1000;
    const area = Math.PI * Math.pow(dM, 2) / 4;
    const velocity = qVal / (3600 * area);
    const rho = 1.2;
    const deltaP = lambdaVal * (lVal / dM) * (rho * Math.pow(velocity, 2)) / 2;
    const R = deltaP / lVal;

    setResult({
      velocity: velocity.toFixed(2),
      pressureDrop: deltaP.toFixed(2),
      specificDrop: R.toFixed(3),
      specificColor: getPressureDropColor(R),
    });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Légtechnika] Nyomásesés kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <TrendingDown size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Nyomásesés számítás</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Légmennyiség Q (m³/h)</Text>
          <TextInput style={styles.input} value={Q} onChangeText={setQ} keyboardType="numeric" placeholder="pl. 500" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Csatorna átmérő D (mm)</Text>
          <TextInput style={styles.input} value={D} onChangeText={setD} keyboardType="numeric" placeholder="pl. 200" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Csatorna hossz L (m)</Text>
          <TextInput style={styles.input} value={L} onChangeText={setL} keyboardType="numeric" placeholder="pl. 10" placeholderTextColor={HVAC_TEXT_SECONDARY} />
          <Text style={styles.label}>Súrlódási tényező λ</Text>
          <TextInput style={styles.input} value={lambda} onChangeText={setLambda} keyboardType="numeric" placeholder="0.02" placeholderTextColor={HVAC_TEXT_SECONDARY} />

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <ResultRow label="Légsebesség" value={result.velocity} unit="m/s" />
              <ResultRow label="Nyomásesés" value={result.pressureDrop} unit="Pa" highlight={HVAC_BLUE} />
              <ResultRow label="Fajlagos nyomásesés" value={result.specificDrop} unit="Pa/m" highlight={result.specificColor} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Pipe Sizing ──────────────────────────────────────────────────────────────

const DN_LIST = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200];

function getPipeVelocityColor(v: number): string {
  if (v <= 1.5) return HVAC_GREEN;
  if (v <= 2.5) return HVAC_YELLOW;
  return HVAC_RED;
}

function PipeSizingTool() {
  const [open, setOpen] = useState(true);
  const [pipeType, setPipeType] = useState<'kerek' | 'negyszog'>('kerek');
  const [massFlow, setMassFlow] = useState('');
  const [maxVelocity, setMaxVelocity] = useState('1.5');
  const [density, setDensity] = useState('1000');
  const [widthA, setWidthA] = useState('');
  const [heightB, setHeightB] = useState('');

  type PipeResult = {
    calcDiameter: string;
    recommendedDN: string;
    actualVelocity: string;
    velocityColor: string;
    crossSection: string;
    eqDiameter: string;
    rectVelocity: string;
    rectVelocityColor: string;
  };

  const [result, setResult] = useState<PipeResult | null>(null);

  function calculate() {
    console.log('[Légtechnika] Csőméretezés számítás, ṁ:', massFlow, 'típus:', pipeType, 'ρ:', density);
    const mVal = parseFloat(massFlow);
    const rhoVal = parseFloat(density);

    if (pipeType === 'kerek') {
      const vVal = parseFloat(maxVelocity);
      if (isNaN(mVal) || isNaN(vVal) || isNaN(rhoVal) || vVal <= 0 || rhoVal <= 0) {
        setResult(null);
        return;
      }
      const A = mVal / (rhoVal * vVal * 3600);
      const D = Math.sqrt((4 * A) / Math.PI) * 1000;
      const dn = DN_LIST.find(d => d >= D) ?? DN_LIST[DN_LIST.length - 1];
      const areaDN = Math.PI * Math.pow(dn / 1000, 2) / 4;
      const vActual = mVal / (rhoVal * areaDN * 3600);
      setResult({
        calcDiameter: D.toFixed(1),
        recommendedDN: dn.toString(),
        actualVelocity: vActual.toFixed(2),
        velocityColor: getPipeVelocityColor(vActual),
        crossSection: '—',
        eqDiameter: '—',
        rectVelocity: '—',
        rectVelocityColor: HVAC_TEXT,
      });
    } else {
      const aVal = parseFloat(widthA);
      const bVal = parseFloat(heightB);
      if (isNaN(mVal) || isNaN(aVal) || isNaN(bVal) || isNaN(rhoVal) || aVal <= 0 || bVal <= 0 || rhoVal <= 0) {
        setResult(null);
        return;
      }
      const area = (aVal * bVal) / 1_000_000;
      const velocity = mVal / (rhoVal * area * 3600);
      const De = 1.3 * Math.pow(aVal * bVal, 0.625) / Math.pow(aVal + bVal, 0.25);
      setResult({
        calcDiameter: '—',
        recommendedDN: '—',
        actualVelocity: '—',
        velocityColor: HVAC_TEXT,
        crossSection: (area * 10000).toFixed(2),
        eqDiameter: De.toFixed(1),
        rectVelocity: velocity.toFixed(2),
        rectVelocityColor: getPipeVelocityColor(velocity),
      });
    }
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Légtechnika] Csőméretezés kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Pipette size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Csőméretezés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['kerek', 'negyszog'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.segmentBtn, pipeType === t && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Légtechnika] Cső típus:', t);
                  setPipeType(t);
                  setResult(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, pipeType === t && styles.segmentTextActive]}>
                  {t === 'kerek' ? 'Kerek' : 'Négyszög'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tömegáram ṁ (kg/h)</Text>
          <TextInput
            style={styles.input}
            value={massFlow}
            onChangeText={setMassFlow}
            keyboardType="numeric"
            placeholder="pl. 500"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {pipeType === 'kerek' && (
            <>
              <Text style={styles.label}>Max. sebesség v (m/s)</Text>
              <TextInput
                style={styles.input}
                value={maxVelocity}
                onChangeText={setMaxVelocity}
                keyboardType="numeric"
                placeholder="1.5"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          {pipeType === 'negyszog' && (
            <>
              <Text style={styles.label}>Szélesség a (mm)</Text>
              <TextInput
                style={styles.input}
                value={widthA}
                onChangeText={setWidthA}
                keyboardType="numeric"
                placeholder="pl. 50"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság b (mm)</Text>
              <TextInput
                style={styles.input}
                value={heightB}
                onChangeText={setHeightB}
                keyboardType="numeric"
                placeholder="pl. 30"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          <Text style={styles.label}>Közeg sűrűsége ρ (kg/m³)</Text>
          <TextInput
            style={styles.input}
            value={density}
            onChangeText={setDensity}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <TouchableOpacity
            style={styles.calcBtn}
            onPress={calculate}
            activeOpacity={0.8}
          >
            <Text style={styles.calcBtnText}>Kiszámít</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              {pipeType === 'kerek' ? (
                <>
                  <ResultRow label="Számított átmérő" value={result.calcDiameter} unit="mm" />
                  <ResultRow label="Ajánlott DN méret" value={result.recommendedDN} unit="DN" highlight={HVAC_BLUE} />
                  <ResultRow label="Tényleges sebesség" value={result.actualVelocity} unit="m/s" highlight={result.velocityColor} />
                </>
              ) : (
                <>
                  <ResultRow label="Keresztmetszet" value={result.crossSection} unit="cm²" />
                  <ResultRow label="Ekvivalens átmérő" value={result.eqDiameter} unit="mm" />
                  <ResultRow label="Tényleges sebesség" value={result.rectVelocity} unit="m/s" highlight={result.rectVelocityColor} />
                </>
              )}
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

export default function LegtechnikaScreen() {
  const isIOS = process.env.EXPO_OS === 'ios';
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={isIOS ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Légtechnika</Text>
        <DuctSizingTool />
        <PressureDropTool />
        <PipeSizingTool />
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
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
  },
  segmentBtnActive: {
    backgroundColor: HVAC_BLUE,
    borderColor: HVAC_BLUE,
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
  resultSectionLabel: {
    fontSize: 12,
    color: HVAC_TEXT_SECONDARY,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
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
