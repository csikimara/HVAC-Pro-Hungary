import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Zap, Activity, Cpu, Calculator, Receipt, ToggleLeft, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';
const HVAC_YELLOW = '#F59E0B';
const HVAC_RED = '#EF4444';
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
      setError('Legalább 2 értéket adj meg.');
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
      setError('Nem sikerült kiszámítani – ellenőrizd az értékeket.');
      setResult(null);
      return;
    }

    setResult({
      U: calcU.toFixed(2),
      I: calcI.toFixed(3),
      R: calcR.toFixed(3),
      P: Math.round(calcP).toString(),
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
          <Text style={styles.hintText}>Bármely 2 mező kitöltése esetén a többi kiszámításra kerül.</Text>

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
      S_VA: Math.round(S).toString(),
      S_kVA: (S / 1000).toFixed(3),
      P_W: Math.round(P).toString(),
      P_kW: (P / 1000).toFixed(3),
      Q_VAr: Math.round(Q).toString(),
      Q_kVAr: (Q / 1000).toFixed(3),
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
              <ResultRow label="Látszólagos S" value={result.S_VA} unit="VA" />
              <ResultRow label="" value={result.S_kVA} unit="kVA" />
              <View style={styles.divider} />
              <ResultRow label="Hatásos P" value={result.P_W} unit="W" highlight={HVAC_BLUE} />
              <ResultRow label="" value={result.P_kW} unit="kW" highlight={HVAC_BLUE} />
              <View style={styles.divider} />
              <ResultRow label="Meddő Q" value={result.Q_VAr} unit="VAr" />
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
      S_VA: Math.round(S).toString(),
      S_kVA: (S / 1000).toFixed(3),
      P_W: Math.round(P).toString(),
      P_kW: (P / 1000).toFixed(3),
      Q_VAr: Math.round(Q).toString(),
      Q_kVAr: (Q / 1000).toFixed(3),
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
              <ResultRow label="Fázisfeszültség" value={result.Uf} unit="V" highlight={HVAC_PURPLE} />
              <View style={styles.divider} />
              <ResultRow label="Látszólagos S" value={result.S_VA} unit="VA" />
              <ResultRow label="" value={result.S_kVA} unit="kVA" />
              <View style={styles.divider} />
              <ResultRow label="Hatásos P" value={result.P_W} unit="W" highlight={HVAC_BLUE} />
              <ResultRow label="" value={result.P_kW} unit="kW" highlight={HVAC_BLUE} />
              <View style={styles.divider} />
              <ResultRow label="Meddő Q" value={result.Q_VAr} unit="VAr" />
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

// ─── W/V/A kalkulátor ─────────────────────────────────────────────────────────

function WVAKalkulator() {
  const [open, setOpen] = useState(false);
  const [uInput, setUInput] = useState('');
  const [iInput, setIInput] = useState('');
  const [pInput, setPInput] = useState('');

  const result = useMemo(() => {
    const u = uInput !== '' ? parseFloat(uInput) : null;
    const i = iInput !== '' ? parseFloat(iInput) : null;
    const p = pInput !== '' ? parseFloat(pInput) : null;

    const filled = [u, i, p].filter(v => v !== null && !isNaN(v as number) && (v as number) > 0);

    if (filled.length < 2) return { error: 'Adj meg pontosan 2 értéket a számításhoz.' };
    if (filled.length > 2) return { error: 'Csak 2 értéket adj meg egyszerre.' };

    let calcU = (u !== null && !isNaN(u) && u > 0) ? u : null;
    let calcI = (i !== null && !isNaN(i) && i > 0) ? i : null;
    let calcP = (p !== null && !isNaN(p) && p > 0) ? p : null;

    if (calcU !== null && calcI !== null) calcP = calcU * calcI;
    else if (calcU !== null && calcP !== null) calcI = calcP / calcU;
    else if (calcI !== null && calcP !== null) calcU = calcP / calcI;

    return {
      error: null,
      u: calcU !== null ? calcU.toFixed(2) : '—',
      i: calcI !== null ? calcI.toFixed(3) : '—',
      p: calcP !== null ? Math.round(calcP).toString() : '—',
    };
  }, [uInput, iInput, pInput]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Villany] W/V/A kalkulátor toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Calculator size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>W/V/A kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Feszültség U (V)</Text>
          <TextInput
            style={styles.input}
            value={uInput}
            onChangeText={v => { console.log('[Villany] W/V/A U input:', v); setUInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 230"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Áramerősség I (A)</Text>
          <TextInput
            style={styles.input}
            value={iInput}
            onChangeText={v => { console.log('[Villany] W/V/A I input:', v); setIInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 10"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Teljesítmény P (W)</Text>
          <TextInput
            style={styles.input}
            value={pInput}
            onChangeText={v => { console.log('[Villany] W/V/A P input:', v); setPInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 2300"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {result?.error ? (
            <Text style={styles.errorText}>{result.error}</Text>
          ) : null}

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Feszültség</Text>
              <Text style={[styles.resultValue, { color: result?.error ? HVAC_TEXT_SECONDARY : HVAC_TEXT }]}>
                {result?.error ? '—' : result?.u} <Text style={styles.resultUnit}>V</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Áramerősség</Text>
              <Text style={[styles.resultValue, { color: result?.error ? HVAC_TEXT_SECONDARY : HVAC_TEXT }]}>
                {result?.error ? '—' : result?.i} <Text style={styles.resultUnit}>A</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Teljesítmény</Text>
              <Text style={[styles.resultValue, { color: result?.error ? HVAC_TEXT_SECONDARY : HVAC_TEXT }]}>
                {result?.error ? '—' : result?.p} <Text style={styles.resultUnit}>W</Text>
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 1f / 3f teljesítmény kalkulátor ─────────────────────────────────────────

function TeljesitmenyKalkulator() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'1f' | '3f'>('1f');
  const [uInput, setUInput] = useState('');
  const [iInput, setIInput] = useState('');
  const [cosInput, setCosInput] = useState('');

  const result = useMemo(() => {
    const u   = parseFloat(uInput);
    const i   = parseFloat(iInput);
    const cos = parseFloat(cosInput);
    if (isNaN(u) || u <= 0 || isNaN(i) || i <= 0) return null;
    const cosPhi = (!isNaN(cos) && cos > 0 && cos <= 1) ? cos : null;

    const factor = phase === '3f' ? Math.sqrt(3) : 1;
    const S = factor * u * i;
    const P = cosPhi !== null ? S * cosPhi : null;
    const Q = P !== null ? Math.sqrt(Math.max(0, S * S - P * P)) : null;

    return {
      S: Math.round(S).toString(),
      P: P !== null ? Math.round(P).toString() : null,
      Q: Q !== null ? Math.round(Q).toString() : null,
    };
  }, [uInput, iInput, cosInput, phase]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Villany] Teljesítmény kalkulátor toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <ToggleLeft size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>1f / 3f teljesítmény kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['1f', '3f'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.segmentBtn, phase === p && styles.segmentBtnActive]}
                onPress={() => { console.log('[Villany] Fázis:', p); setPhase(p); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, phase === p && styles.segmentBtnActiveText]}>
                  {p === '1f' ? 'Egyfázisú' : 'Háromfázisú'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Feszültség U (V)</Text>
          <TextInput
            style={styles.input}
            value={uInput}
            onChangeText={v => { console.log('[Villany] Teljesítmény U input:', v); setUInput(v); }}
            keyboardType="numeric"
            placeholder={phase === '1f' ? 'pl. 230' : 'pl. 400'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Áramerősség I (A)</Text>
          <TextInput
            style={styles.input}
            value={iInput}
            onChangeText={v => { console.log('[Villany] Teljesítmény I input:', v); setIInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 16"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Teljesítménytényező cos φ</Text>
          <TextInput
            style={styles.input}
            value={cosInput}
            onChangeText={v => { console.log('[Villany] Teljesítmény cos φ input:', v); setCosInput(v); }}
            keyboardType="numeric"
            placeholder="pl. 0.9"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Látszólagos S</Text>
              <Text style={[styles.resultValue, { color: result?.S != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>
                {result?.S ?? '—'} <Text style={styles.resultUnit}>VA</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Hatásos P</Text>
              <Text style={[styles.resultValue, { color: result?.P != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>
                {result?.P ?? '—'} <Text style={styles.resultUnit}>W</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Meddő Q</Text>
              <Text style={[styles.resultValue, { color: result?.Q != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>
                {result?.Q ?? '—'} <Text style={styles.resultUnit}>VAr</Text>
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 19, marginTop: 12 }}>
            P és Q számításához add meg a cos φ értéket is (0–1 között).
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Villanyszámla kalkulátor ─────────────────────────────────────────────────

function VillanyszamlaKalkulator() {
  const [open, setOpen] = useState(false);
  const [consumption, setConsumption] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [basePrice, setBasePrice] = useState('');

  const result = useMemo(() => {
    const c = parseFloat(consumption);
    const u = parseFloat(unitPrice);
    if (isNaN(c) || c <= 0 || isNaN(u) || u <= 0) return null;
    const consumptionFee = c * u;
    const base = parseFloat(basePrice);
    const baseFee = (!isNaN(base) && base >= 0) ? base : 0;
    const total = consumptionFee + baseFee;
    return {
      consumptionFee: Math.round(consumptionFee).toLocaleString('hu-HU'),
      baseFee: Math.round(baseFee).toLocaleString('hu-HU'),
      total: Math.round(total).toLocaleString('hu-HU'),
    };
  }, [consumption, unitPrice, basePrice]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Villany] Villanyszámla kalkulátor toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Receipt size={20} color={HVAC_PURPLE} />
          <Text style={styles.cardTitle}>Villanyszámla kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Fogyasztás (kWh)</Text>
          <TextInput
            style={styles.input}
            value={consumption}
            onChangeText={v => { console.log('[Villany] Villanyszámla fogyasztás input:', v); setConsumption(v); }}
            keyboardType="numeric"
            placeholder="pl. 350"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Egységár (Ft/kWh)</Text>
          <TextInput
            style={styles.input}
            value={unitPrice}
            onChangeText={v => { console.log('[Villany] Villanyszámla egységár input:', v); setUnitPrice(v); }}
            keyboardType="numeric"
            placeholder="pl. 36.4"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Alapdíj (Ft/hó) – opcionális</Text>
          <TextInput
            style={styles.input}
            value={basePrice}
            onChangeText={v => { console.log('[Villany] Villanyszámla alapdíj input:', v); setBasePrice(v); }}
            keyboardType="numeric"
            placeholder="pl. 1500"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Fogyasztási díj</Text>
              <Text style={[styles.resultValue, { color: result?.consumptionFee != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>
                {result?.consumptionFee ?? '—'} <Text style={styles.resultUnit}>Ft</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Alapdíj</Text>
              <Text style={[styles.resultValue, { color: result?.baseFee != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>
                {result?.baseFee ?? '—'} <Text style={styles.resultUnit}>Ft</Text>
              </Text>
            </View>
            <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 8, marginTop: 4 }]}>
              <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>Becsült számla</Text>
              <Text style={[styles.resultValue, { color: result ? HVAC_BLUE : HVAC_TEXT }]}>
                {result?.total ?? '—'} <Text style={styles.resultUnit}>Ft</Text>
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 19, marginTop: 12 }}>
            Az alapdíj opcionális – ha üresen hagyod, csak a fogyasztási díj kerül összesítésre.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VillanyScreen() {
  const router = useRouter();
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
        <Text style={styles.screenTitle}>Villany</Text>
        <OhmLawCalculator />
        <SinglePhasePower />
        <ThreePhasePower />
        <WVAKalkulator />
        <TeljesitmenyKalkulator />
        <VillanyszamlaKalkulator />
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
    paddingBottom: 20,
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
    marginBottom: 16,
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    color: HVAC_RED,
    marginBottom: 10,
  },
  resultBox: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 16,
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
    marginVertical: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: HVAC_SURFACE,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: HVAC_BLUE,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: HVAC_TEXT_SECONDARY,
  },
  segmentBtnActiveText: {
    color: '#FFFFFF',
  },
});
