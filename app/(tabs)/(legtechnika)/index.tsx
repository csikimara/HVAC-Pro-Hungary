import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pipette, Ruler, TrendingDown, Wind } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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

const FITTINGS: { label: string; K: number }[] = [
  { label: 'Könyök 90° (R/D=1)', K: 0.3 },
  { label: 'Könyök 90° (R/D=0.5)', K: 0.9 },
  { label: 'Könyök 45°', K: 0.15 },
  { label: 'T-idom (egyenes)', K: 0.1 },
  { label: 'T-idom (elágazás)', K: 1.0 },
  { label: 'Szűkítés (fokozatos)', K: 0.05 },
  { label: 'Bővítés (fokozatos)', K: 0.07 },
  { label: 'Belépés (éles perem)', K: 0.5 },
  { label: 'Kilépés (szabad)', K: 1.0 },
  { label: 'Visszacsapó szelep', K: 2.5 },
];

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
          <Text style={styles.cardTitle}>Légcsatorna-méretezés</Text>
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

          <Text style={styles.label}>Légmennyiség (m³/h)</Text>
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
              <Text style={styles.label}>Max. légsebesség (m/s)</Text>
              <TextInput
                style={styles.input}
                value={v}
                onChangeText={setV}
                keyboardType="numeric"
                placeholder="pl. 3,0"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          {ductType === 'teglalap' && (
            <>
              <Text style={styles.label}>Szélesség (mm)</Text>
              <TextInput
                style={styles.input}
                value={a}
                onChangeText={setA}
                keyboardType="numeric"
                placeholder="pl. 400"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság (mm)</Text>
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
            <Text style={styles.calcBtnText}>Számítás</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              {ductType === 'kor' ? (
                <>
                  <ResultRow label="Számított Ø" value={result.calcDiameter} unit="mm" />
                  <ResultRow label="Szabványméret" value={result.stdDiameter} unit="mm" highlight={HVAC_BLUE} />
                  <ResultRow label="Tényleges sebesség" value={result.actualVelocity} unit="m/s" highlight={result.velocityColor} />
                </>
              ) : (
                <>
                  <ResultRow label="Ekv. átmérő" value={result.eqDiameter} unit="mm" />
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
  const [ductShape, setDuctShape] = useState<'kor' | 'teglalap'>('kor');
  const [rectWidth, setRectWidth] = useState('');
  const [rectHeight, setRectHeight] = useState('');
  const [selectedFittings, setSelectedFittings] = useState<number[]>([]); // indices into FITTINGS
  const [fittingsOpen, setFittingsOpen] = useState(false);

  const result = useMemo(() => {
    const Q_raw = parseFloat(airflow);
    const L_raw = parseFloat(ductLength);
    if (isNaN(Q_raw) || Q_raw <= 0) return null;

    const Q = airflowUnit === 'm³/h' ? Q_raw / 3600 : Q_raw / 1000; // m³/s
    const L = isNaN(L_raw) || L_raw <= 0
      ? null
      : lengthUnit === 'm' ? L_raw : L_raw / 1000; // m

    const lambdaInput = parseFloat(roughness);
    const lambda = !isNaN(lambdaInput) && lambdaInput > 0 ? lambdaInput : 0.02;
    const rho = 1.2;

    let area: number;
    let D_h: number; // hydraulic diameter in metres for Darcy-Weisbach

    if (ductShape === 'kor') {
      const D_raw = parseFloat(ductSize);
      if (isNaN(D_raw) || D_raw <= 0) return null;
      const D = sizeUnit === 'mm' ? D_raw / 1000 : D_raw / 100;
      area = Math.PI * Math.pow(D, 2) / 4;
      D_h = D;
    } else {
      const a_raw = parseFloat(rectWidth);
      const b_raw = parseFloat(rectHeight);
      if (isNaN(a_raw) || a_raw <= 0 || isNaN(b_raw) || b_raw <= 0) return null;
      const a = a_raw / 1000; // m
      const b = b_raw / 1000; // m
      area = a * b;
      D_h = (2 * a * b) / (a + b); // hydraulic diameter
    }

    const v = Q / area;
    const R = lambda * (rho * Math.pow(v, 2)) / (2 * D_h);
    const deltaP = L !== null ? R * L : null;

    const dynPressure = 0.5 * rho * Math.pow(v, 2); // Pa
    const totalK = selectedFittings.reduce((sum, idx) => sum + FITTINGS[idx].K, 0);
    const fittingLoss = totalK > 0 ? totalK * dynPressure : null;
    const totalLoss = deltaP !== null || fittingLoss !== null
      ? (deltaP ?? 0) + (fittingLoss ?? 0)
      : null;

    const vColor = v <= 3.5 ? HVAC_GREEN : v <= 5 ? HVAC_YELLOW : HVAC_RED;
    const rColor = R <= 1.0 ? HVAC_GREEN : R <= 2.0 ? HVAC_YELLOW : HVAC_RED;

    return {
      velocity: v.toFixed(2),
      velocityColor: vColor,
      pressureDrop: deltaP !== null ? deltaP.toFixed(2) : null,
      specificDrop: R.toFixed(3),
      specificColor: rColor,
      fittingLoss: fittingLoss !== null ? fittingLoss.toFixed(2) : null,
      totalLoss: totalLoss !== null ? totalLoss.toFixed(2) : null,
    };
  }, [airflow, airflowUnit, ductSize, sizeUnit, ductLength, lengthUnit, roughness, ductShape, rectWidth, rectHeight, selectedFittings]);

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
          <Text style={styles.cardTitle}>Nyomásesés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['kor', 'teglalap'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segmentBtn, ductShape === s && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Légtechnika] Nyomásesés alakzat:', s);
                  setDuctShape(s);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, ductShape === s && styles.segmentTextActive]}>
                  {s === 'kor' ? 'Kör' : 'Téglalap'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Légmennyiség */}
          <Text style={styles.label}>Légmennyiség</Text>
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

          {/* Csatornaszakasz hossza */}
          <Text style={styles.label}>Csatornaszakasz hossza</Text>
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

          {/* Csatorna Ø */}
          {ductShape === 'kor' && (
            <>
              <Text style={styles.label}>Csatorna Ø</Text>
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
            </>
          )}

          {ductShape === 'teglalap' && (
            <>
              <Text style={styles.label}>Szélesség (mm)</Text>
              <TextInput
                style={styles.input}
                value={rectWidth}
                onChangeText={text => {
                  console.log('[Légtechnika] Nyomásesés szélesség input:', text);
                  setRectWidth(text);
                }}
                keyboardType="numeric"
                placeholder="pl. 400"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság (mm)</Text>
              <TextInput
                style={styles.input}
                value={rectHeight}
                onChangeText={text => {
                  console.log('[Légtechnika] Nyomásesés magasság input:', text);
                  setRectHeight(text);
                }}
                keyboardType="numeric"
                placeholder="pl. 200"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </>
          )}

          {/* Súrlódási tényező λ */}
          <Text style={styles.label}>Súrlódási tényező λ</Text>
          <TextInput
            style={styles.input}
            value={roughness}
            onChangeText={text => {
              console.log('[Légtechnika] Nyomásesés érdesség input:', text);
              setRoughness(text);
            }}
            placeholder="alapért. 0,02"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Idomveszteségek */}
          <TouchableOpacity
            style={[styles.segmentBtn, { alignSelf: 'flex-start', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            onPress={() => {
              console.log('[Légtechnika] Nyomásesés idomok toggled:', !fittingsOpen);
              setFittingsOpen(f => !f);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.segmentText}>
              Idomveszteségek {selectedFittings.length > 0 ? `(${selectedFittings.length})` : ''}
            </Text>
            {fittingsOpen
              ? <ChevronUp size={14} color={HVAC_TEXT_SECONDARY} />
              : <ChevronDown size={14} color={HVAC_TEXT_SECONDARY} />}
          </TouchableOpacity>

          {fittingsOpen && (
            <View style={{ marginBottom: 12, gap: 4 }}>
              {FITTINGS.map((f, idx) => {
                const active = selectedFittings.includes(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: active ? HVAC_BLUE + '22' : HVAC_SURFACE,
                      borderWidth: 1,
                      borderColor: active ? HVAC_BLUE : HVAC_BORDER,
                    }}
                    onPress={() => {
                      console.log('[Légtechnika] Nyomásesés idom toggled:', f.label, 'active:', !active);
                      setSelectedFittings(prev =>
                        active ? prev.filter(i => i !== idx) : [...prev, idx]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, color: active ? HVAC_TEXT : HVAC_TEXT_SECONDARY, flex: 1 }}>
                      {f.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: active ? HVAC_BLUE : HVAC_TEXT_SECONDARY, fontWeight: '600', marginLeft: 8 }}>
                      K = {f.K}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.noteText}>
            Az idom K-értékek tájékoztató jellegűek. A tényleges veszteség a geometriától és a gyártótól függ.
          </Text>

          <View style={styles.resultBox}>
            <ResultRow label="Légsebesség" value={result?.velocity ?? '—'} unit="m/s" highlight={result?.velocityColor} />
            <ResultRow label="Fajlagos nyomásesés" value={result?.specificDrop ?? '—'} unit="Pa/m" highlight={result?.specificColor} />
            <ResultRow label="Egyenes szakasz" value={result?.pressureDrop ?? '—'} unit="Pa" />
            <ResultRow label="Idomveszteség" value={result?.fittingLoss ?? '—'} unit="Pa" highlight={result?.fittingLoss ? HVAC_YELLOW : undefined} />
            <ResultRow label="Teljes nyomásesés" value={result?.totalLoss ?? '—'} unit="Pa" highlight={result?.totalLoss ? HVAC_BLUE : undefined} />
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
        const De = 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
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

          {/* Légmennyiség row */}
          <Text style={styles.label}>Légmennyiség</Text>
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
          <Text style={styles.label}>Max. légsebesség</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={velocity}
              onChangeText={text => {
                console.log('[Légtechnika] Csőméretezés sebesség input:', text);
                setVelocity(text);
              }}
              keyboardType="numeric"
              placeholder="pl. 3,0"
              placeholderTextColor={HVAC_TEXT_SECONDARY}
            />
            <View style={styles.unitBtn}>
              <Text style={styles.unitBtnText}>m/s</Text>
            </View>
          </View>

          {shape === 'teglalap' && (
            <>
              <Text style={styles.label}>Szélesség (mm)</Text>
              <TextInput
                style={styles.input}
                value={rectWidth}
                onChangeText={setRectWidth}
                keyboardType="numeric"
                placeholder="pl. 400"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
              <Text style={styles.label}>Magasság (mm)</Text>
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
                <ResultRow label="Számított Ø" value={result?.diameter ?? '—'} unit="mm" />
                <ResultRow label="Szabványméret" value={result?.recommended ?? '—'} unit="mm" highlight={result ? HVAC_BLUE : undefined} />
                <ResultRow label="Tényleges sebesség" value={result?.velocity ?? '—'} unit="m/s" highlight={result?.velocityColor} />
              </>
            ) : (
              <>
                <ResultRow label="Szükséges keresztmetszet" value={result?.crossSection ?? '—'} unit="cm²" />
                <ResultRow label="Ekv. átmérő" value={result?.eqDiameter ?? '—'} unit="mm" />
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
  const router = useRouter();
  const backBtn = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 16,
    alignSelf: 'flex-start' as const,
  };
  const backBtnText = {
    fontSize: 13,
    color: HVAC_BLUE,
    fontWeight: '500' as const,
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
          onPress={() => {
            console.log('[Légtechnika] Vissza a kezdőlapra');
            router.push('/(tabs)/(home)');
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={HVAC_BLUE} />
          <Text style={backBtnText}>Vissza a kezdőlapra</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Légtechnika</Text>
        <DuctSizingTool />
        <PressureDropTool />
        <PipeSizingTool />
        <TouchableOpacity
          style={{
            backgroundColor: HVAC_CARD,
            borderWidth: 1,
            borderColor: HVAC_BORDER,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
          onPress={() => {
            console.log('[Légtechnika] Navigálás: Légelosztás');
            router.push('/(tabs)/(legtechnika)/legelosztás');
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Wind size={20} color={HVAC_BLUE} />
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: HVAC_TEXT }}>Légelosztás</Text>
              <Text style={{ fontSize: 12, color: HVAC_TEXT_SECONDARY, marginTop: 2 }}>Ág tervezés · ESP ellenőrzés</Text>
            </View>
          </View>
          <ChevronRight size={18} color={HVAC_TEXT_SECONDARY} />
        </TouchableOpacity>
      </ScrollView>
    </View>
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
