import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Cpu, AlertTriangle, CheckCircle, XCircle, Gauge, Thermometer, Search, Zap, Home } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ToolGuide } from '@/components/AccuracyNotice';

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

type StatusLevel = 'normal' | 'warning' | 'critical';

function getStatusColor(level: StatusLevel): string {
  if (level === 'normal') return HVAC_GREEN;
  if (level === 'warning') return HVAC_YELLOW;
  return HVAC_RED;
}

function getStatusLabel(level: StatusLevel): string {
  if (level === 'normal') return 'Normál';
  if (level === 'warning') return 'Figyelem';
  return 'Kritikus';
}

function getCrStatus(cr: number): StatusLevel {
  if (cr >= 2.5 && cr <= 4.5) return 'normal';
  if ((cr > 4.5 && cr <= 6.0) || (cr >= 2.0 && cr < 2.5)) return 'warning';
  return 'critical';
}

function getShStatus(sh: number): StatusLevel {
  if (sh >= 5 && sh <= 15) return 'normal';
  if ((sh > 15 && sh <= 25) || (sh >= 3 && sh < 5)) return 'warning';
  return 'critical';
}

function getScStatus(sc: number): StatusLevel {
  if (sc >= 5 && sc <= 10) return 'normal';
  if ((sc > 10 && sc <= 15) || (sc >= 3 && sc < 5)) return 'warning';
  return 'critical';
}

function getTdStatus(td: number): StatusLevel {
  if (td <= 90) return 'normal';
  if (td <= 110) return 'warning';
  return 'critical';
}

function getCurrentStatus(pct: number): StatusLevel {
  if (pct <= 100) return 'normal';
  if (pct <= 115) return 'warning';
  return 'critical';
}

type DiagResult = {
  cr: number;
  crStatus: StatusLevel;
  sh: number;
  shStatus: StatusLevel;
  sc: number;
  scStatus: StatusLevel;
  td: number;
  tdStatus: StatusLevel;
  currentPct: number;
  currentStatus: StatusLevel;
  overall: StatusLevel;
};

