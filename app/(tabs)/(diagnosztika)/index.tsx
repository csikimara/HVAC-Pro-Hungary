import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Cpu, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
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
                  label="Kompresszió arány CR"
                  value={crVal}
                  unit=""
                  status={result.crStatus}
                />
                <View style={styles.divider} />
                <DiagRow
                  label="Szívócső túlhevítés SH"
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
                  label="Nyomóhőmérséklet T_d"
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiagnosztikaSreen() {
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
            console.log('[Diagnosztika] Vissza a kezdőlapra');
            router.push('/(tabs)/(home)');
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={HVAC_BLUE} />
          <Text style={backBtnText}>Vissza a kezdőlapra</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Diagnosztika</Text>
        <CompressorDiagnostics />
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: HVAC_TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
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
    marginBottom: 10,
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
});
