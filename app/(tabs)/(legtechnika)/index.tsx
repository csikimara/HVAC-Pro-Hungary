import React, { useState, useMemo } from 'react';
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
const STANDARD_DUCT_DIAMETERS = [80, 100, 125, 150, 160, 200, 250, 315, 355, 400, 450, 500, 560, 630];

function getVelocityColor(v: number): string {
  if (v <= 3.5) return HVAC_GREEN;
  if (v <= 5) return HVAC_YELLOW;
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
  const [airflow, setAirflow] = useState('');
  const [airflowUnit, setAirflowUnit] = useState<'m³/h' | 'l/s'>('m³/h');
  const [ductLength, setDuctLength] = useState('');
  const [lengthUnit, setLengthUnit] = useState<'m' | 'mm'>('m');
  const [ductSize, setDuctSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState<'mm' | 'cm'>('mm');
  const [roughness, setRoughness] = useState('');

  const result = useMemo(() => {
    const Q_raw = parseFloat(airflow);
    const D_raw = parseFloat(ductSize);
    const L_raw = parseFloat(ductLength);
    if (isNaN(Q_raw) || Q_raw <= 0 || isNaN(D_raw) || D_raw <= 0) return null;

    // Normalise units
    const Q = airflowUnit === 'm³/h' ? Q_raw / 3600 : Q_raw / 1000; // m³/s
    const D = sizeUnit === 'mm' ? D_raw / 1000 : D_raw / 100;        // m
    const L = isNaN(L_raw) || L_raw <= 0
      ? null
      : lengthUnit === 'm' ? L_raw : L_raw / 1000;                   // m

    const area = Math.PI * Math.pow(D, 2) / 4;
    const v = Q / area;

    // λ: if roughness field is a valid number treat it as λ directly, else default 0.02
    const lambdaInput = parseFloat(roughness);
    const lambda = !isNaN(lambdaInput) && lambdaInput > 0 ? lambdaInput : 0.02;

    const rho = 1.2; // kg/m³ air
    const R = lambda * (rho * Math.pow(v, 2)) / (2 * D); // Pa/m specific drop

    const deltaP = L !== null ? R * L : null;

    const vColor = v <= 3.5 ? HVAC_GREEN : v <= 5 ? HVAC_YELLOW : HVAC_RED;
    const rColor = R <= 1.0 ? HVAC_GREEN : R <= 2.0 ? HVAC_YELLOW : HVAC_RED;

    return {
      velocity: v.toFixed(2),
      velocityColor: vColor,
      pressureDrop: deltaP !== null ? deltaP.toFixed(2) : null,
      specificDrop: R.toFixed(3),
      specificColor: rColor,
    };
  }, [airflow, airflowUnit, ductSize, sizeUnit, ductLength, lengthUnit, roughness]);

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
          {/* Légszállítás */}
          <Text style={styles.label}>Légszállítás</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={airflow}
              onChangeText={text => {
                console.log('[Légtechnika] Nyomásesés légszállítás input:', text);
                setAirflow(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 500"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            {(['m³/h', 'l/s'] as const).map(u => {
              const isActive = airflowUnit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, isActive && styles.unitBtnActive]}
                  onPress={() => {
                    console.log('[Légtechnika] Nyomásesés légszállítás egység:', u);
                    setAirflowUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, isActive && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Csatornahossz */}
          <Text style={styles.label}>Csatornahossz</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={ductLength}
              onChangeText={text => {
                console.log('[Légtechnika] Nyomásesés csatornahossz input:', text);
                setDuctLength(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 10"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            {(['m', 'mm'] as const).map(u => {
              const isActive = lengthUnit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, isActive && styles.unitBtnActive]}
                  onPress={() => {
                    console.log('[Légtechnika] Nyomásesés hossz egység:', u);
                    setLengthUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, isActive && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Csatornaméret */}
          <Text style={styles.label}>Csatornaméret</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={ductSize}
              onChangeText={text => {
                console.log('[Légtechnika] Nyomásesés csatornaméret input:', text);
                setDuctSize(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 200"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            {(['mm', 'cm'] as const).map(u => {
              const isActive = sizeUnit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, isActive && styles.unitBtnActive]}
                  onPress={() => {
                    console.log('[Légtechnika] Nyomásesés méret egység:', u);
                    setSizeUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, isActive && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Anyag / érdesség */}
          <Text style={styles.label}>Anyag / érdesség</Text>
          <TextInput
            style={styles.input}
            value={roughness}
            onChangeText={text => {
              console.log('[Légtechnika] Nyomásesés érdesség input:', text);
              setRoughness(text);
            }}
            placeholder="pl. acél, beton, műanyag"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <ResultRow label="Légsebesség" value={result?.velocity ?? '—'} unit="m/s" highlight={result?.velocityColor} />
            <ResultRow label="Nyomásesés" value={result?.pressureDrop ?? '—'} unit="Pa" highlight={result?.pressureDrop ? HVAC_BLUE : undefined} />
            <ResultRow label="Fajlagos nyomásesés" value={result?.specificDrop ?? '—'} unit="Pa/m" highlight={result?.specificColor} />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Pipe Sizing ──────────────────────────────────────────────────────────────

function PipeSizingTool() {
  const [open, setOpen] = useState(true);
  const [shape, setShape] = useState<'kor' | 'teglalap'>('kor');
  const [airflow, setAirflow] = useState('');
  const [airflowUnit, setAirflowUnit] = useState<'m³/h' | 'l/s'>('m³/h');
  const [velocity, setVelocity] = useState('');
  const [rectWidth, setRectWidth] = useState('');
  const [rectHeight, setRectHeight] = useState('');

  const result = useMemo(() => {
    const Q_raw = parseFloat(airflow);
    const v = parseFloat(velocity);
    if (isNaN(Q_raw) || Q_raw <= 0) return null;

    // Normalise airflow to m³/s
    const Q = airflowUnit === 'm³/h' ? Q_raw / 3600 : Q_raw / 1000;

    if (shape === 'kor') {
      if (isNaN(v) || v <= 0) return null;
      const D_m = Math.sqrt((4 * Q) / (Math.PI * v));
      const D_mm = D_m * 1000;
      const stdD = STANDARD_DUCT_DIAMETERS.find(d => d >= D_mm) ?? STANDARD_DUCT_DIAMETERS[STANDARD_DUCT_DIAMETERS.length - 1];
      const areaStd = Math.PI * Math.pow(stdD / 1000, 2) / 4;
      const vActual = Q / areaStd;
      const vColor = vActual <= 3.5 ? HVAC_GREEN : vActual <= 5 ? HVAC_YELLOW : HVAC_RED;
      return {
        diameter: D_mm.toFixed(1),
        recommended: stdD.toString(),
        velocity: vActual.toFixed(2),
        velocityColor: vColor,
        // téglalap fields unused
        crossSection: null as string | null,
        eqDiameter: null as string | null,
      };
    } else {
      const a = parseFloat(rectWidth);
      const b = parseFloat(rectHeight);
      const hasDimensions = !isNaN(a) && !isNaN(b) && a > 0 && b > 0;
      const hasVelocity = !isNaN(v) && v > 0;

      if (hasDimensions) {
        // Both dimensions provided: compute area, velocity, and equivalent diameter
        const area = (a / 1000) * (b / 1000);
        const vActual = Q / area;
        const De = 1.3 * Math.pow((a / 1000) * (b / 1000), 0.625) / Math.pow((a + b) / 1000, 0.25) * 1000;
        const vColor = vActual <= 3.5 ? HVAC_GREEN : vActual <= 5 ? HVAC_YELLOW : HVAC_RED;
        console.log('[Légtechnika] Csőméretezés téglalap (méretek alapján): a=', a, 'b=', b, 'Q=', Q, 'area=', area, 'v=', vActual, 'De=', De);
        return {
          diameter: null as string | null,
          recommended: null as string | null,
          velocity: vActual.toFixed(2),
          velocityColor: vColor,
          crossSection: (area * 10000).toFixed(2),
          eqDiameter: De.toFixed(1),
        };
      } else if (hasVelocity) {
        // Only velocity provided: compute required cross-sectional area from Q and v
        const area = Q / v;
        const vColor = v <= 3.5 ? HVAC_GREEN : v <= 5 ? HVAC_YELLOW : HVAC_RED;
        console.log('[Légtechnika] Csőméretezés téglalap (sebesség alapján): Q=', Q, 'v=', v, 'szükséges terület=', area);
        return {
          diameter: null as string | null,
          recommended: null as string | null,
          velocity: v.toFixed(2),
          velocityColor: vColor,
          crossSection: (area * 10000).toFixed(2),
          eqDiameter: null as string | null,
        };
      } else {
        return null;
      }
    }
  }, [airflow, airflowUnit, velocity, shape, rectWidth, rectHeight]);

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
          {/* Shape selector */}
          <View style={styles.segmentRow}>
            {(['kor', 'teglalap'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segmentBtn, shape === s && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Légtechnika] Csőméretezés alakzat:', s);
                  setShape(s);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, shape === s && styles.segmentTextActive]}>
                  {s === 'kor' ? 'Kör' : 'Téglalap'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Légszállítás row */}
          <Text style={styles.label}>Légszállítás</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={airflow}
              onChangeText={text => {
                console.log('[Légtechnika] Csőméretezés légszállítás input:', text);
                setAirflow(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 500"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            {(['m³/h', 'l/s'] as const).map(u => {
              const isActive = airflowUnit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, isActive && styles.unitBtnActive]}
                  onPress={() => {
                    console.log('[Légtechnika] Csőméretezés légszállítás egység:', u);
                    setAirflowUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, isActive && styles.unitBtnTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sebesség row */}
          <Text style={styles.label}>Max. sebesség</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={velocity}
              onChangeText={text => {
                console.log('[Légtechnika] Csőméretezés sebesség input:', text);
                setVelocity(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 3.0"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            <View style={styles.unitBtn}>
              <Text style={styles.unitBtnText}>m/s</Text>
            </View>
          </View>

          {shape === 'teglalap' && (
            <>
              <Text style={styles.label}>Szélesség a (mm)</Text>
              <TextInput
                style={styles.input}
                value={rectWidth}
                onChangeText={setRectWidth}
                keyboardType="numeric"
                placeholder="pl. 400"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság b (mm)</Text>
              <TextInput
                style={styles.input}
                value={rectHeight}
                onChangeText={setRectHeight}
                keyboardType="numeric"
                placeholder="pl. 200"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          <View style={styles.resultBox}>
            {shape === 'kor' ? (
              <>
                <ResultRow label="Számított átmérő" value={result?.diameter ?? '—'} unit="mm" />
                <ResultRow label="Ajánlott méret" value={result?.recommended ?? '—'} unit="mm" highlight={result ? HVAC_BLUE : undefined} />
                <ResultRow label="Légsebesség" value={result?.velocity ?? '—'} unit="m/s" highlight={result?.velocityColor} />
              </>
            ) : (
              <>
                <ResultRow label="Keresztmetszet" value={result?.crossSection ?? '—'} unit="cm²" />
                <ResultRow label="Ekvivalens átmérő" value={result?.eqDiameter ?? '—'} unit="mm" />
                <ResultRow label="Légsebesség" value={result?.velocity ?? '—'} unit="m/s" highlight={result?.velocityColor} />
              </>
            )}
          </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    marginLeft: 6,
  },
  unitBtnActive: {
    backgroundColor: HVAC_BLUE,
    borderColor: HVAC_BLUE,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: HVAC_TEXT_SECONDARY,
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
});