function StatusBadge({ level }: { level: StatusLevel }) {
  const color = getStatusColor(level);
  const label = getStatusLabel(level);
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DiagRow({ label, value, unit, status }: { label: string; value: string; unit: string; status: StatusLevel }) {
  return (
    <View style={styles.diagRow}>
      <View style={styles.diagRowLeft}>
        <Text style={styles.diagLabel}>{label}</Text>
        <View style={styles.diagValueRow}>
          <Text style={[styles.diagValue, { color: getStatusColor(status) }]}>{value}</Text>
          <Text style={styles.diagUnit}> {unit}</Text>
        </View>
      </View>
      <StatusBadge level={status} />
    </View>
  );
}

function CompressorDiagnostics() {
  const [open, setOpen] = useState(true);
  const [Ps, setPs] = useState('');
  const [Pd, setPd] = useState('');
  const [Ts, setTs] = useState('');
  const [Td, setTd] = useState('');
  const [TsatS, setTsatS] = useState('');
  const [TsatD, setTsatD] = useState('');
  const [Tliq, setTliq] = useState('');
  const [I, setI] = useState('');
  const [Inom, setInom] = useState('');
  const [result, setResult] = useState<DiagResult | null>(null);

  function runDiagnostics() {
    console.log('[Diagnosztika] Kompresszor diagnosztika futtatása, Ps:', Ps, 'Pd:', Pd, 'Ts:', Ts, 'Td:', Td, 'T_sat_s:', TsatS, 'T_sat_d:', TsatD, 'T_liq:', Tliq, 'I:', I, 'I_nom:', Inom);
    const psVal = parseFloat(Ps);
    const pdVal = parseFloat(Pd);
    const tsVal = parseFloat(Ts);
    const tdVal = parseFloat(Td);
    const tsatSVal = parseFloat(TsatS);
    const tsatDVal = parseFloat(TsatD);
    const tliqVal = parseFloat(Tliq);
    const iVal = parseFloat(I);
    const inomVal = parseFloat(Inom);

    if (
      isNaN(psVal) || isNaN(pdVal) || isNaN(tsVal) || isNaN(tdVal) ||
      isNaN(tsatSVal) || isNaN(tsatDVal) || isNaN(tliqVal) ||
      isNaN(iVal) || isNaN(inomVal) || psVal <= 0 || inomVal <= 0
    ) {
      setResult(null);
      return;
    }

    const cr = pdVal / psVal;
    const sh = tsVal - tsatSVal;
    const sc = tsatDVal - tliqVal;
    const currentPct = (iVal / inomVal) * 100;

    const crStatus = getCrStatus(cr);
    const shStatus = getShStatus(sh);
    const scStatus = getScStatus(sc);
    const tdStatus = getTdStatus(tdVal);
    const currentStatus = getCurrentStatus(currentPct);

    const statuses: StatusLevel[] = [crStatus, shStatus, scStatus, tdStatus, currentStatus];
    let overall: StatusLevel = 'normal';
    if (statuses.includes('critical')) {
      overall = 'critical';
    } else if (statuses.includes('warning')) {
      overall = 'warning';
    }

    setResult({ cr, crStatus, sh, shStatus, sc, scStatus, td: tdVal, tdStatus, currentPct, currentStatus, overall });
  }

  const overallColor = result ? getStatusColor(result.overall) : HVAC_TEXT_SECONDARY;
  const overallText = result
    ? result.overall === 'critical'
      ? 'Azonnali beavatkozás szükséges!'
      : result.overall === 'warning'
        ? 'Ellenőrzés javasolt'
        : 'Rendszer normálisan működik'
    : null;

  const crVal = result ? result.cr.toFixed(2) : '—';
  const shVal = result ? result.sh.toFixed(1) : '—';
  const scVal = result ? result.sc.toFixed(1) : '—';
  const tdVal = result ? result.td.toFixed(1) : '—';
  const currentPctVal = result ? result.currentPct.toFixed(1) : '—';

  function getRecommendations(r: DiagResult): string[] {
    const recs: string[] = [];

    if (r.shStatus === 'critical' && r.sh < 3) {
      recs.push('• Folyadékos visszaszívás veszélye! Ellenőrizd az expanziós szelepet és az elpárologtató töltetet. Azonnali leállítás javasolt.');
    }
    if (r.shStatus === 'critical' && r.sh > 25) {
      recs.push('• Túl magas szívócső túlhevítés. Valószínű ok: alacsony hűtőközeg töltés vagy elzárt szívószelep. Ellenőrizd a töltetet és a szívóvezetéket.');
    }
    if (r.shStatus === 'warning' && r.sh > 15) {
      recs.push('• Emelkedett túlhevítés. Ellenőrizd a hűtőközeg töltetet és az expanziós szelep beállítását.');
    }
    if (r.shStatus === 'warning' && r.sh < 5) {
      recs.push('• Alacsony túlhevítés. Figyelj a folyadékos visszaszívás jelére, ellenőrizd az elpárologtatót.');
    }

    if (r.scStatus === 'critical' && r.sc < 3) {
      recs.push('• Alacsony alűtés: lehetséges hűtőközeg hiány vagy gőzbuborék a folyadékvezetékben. Ellenőrizd a töltetet és a szárítószűrőt.');
    }
    if (r.scStatus === 'critical' && r.sc > 15) {
      recs.push('• Magas alűtés: lehetséges túltöltés vagy kondenzátor hőátadási probléma. Ellenőrizd a kondenzátort és a töltetet.');
    }
    if (r.scStatus === 'warning') {
      recs.push('• Alűtés a határon. Ellenőrizd a kondenzátor tisztaságát és a hűtőközeg töltetet.');
    }

    if (r.crStatus === 'critical' && r.cr > 6.0) {
      recs.push('• Kritikusan magas kompresszió arány. Ellenőrizd a kondenzátor hőcserélőt, a hűtőventilátor működését és a hűtőközeg töltetet.');
    }
    if (r.crStatus === 'critical' && r.cr < 2.0) {
      recs.push('• Kritikusan alacsony kompresszió arány. Lehetséges kompresszor meghibásodás vagy súlyos hűtőközeg szivárgás.');
    }
    if (r.crStatus === 'warning') {
      recs.push('• Emelkedett kompresszió arány. Figyelj a kondenzátor tisztaságára és a környezeti hőmérsékletre.');
    }

    if (r.tdStatus === 'critical') {
      recs.push('• Kritikusan magas nyomóhőmérséklet! Azonnali leállítás javasolt. Ellenőrizd a kenőolajat, a hűtőközeg töltetet és a kondenzátort.');
    }
    if (r.tdStatus === 'warning') {
      recs.push('• Emelkedett nyomóhőmérséklet. Ellenőrizd a kondenzátor hőátadását és a hűtőközeg töltetet.');
    }

    if (r.currentStatus === 'critical') {
      recs.push('• Súlyos túlterhelés! Ellenőrizd a tápfeszültséget, a kompresszor tekercselését és a kondenzátort. Azonnali beavatkozás szükséges.');
    }
    if (r.currentStatus === 'warning') {
      recs.push('• Közel névleges vagy enyhén túlterhelt. Figyelj a hőmérsékleti viszonyokra és a tápfeszültségre.');
    }

    if (recs.length === 0) {
      recs.push('• Minden mért paraméter normál tartományban van. A kompresszor megfelelően működik.');
      recs.push('• Következő ellenőrzés: 3 hónap múlva vagy a következő karbantartáskor.');
    }
    return recs;
  }

  const recommendations = result ? getRecommendations(result) : [];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Diagnosztika] Kompresszor kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Cpu size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Kompresszor diagnosztika</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Section A */}
          <Text style={styles.sectionHeader}>A — Mért értékek</Text>

          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Szívónyomás P_s (bar)</Text>
              <TextInput
                style={styles.input}
                value={Ps}
                onChangeText={setPs}
                keyboardType="numeric"
                placeholder="pl. 5"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Nyomónyomás P_d (bar)</Text>
              <TextInput
                style={styles.input}
                value={Pd}
                onChangeText={setPd}
                keyboardType="numeric"
                placeholder="pl. 20"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Szívóhőmérséklet T_s (°C)</Text>
              <TextInput
                style={styles.input}
                value={Ts}
                onChangeText={setTs}
                keyboardType="numeric"
                placeholder="pl. 10"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Nyomóhőmérséklet T_d (°C)</Text>
              <TextInput
                style={styles.input}
                value={Td}
                onChangeText={setTd}
                keyboardType="numeric"
                placeholder="pl. 70"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Szívóoldali telítési hőm. T_sat_s (°C)</Text>
              <TextInput
                style={styles.input}
                value={TsatS}
                onChangeText={setTsatS}
                keyboardType="numeric"
                placeholder="pl. 5"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Nyomóoldali telítési hőm. T_sat_d (°C)</Text>
              <TextInput
                style={styles.input}
                value={TsatD}
                onChangeText={setTsatD}
                keyboardType="numeric"
                placeholder="pl. 45"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
          </View>

          <Text style={styles.label}>Folyadékhőmérséklet T_liq (°C)</Text>
          <TextInput
            style={styles.input}
            value={Tliq}
            onChangeText={setTliq}
            keyboardType="numeric"
            placeholder="pl. 38"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Felvett áram I (A)</Text>
              <TextInput
                style={styles.input}
                value={I}
                onChangeText={setI}
                keyboardType="numeric"
                placeholder="pl. 8"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Névleges áram I_nom (A)</Text>
              <TextInput
                style={styles.input}
                value={Inom}
                onChangeText={setInom}
                keyboardType="numeric"
                placeholder="pl. 10"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            </View>
          </View>

          {/* Section B */}
          <Text style={styles.sectionHeader}>B — Számítások</Text>
          <TouchableOpacity style={styles.calcBtn} onPress={runDiagnostics} activeOpacity={0.8}>
            <Text style={styles.calcBtnText}>Diagnosztika futtatása</Text>
          </TouchableOpacity>

          {/* Section C */}
          {result && (
            <>
              <Text style={styles.sectionHeader}>C — Eredmény</Text>

              {/* Overall status */}
              <View style={[styles.overallCard, { borderColor: overallColor, backgroundColor: overallColor + '18' }]}>
                <View style={styles.overallIconRow}>
                  {result.overall === 'normal' && <CheckCircle size={22} color={HVAC_GREEN} />}
                  {result.overall === 'warning' && <AlertTriangle size={22} color={HVAC_YELLOW} />}
                  {result.overall === 'critical' && <XCircle size={22} color={HVAC_RED} />}
                  <Text style={[styles.overallText, { color: overallColor }]}>{overallText}</Text>
                </View>
              </View>

              {/* Parameter rows */}
              <View style={styles.resultBox}>
                <DiagRow
                  label="Kompresszióviszony CR"
                  value={crVal}
                  unit=""
                  status={result.crStatus}
                />
                <View style={styles.divider} />
                <DiagRow
                  label="Túlhevítés SH"
                  value={shVal}
                  unit="°C"
                  status={result.shStatus}
                />
                <View style={styles.divider} />
                <DiagRow
                  label="Alűtés SC"
                  value={scVal}
                  unit="°C"
                  status={result.scStatus}
                />
                <View style={styles.divider} />
                <DiagRow
                  label="Nyomóhőmérséklet"
                  value={tdVal}
                  unit="°C"
                  status={result.tdStatus}
                />
                <View style={styles.divider} />
                <DiagRow
                  label="Áramterhelés"
                  value={currentPctVal}
                  unit="%"
                  status={result.currentStatus}
                />
              </View>

              {/* Recommendations */}
              <View style={styles.recsCard}>
                <Text style={styles.recsTitle}>Javaslatok</Text>
                {recommendations.map((rec, idx) => (
                  <Text key={idx} style={styles.recText}>{rec}</Text>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Kompresszióviszony kalkulátor ────────────────────────────────────────────

function KompresszioviszonyKalkulator() {
  const [open, setOpen] = useState(false);
  const [suctionInput, setSuctionInput] = useState('');
  const [dischargeInput, setDischargeInput] = useState('');
  const [unit, setUnit] = useState<'bar_g' | 'bar_abs' | 'kPa_g' | 'psig'>('bar_g');

  const UNITS: Array<{ key: 'bar_g' | 'bar_abs' | 'kPa_g' | 'psig'; label: string }> = [
    { key: 'bar_g',   label: 'bar (rel)' },
    { key: 'bar_abs', label: 'bar (abs)' },
    { key: 'kPa_g',   label: 'kPa (rel)' },
    { key: 'psig',    label: 'psig' },
  ];

  // Convert to absolute bar
  function toAbsBar(val: number, u: string): number {
    if (u === 'bar_g')   return val + 1.01325;
    if (u === 'bar_abs') return val;
    if (u === 'kPa_g')   return val / 100 + 1.01325;
    if (u === 'psig')    return val * 0.0689476 + 1.01325;
    return val;
  }

  const result = useMemo(() => {
    const s = parseFloat(suctionInput);
    const d = parseFloat(dischargeInput);
    if (isNaN(s) || s < 0 || isNaN(d) || d < 0) return null;

    const sAbs = toAbsBar(s, unit);
    const dAbs = toAbsBar(d, unit);
    if (sAbs <= 0) return null;

    const cr = dAbs / sAbs;

    let rating: string;
    let ratingColor: string;
    if (cr < 2.5)                    { rating = 'Alacsony';  ratingColor = HVAC_YELLOW; }
    else if (cr >= 2.5 && cr <= 4.5) { rating = 'Normál';    ratingColor = HVAC_GREEN;  }
    else if (cr > 4.5 && cr <= 6.0)  { rating = 'Magas';     ratingColor = HVAC_YELLOW; }
    else                             { rating = 'Kritikus';  ratingColor = HVAC_RED;    }

    return {
      sAbs: sAbs.toFixed(3),
      dAbs: dAbs.toFixed(3),
      cr: cr.toFixed(2),
      rating,
      ratingColor,
    };
  }, [suctionInput, dischargeInput, unit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Diagnosztika] Kompresszióviszony kalkulátor toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Gauge size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Kompresszióviszony kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Nyomásegység</Text>
          <View style={[styles.segmentRow, { flexWrap: 'wrap', height: undefined }]}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u.key}
                style={[styles.segmentBtn, { flex: undefined, paddingHorizontal: 14 }, unit === u.key && styles.segmentBtnActive]}
                onPress={() => { console.log('[Diagnosztika] Kompresszióviszony unit:', u.key); setUnit(u.key); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, unit === u.key && styles.segmentBtnActiveText]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Szívónyomás ({unit === 'kPa_g' ? 'kPa rel' : unit === 'psig' ? 'psig' : unit === 'bar_abs' ? 'bar abs' : 'bar rel'})</Text>
          <TextInput
            style={styles.input}
            value={suctionInput}
            onChangeText={v => { console.log('[Diagnosztika] Szívónyomás input:', v); setSuctionInput(v); }}
            keyboardType="numeric"
            placeholder={unit === 'kPa_g' ? 'pl. 450' : unit === 'psig' ? 'pl. 65' : 'pl. 5.5'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Nyomónyomás ({unit === 'kPa_g' ? 'kPa rel' : unit === 'psig' ? 'psig' : unit === 'bar_abs' ? 'bar abs' : 'bar rel'})</Text>
          <TextInput
            style={styles.input}
            value={dischargeInput}
            onChangeText={v => { console.log('[Diagnosztika] Nyomónyomás input:', v); setDischargeInput(v); }}
            keyboardType="numeric"
            placeholder={unit === 'kPa_g' ? 'pl. 2100' : unit === 'psig' ? 'pl. 305' : 'pl. 22'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Szívónyomás abs.</Text>
              <Text style={[styles.resultValue, { color: result?.sAbs != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>{result?.sAbs ?? '—'} <Text style={styles.resultUnit}>bar</Text></Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Nyomónyomás abs.</Text>
              <Text style={[styles.resultValue, { color: result?.dAbs != null ? HVAC_TEXT : HVAC_TEXT_SECONDARY }]}>{result?.dAbs ?? '—'} <Text style={styles.resultUnit}>bar</Text></Text>
            </View>
            <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 8, marginTop: 4 }]}>
              <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>Kompresszióviszony</Text>
              <Text style={[styles.resultValue, { color: result?.ratingColor ?? HVAC_TEXT }]}>{result?.cr ?? '—'}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Értékelés</Text>
              <Text style={[styles.resultValue, { color: result?.ratingColor ?? HVAC_TEXT_SECONDARY }]}>{result?.rating ?? '—'}</Text>
            </View>
          </View>

          <Text style={styles.noteText}>
            Normál tartomány: 2,5–4,5. Konverzió: 1,01325 bar atmoszferikus nyomással.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Delta T kalkulátor ───────────────────────────────────────────────────────

function DeltaTKalkulator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hutés' | 'fűtés'>('hutés');
  const [supplyInput, setSupplyInput] = useState('');
  const [returnInput, setReturnInput] = useState('');

  const result = useMemo(() => {
    const supply = parseFloat(supplyInput);
    const ret    = parseFloat(returnInput);
    if (isNaN(supply) || isNaN(ret)) return null;

    const delta = mode === 'hutés' ? ret - supply : supply - ret;

    let rating: string;
    let ratingColor: string;
    if (delta < 6)                    { rating = 'Alacsony';    ratingColor = HVAC_YELLOW; }
    else if (delta >= 6 && delta <= 14) { rating = 'Megfelelő';  ratingColor = HVAC_GREEN;  }
    else                              { rating = 'Magas';       ratingColor = HVAC_YELLOW; }

    return { delta: delta.toFixed(1), rating, ratingColor };
  }, [supplyInput, returnInput, mode]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Diagnosztika] Delta T kalkulátor toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Thermometer size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Delta T kalkulátor</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {(['hutés', 'fűtés'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentBtn, mode === m && styles.segmentBtnActive]}
                onPress={() => { console.log('[Diagnosztika] Delta T mód:', m); setMode(m); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentBtnActiveText]}>
                  {m === 'hutés' ? 'Hűtés' : 'Fűtés'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Befúvó levegő hőmérséklete (°C)</Text>
          <TextInput
            style={styles.input}
            value={supplyInput}
            onChangeText={v => { console.log('[Diagnosztika] Delta T befúvó input:', v); setSupplyInput(v); }}
            keyboardType="numeric"
            placeholder={mode === 'hutés' ? 'pl. 12' : 'pl. 40'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Visszatérő levegő hőmérséklete (°C)</Text>
          <TextInput
            style={styles.input}
            value={returnInput}
            onChangeText={v => { console.log('[Diagnosztika] Delta T visszatérő input:', v); setReturnInput(v); }}
            keyboardType="numeric"
            placeholder={mode === 'hutés' ? 'pl. 24' : 'pl. 22'}
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <View style={[styles.resultRow, { borderBottomWidth: 1, borderBottomColor: HVAC_BORDER, paddingBottom: 8 }]}>
              <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>ΔT</Text>
              <Text style={[styles.resultValue, { color: result?.ratingColor ?? HVAC_TEXT }]}>
                {result?.delta ?? '—'} <Text style={styles.resultUnit}>K</Text>
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Értékelés</Text>
              <Text style={[styles.resultValue, { color: result?.ratingColor ?? HVAC_TEXT_SECONDARY }]}>
                {result?.rating ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.noteText}>
            {mode === 'hutés'
              ? 'Hűtés: ΔT = visszatérő − befúvó. Normál tartomány: 6–14 K.'
              : 'Fűtés: ΔT = befúvó − visszatérő. Normál tartomány: 6–14 K.'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Gyors hibagyanú ──────────────────────────────────────────────────────────

function GyorsHibagyanú() {
  const [open, setOpen] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [compState, setCompState] = useState<'Fut' | 'Leáll' | 'Nem indul' | null>(null);
  const [errorCode, setErrorCode] = useState('');

  const result = useMemo(() => {
    const text = symptom.toLowerCase();
    const hasText = text.trim().length > 0;
    const hasComp = compState !== null;
    if (!hasText && !hasComp) return null;

    // Keyword rules — order matters, first match wins
    type Rule = { keywords: string[]; suspicion: string; step: string };
    const rules: Rule[] = [
      { keywords: ['alultölt', 'kevés hűtőközeg', 'nem hűt', 'gyengén hűt', 'alacsony nyomás'],
        suspicion: 'Valószínű alultöltés vagy hűtőközeg-szivárgás',
        step: 'Ellenőrizd a szívó- és nyomónyomást, mérd meg a túlhevítést (SH)' },
      { keywords: ['túltölt', 'magas nyomás', 'magas kondenzációs'],
        suspicion: 'Valószínű túltöltés vagy kondenzátor-probléma',
        step: 'Ellenőrizd a kondenzációs nyomást és az utóhűtést (SC)' },
      { keywords: ['zajos', 'zaj', 'csörög', 'kopog', 'rezeg'],
        suspicion: 'Valószínű mechanikai probléma (kompresszor, ventilátor vagy rögzítés)',
        step: 'Azonosítsd a zaj forrását, ellenőrizd a rögzítőelemeket és a ventilátort' },
      { keywords: ['leáll', 'kikapcsol', 'védelmi leállás', 'hőkioldó'],
        suspicion: 'Valószínű védelmi leállás (hő, nyomás vagy áramvédelem)',
        step: 'Ellenőrizd a hibakódot, mérd meg az áramfelvételt és a nyomásokat' },
      { keywords: ['nem indul', 'nem kapcsol be', 'nem reagál'],
        suspicion: 'Valószínű vezérlési, tápellátási vagy indítási probléma',
        step: 'Ellenőrizd a tápfeszültséget, a biztosítékot és a vezérlőjelet' },
      { keywords: ['jegesed', 'befagy', 'jég'],
        suspicion: 'Valószínű alacsony légáram vagy alultöltés miatti jegesedés',
        step: 'Ellenőrizd a szűrőt, a légáramot és a szívónyomást' },
      { keywords: ['nem fűt', 'gyengén fűt', 'hideg levegő fűtés közben'],
        suspicion: 'Valószínű négyutas szelep- vagy hűtőközeg-probléma fűtés módban',
        step: 'Ellenőrizd a négyutas szelep működését és a nyomásokat fűtés módban' },
      { keywords: ['csöpög', 'víz', 'kondenzvíz', 'lefolyó'],
        suspicion: 'Valószínű eltömődött kondenzvíz-elvezető',
        step: 'Tisztítsd meg a kondenzvíz-lefolyót és ellenőrizd a tálcát' },
      { keywords: ['büdös', 'szag', 'penész', 'dohos'],
        suspicion: 'Valószínű szennyezett hőcserélő vagy szűrő',
        step: 'Tisztítsd meg a beltéri egységet és a szűrőt' },
      { keywords: ['magas áram', 'túláram', 'biztosíték'],
        suspicion: 'Valószínű elektromos terhelési vagy kompresszor-probléma',
        step: 'Mérd meg az áramfelvételt és hasonlítsd össze a névleges értékkel' },
    ];

    // Kompresszor állapot rules
    type CompRule = { state: string; suspicion: string; step: string };
    const compRules: CompRule[] = [
      { state: 'Nem indul',
        suspicion: 'Valószínű indítási, vezérlési vagy tápellátási hiba',
        step: 'Ellenőrizd a tápfeszültséget, a kondenzátort és a vezérlőjelet' },
      { state: 'Leáll',
        suspicion: 'Valószínű védelmi leállás (hő, nyomás vagy áramvédelem)',
        step: 'Olvasd le a hibakódot, mérd meg az áramfelvételt és a nyomásokat' },
    ];

    let suspicion = '';
    let step = '';

    // Text-based match
    for (const rule of rules) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        suspicion = rule.suspicion;
        step = rule.step;
        break;
      }
    }

    // Compressor state override or supplement
    if (compState && compState !== 'Fut') {
      const cr = compRules.find(r => r.state === compState);
      if (cr) {
        if (!suspicion) {
          suspicion = cr.suspicion;
          step = cr.step;
        } else {
          step = `${step}; ${cr.step}`;
        }
      }
    }

    // Fallback
    if (!suspicion) {
      suspicion = 'Nem sikerült egyértelmű hibagyanút azonosítani';
      step = 'Mérd meg a nyomásokat, hőmérsékleteket és az áramfelvételt';
    }

    return { suspicion, step };
  }, [symptom, compState]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => { console.log('[Diagnosztika] Gyors hibagyanú toggled'); setOpen(o => !o); }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Search size={20} color={HVAC_RED} />
          <Text style={styles.cardTitle}>Gyors hibagyanú</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Tünet leírása</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={symptom}
            onChangeText={v => { console.log('[Diagnosztika] Gyors hibagyanú tünet input:', v); setSymptom(v); }}
            multiline
            placeholder="pl. nem hűt, zajos, leáll..."
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Kompresszor állapota</Text>
          <View style={styles.segmentRow}>
            {(['Fut', 'Leáll', 'Nem indul'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segmentBtn, compState === s && styles.segmentBtnActive]}
                onPress={() => { console.log('[Diagnosztika] Kompresszor állapot:', s); setCompState(prev => prev === s ? null : s); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, compState === s && styles.segmentBtnActiveText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Hibajelzés / hibakód – csak tájékoztatásul, nem befolyásolja az eredményt</Text>
          <TextInput
            style={styles.input}
            value={errorCode}
            onChangeText={v => { console.log('[Diagnosztika] Hibakód input:', v); setErrorCode(v); }}
            placeholder="pl. E1, F3, vagy nincs"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { flex: 0.45 }]}>Valószínű hibagyanú</Text>
              <Text style={[styles.resultValue, { fontSize: 14, flex: 0.55, textAlign: 'right', color: result ? HVAC_YELLOW : HVAC_TEXT_SECONDARY }]}>
                {result?.suspicion ?? '—'}
              </Text>
            </View>
            <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 8, marginTop: 4 }]}>
              <Text style={[styles.resultLabel, { flex: 0.45 }]}>Javasolt első lépés</Text>
              <Text style={[styles.resultValue, { fontSize: 14, flex: 0.55, textAlign: 'right', color: result ? HVAC_BLUE : HVAC_TEXT_SECONDARY }]}>
                {result?.step ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.noteText}>
            Kulcsszó-alapú becslés – nem helyettesíti a műszeres mérést.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Kompresszor elektromos ellenőrzés ───────────────────────────────────────

function KompresszorElektromosEllenorzes() {
  const [open, setOpen] = useState(true);
  const [cr, setCr] = useState('');
  const [cs, setCs] = useState('');
  const [rs, setRs] = useState('');
  const [leadResistance, setLeadResistance] = useState('0');
  const [groundStatus, setGroundStatus] = useState<'not-measured' | 'ol' | 'conductive'>('not-measured');

  const result = useMemo(() => {
    const crV = parseFloat(cr);
    const csV = parseFloat(cs);
    const rsV = parseFloat(rs);
    const leadRaw = parseFloat(leadResistance);
    const lead = !isNaN(leadRaw) && leadRaw >= 0 ? leadRaw : 0;
    const hasAll = [crV, csV, rsV].every(value => !isNaN(value) && value >= 0);

    if (!hasAll && groundStatus === 'not-measured') return null;
    const notes: string[] = [];
    const steps: string[] = [];

    if (groundStatus === 'conductive') {
      notes.push('A multiméter vezetést jelez a kapocs és a kompresszorház között');
      steps.push('Ne helyezd feszültség alá; válaszd le a bekötést, majd ellenőrizd külön a kábelt és a kompresszort');
    } else if (groundStatus === 'ol') {
      steps.push('Multiméterrel nem észlelhető testzárlat; ez nem szigetelésvizsgálat');
    }

    if (hasAll) {
      const crCorrected = crV - lead;
      const csCorrected = csV - lead;
      const rsCorrected = rsV - lead;
      if (crCorrected < 0 || csCorrected < 0 || rsCorrected < 0) {
        notes.push('A mérővezeték-ellenállás nagyobb valamelyik mért értéknél');
        steps.push('Nullázd a műszert vagy mérd meg újra a mérővezetékek ellenállását');
      } else {
        const signedDifference = crCorrected + csCorrected - rsCorrected;
        notes.push(`Összegeltérés: ${signedDifference >= 0 ? '+' : ''}${signedDifference.toFixed(3)} Ω`);
        steps.push('Az elfogadhatóságot a műszer pontossága és a kompresszor gyártói tűrése alapján ítéld meg');
      }
    } else {
      steps.push('Add meg mindhárom kapocspár ellenállását');
    }

    return {
      suspicion: notes.join('; ') || 'Nincs automatikusan minősíthető hiba',
      step: steps.join('; '),
      color: groundStatus === 'conductive' ? HVAC_RED : HVAC_YELLOW,
    };
  }, [cr, cs, rs, leadResistance, groundStatus]);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen(value => !value)} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Zap size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Kompresszor C–R–S ellenőrzés</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && <View style={styles.cardBody}>
        <Text style={[styles.noteText, { marginTop: 0 }]}>Áramtalanított állapotban mérj. Az app önkényes százalékos tűrés nélkül mutatja az összegeltérést.</Text>
        {[
          ['C–R üzemi tekercs (Ω)', cr, setCr],
          ['C–S indítótekercs (Ω)', cs, setCs],
          ['R–S összes ellenállás (Ω)', rs, setRs],
        ].map(([label, value, setter]) => <React.Fragment key={label as string}>
          <Text style={styles.label}>{label as string}</Text>
          <TextInput style={styles.input} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="numeric" placeholder="pl. 2.5" placeholderTextColor={HVAC_TEXT_SECONDARY} />
        </React.Fragment>)}

        <Text style={styles.label}>Mérővezetékek ellenállása (Ω)</Text>
        <TextInput style={styles.input} value={leadResistance} onChangeText={setLeadResistance} keyboardType="numeric" placeholder="pl. 0.2" placeholderTextColor={HVAC_TEXT_SECONDARY} />

        <Text style={styles.label}>Kapocs–kompresszorház multiméterrel</Text>
        <View style={styles.segmentRow}>
          {([
            ['not-measured', 'Nem mértem'],
            ['ol', 'OL'],
            ['conductive', 'Vezetést mutat'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity key={value} style={[styles.segmentBtn, groundStatus === value && styles.segmentBtnActive]} onPress={() => setGroundStatus(value)}>
              <Text style={[styles.segmentText, groundStatus === value && styles.segmentBtnActiveText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.resultBox}>
          <View style={styles.resultRow}><Text style={[styles.resultLabel, { flex: 0.4 }]}>Eredmény</Text><Text style={[styles.resultValue, { fontSize: 14, flex: 0.6, textAlign: 'right', color: result?.color ?? HVAC_TEXT_SECONDARY }]}>{result?.suspicion ?? '—'}</Text></View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 8, marginTop: 4 }]}><Text style={[styles.resultLabel, { flex: 0.4 }]}>Teendő</Text><Text style={[styles.resultValue, { fontSize: 14, flex: 0.6, textAlign: 'right', color: result ? HVAC_BLUE : HVAC_TEXT_SECONDARY }]}>{result?.step ?? '—'}</Text></View>
        </View>
        <Text style={styles.noteText}>C–R + C–S = R–S a mérővezeték ellenállásának levonása után. A gyári tekercsérték és tűrés nélkül az app nem mondja rá a kompresszorra, hogy jó vagy rossz. A ház felé mért OL nem helyettesíti a szigetelésvizsgálatot.</Text>
      </View>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiagnosztikaSreen() {
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
        <Text style={styles.screenTitle}>{tool ? 'Mérés ellenőrzése' : 'Diagnosztika'}</Text>
        {tool === 'compressor-electrical' && <>
          <ToolGuide title="Kompresszor C–R–S ellenőrzése" useWhen="Egyfázisú kompresszor kapcsain mért tekercsellenállások kapcsolatát és a ház felé mérhető vezetést ellenőrzöd." needs="C–R, C–S, R–S, mérővezeték-ellenállás, valamint a kapcsok és a ház közötti multiméteres eredmény." accuracy="engineering" accuracyNote="Az összegellenőrzés pontos, de gyári tekercsérték és tűrés nélkül nem minősíti a tekercs állapotát. A multiméteres OL nem szigetelésvizsgálat." />
          <KompresszorElektromosEllenorzes />
        </>}
        {!tool && <><CompressorDiagnostics /><KompresszioviszonyKalkulator /><DeltaTKalkulator /><GyorsHibagyanú /><KompresszorElektromosEllenorzes /></>}
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: HVAC_TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: HVAC_TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 12,
    padding: 12,
    color: HVAC_TEXT,
    fontSize: 15,
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
  overallCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  overallIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overallText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  resultBox: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagRowLeft: {
    flex: 1,
    gap: 2,
  },
  diagLabel: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
  },
  diagValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  diagValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  diagUnit: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: HVAC_BORDER,
    marginVertical: 6,
  },
  recsCard: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  recsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: HVAC_TEXT,
    marginBottom: 4,
  },
  recText: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    lineHeight: 20,
  },
  segmentRow: { flexDirection: 'row', backgroundColor: HVAC_SURFACE, borderRadius: 12, padding: 4, marginBottom: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: HVAC_BLUE },
  segmentText: { fontSize: 14, fontWeight: '600', color: HVAC_TEXT_SECONDARY },
  segmentBtnActiveText: { color: '#FFFFFF' },
  noteText: { fontSize: 13, color: HVAC_TEXT_SECONDARY, lineHeight: 19, marginTop: 12, marginBottom: 0 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 14, color: HVAC_TEXT_SECONDARY, flex: 1 },
  resultValue: { fontSize: 18, fontWeight: '700', color: HVAC_TEXT },
  resultUnit: { fontSize: 13, color: HVAC_TEXT_SECONDARY },
});
