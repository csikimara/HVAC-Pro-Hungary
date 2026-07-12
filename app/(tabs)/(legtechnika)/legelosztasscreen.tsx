import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Wind, Plus, Minus, Trash2, Copy, AlertCircle } from 'lucide-react-native';
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
const HVAC_GREEN = '#22C55E';

// ─── Types ────────────────────────────────────────────────────────────────────

type Branch = {
  id: string;
  name: string;
  airflow: string;
  length: string;
  ductSize: string;
  fittings: string;
};

// ─── Branch Calculation ───────────────────────────────────────────────────────

const RHO = 1.2;   // kg/m³ air density
const LAMBDA = 0.02; // default friction factor

const BRANCH_FITTINGS: { label: string; K: number }[] = [
  { label: 'Könyök 90° (R/D=1)',    K: 0.3  },
  { label: 'Könyök 90° (R/D=0.5)',  K: 0.9  },
  { label: 'Könyök 45°',            K: 0.15 },
  { label: 'T-idom (egyenes)',       K: 0.1  },
  { label: 'T-idom (elágazás)',      K: 1.0  },
  { label: 'Szűkítés (fokozatos)',   K: 0.05 },
  { label: 'Bővítés (fokozatos)',    K: 0.07 },
  { label: 'Belépés (éles perem)',   K: 0.5  },
  { label: 'Kilépés (szabad)',       K: 1.0  },
  { label: 'Visszacsapó szelep',     K: 2.5  },
];

type BranchResult = {
  velocity: number;       // m/s
  straightDrop: number;   // Pa — Darcy-Weisbach over length
  fittingDrop: number;    // Pa — ΣK × ½ρv²
  totalDrop: number;      // Pa — straight + fitting
  velocityColor: string;
  dropColor: string;
};

function calcBranch(branch: Branch): BranchResult | null {
  const Q_raw = parseFloat(branch.airflow);
  const D_raw = parseFloat(branch.ductSize);
  const L_raw = parseFloat(branch.length);
  const K_raw = parseFloat(branch.fittings);

  if (isNaN(Q_raw) || Q_raw <= 0) return null;
  if (isNaN(D_raw) || D_raw <= 0) return null;

  const Q = Q_raw / 3600;                          // m³/s
  const D = D_raw / 1000;                          // m
  const area = Math.PI * Math.pow(D, 2) / 4;      // m²
  const v = Q / area;                              // m/s

  const L = isNaN(L_raw) || L_raw <= 0 ? 0 : L_raw;
  const K = isNaN(K_raw) || K_raw < 0 ? 0 : K_raw;

  const dynP = 0.5 * RHO * Math.pow(v, 2);        // Pa dynamic pressure
  const R = LAMBDA * RHO * Math.pow(v, 2) / (2 * D); // Pa/m specific drop
  const straightDrop = R * L;
  const fittingDrop = K * dynP;
  const totalDrop = straightDrop + fittingDrop;

  const velocityColor = v <= 3.5 ? HVAC_GREEN : v <= 5 ? HVAC_YELLOW : HVAC_RED;
  const dropColor = totalDrop <= 30 ? HVAC_GREEN : totalDrop <= 60 ? HVAC_YELLOW : HVAC_RED;

  return { velocity: v, straightDrop, fittingDrop, totalDrop, velocityColor, dropColor };
}

// ─── Unit Header Card ─────────────────────────────────────────────────────────

const FUJITSU_MODELS = [
  { model: 'ARXG09KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 2.5, heating: 3.2, airflow: 510 },
  { model: 'ARXG12KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 3.5, heating: 4.0, airflow: 630 },
  { model: 'ARXG14KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 4.0, heating: 5.0, airflow: 720 },
  { model: 'ARXG18KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 5.0, heating: 6.0, airflow: 900 },
  { model: 'ARXG24KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 7.1, heating: 8.0, airflow: 1260 },
  { model: 'ARXG30KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 8.0, heating: 9.0, airflow: 1500 },
  { model: 'ARXG36KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 10.0, heating: 11.2, airflow: 1800 },
  { model: 'ARXG45KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 12.5, heating: 14.0, airflow: 2100 },
  { model: 'ARXG54KLLAP', series: 'KLLAP', pressureClass: 'Közepes nyomású', cooling: 14.0, heating: 16.0, airflow: 2400 },
  { model: 'ARXG07LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 2.0, heating: 2.5, airflow: 390 },
  { model: 'ARXG09LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 2.5, heating: 3.2, airflow: 510 },
  { model: 'ARXG12LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 3.5, heating: 4.0, airflow: 630 },
  { model: 'ARXG14LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 4.0, heating: 5.0, airflow: 720 },
  { model: 'ARXG18LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 5.0, heating: 6.0, airflow: 900 },
  { model: 'ARXG24LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 7.1, heating: 8.0, airflow: 1260 },
  { model: 'ARXG30LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 8.0, heating: 9.0, airflow: 1500 },
  { model: 'ARXG36LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 10.0, heating: 11.2, airflow: 1800 },
  { model: 'ARXG45LMLE',  series: 'LMLE',  pressureClass: 'Nagy nyomású',    cooling: 12.5, heating: 14.0, airflow: 2100 },
] as const;

type FujitsuModel = typeof FUJITSU_MODELS[number];

function UnitCard({
  availableEsp, setAvailableEsp,
  filterLoss, setFilterLoss,
  damperLoss, setDamperLoss,
}: {
  availableEsp: string; setAvailableEsp: (v: string) => void;
  filterLoss: string; setFilterLoss: (v: string) => void;
  damperLoss: string; setDamperLoss: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<FujitsuModel | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  // Editable unit fields — pre-filled from Fujitsu selection, always overridable
  const [unitName, setUnitName] = useState('');
  const [unitSeries, setUnitSeries] = useState('');
  const [pressureClass, setPressureClass] = useState('');
  const [coolingKw, setCoolingKw] = useState('');
  const [heatingKw, setHeatingKw] = useState('');
  const [nominalAirflow, setNominalAirflow] = useState('');

  function selectModel(m: FujitsuModel) {
    setSelectedModel(m);
    setUnitName(m.model);
    setUnitSeries(m.series);
    setPressureClass(m.pressureClass);
    setCoolingKw(String(m.cooling));
    setHeatingKw(String(m.heating));
    setNominalAirflow(String(m.airflow));
    setModelPickerOpen(false);
    console.log('[Légelosztás] Modell kiválasztva és mezők kitöltve:', m.model);
  }

  const selectedModelText = selectedModel ? selectedModel.model : 'Válassz modellt…';
  const selectedModelColor = selectedModel ? HVAC_TEXT : HVAC_TEXT_SECONDARY;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Légelosztás] Légkezelő egység kártya toggled, open:', !open);
          setOpen(o => !o);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Wind size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Légkezelő egység</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* 1. Fujitsu model selector */}
          <Text style={styles.label}>Fujitsu modell (opcionális)</Text>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => {
              console.log('[Légelosztás] Modell választó toggled:', !modelPickerOpen);
              setModelPickerOpen(p => !p);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: selectedModelColor, fontSize: 16 }}>
              {selectedModelText}
            </Text>
            {modelPickerOpen ? <ChevronUp size={16} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={16} color={HVAC_TEXT_SECONDARY} />}
          </TouchableOpacity>

          {/* 2. Model picker list */}
          {modelPickerOpen && (
            <View style={{ marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: HVAC_BORDER, overflow: 'hidden' }}>
              {FUJITSU_MODELS.map((m, idx) => {
                const active = selectedModel?.model === m.model;
                const rowBg = active ? HVAC_BLUE + '22' : idx % 2 === 0 ? HVAC_SURFACE : HVAC_CARD;
                const hasBorder = idx < FUJITSU_MODELS.length - 1;
                const modelNameColor = active ? HVAC_BLUE : HVAC_TEXT;
                const modelDetailText = `${m.series} · ${m.pressureClass} · ${m.cooling} kW hűtés · ${m.heating} kW fűtés · ${m.airflow} m³/h`;
                return (
                  <TouchableOpacity
                    key={m.model}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: rowBg,
                      borderBottomWidth: hasBorder ? 1 : 0,
                      borderBottomColor: HVAC_BORDER,
                    }}
                    onPress={() => selectModel(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: modelNameColor }}>{m.model}</Text>
                    <Text style={{ fontSize: 12, color: HVAC_TEXT_SECONDARY, marginTop: 2 }}>
                      {modelDetailText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 3. Divider note */}
          <Text style={styles.noteText}>
            Fujitsu modell kiválasztása előtölti az alábbi mezőket. Minden érték szabadon módosítható más gyártókhoz is.
          </Text>

          {/* 4. Egység neve / azonosítója */}
          <Text style={[styles.label, { marginTop: 12 }]}>Egység neve / azonosítója</Text>
          <TextInput
            style={styles.input}
            value={unitName}
            onChangeText={v => { console.log('[Légelosztás] Egység neve input:', v); setUnitName(v); }}
            placeholder="pl. FCU-01 vagy ARXG18KLLAP"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 5. Sorozat */}
          <Text style={styles.label}>Sorozat</Text>
          <TextInput
            style={styles.input}
            value={unitSeries}
            onChangeText={v => { console.log('[Légelosztás] Sorozat input:', v); setUnitSeries(v); }}
            placeholder="pl. KLLAP"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 6. Nyomásosztály */}
          <Text style={styles.label}>Nyomásosztály</Text>
          <TextInput
            style={styles.input}
            value={pressureClass}
            onChangeText={v => { console.log('[Légelosztás] Nyomásosztály input:', v); setPressureClass(v); }}
            placeholder="pl. Közepes nyomású"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 7. Névleges hűtőteljesítmény */}
          <Text style={styles.label}>Névleges hűtőteljesítmény (kW)</Text>
          <TextInput
            style={styles.input}
            value={coolingKw}
            onChangeText={v => { console.log('[Légelosztás] Hűtőteljesítmény input:', v); setCoolingKw(v); }}
            keyboardType="numeric"
            placeholder="pl. 5.0"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 8. Névleges fűtőteljesítmény */}
          <Text style={styles.label}>Névleges fűtőteljesítmény (kW)</Text>
          <TextInput
            style={styles.input}
            value={heatingKw}
            onChangeText={v => { console.log('[Légelosztás] Fűtőteljesítmény input:', v); setHeatingKw(v); }}
            keyboardType="numeric"
            placeholder="pl. 6.0"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 9. Névleges légszállítás */}
          <Text style={styles.label}>Névleges légszállítás (m³/h)</Text>
          <TextInput
            style={styles.input}
            value={nominalAirflow}
            onChangeText={v => { console.log('[Légelosztás] Névleges légszállítás input:', v); setNominalAirflow(v); }}
            keyboardType="numeric"
            placeholder="pl. 900"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* 10. Rendelkezésre álló ESP */}
          <Text style={styles.label}>Rendelkezésre álló külső statikus nyomás (Pa)</Text>
          <TextInput
            style={styles.input}
            value={availableEsp}
            onChangeText={v => { console.log('[Légelosztás] ESP input:', v); setAvailableEsp(v); }}
            keyboardType="numeric"
            placeholder="pl. 50"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.noteText}>
            A külső statikus nyomás a légkezelő műszaki adatlapjáról olvasható le a névleges légszállításhoz tartozó értékként.
          </Text>

          {/* 11. Tartozékveszteségek */}
          <Text style={[styles.label, { marginTop: 12 }]}>Tartozékveszteségek</Text>

          <Text style={styles.label}>Szívóoldali szűrődoboz G4 szűrővel (Pa)</Text>
          <TextInput
            style={styles.input}
            value={filterLoss}
            onChangeText={v => { console.log('[Légelosztás] Szűrődoboz veszteség input:', v); setFilterLoss(v); }}
            keyboardType="numeric"
            placeholder="pl. 20"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          <Text style={styles.label}>Nyomóoldali pillangószelep (Pa)</Text>
          <TextInput
            style={styles.input}
            value={damperLoss}
            onChangeText={v => { console.log('[Légelosztás] Pillangószelep veszteség input:', v); setDamperLoss(v); }}
            keyboardType="numeric"
            placeholder="pl. 10"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.noteText}>
            A tartozékveszteségek levonásra kerülnek a rendelkezésre álló ESP-ből az ágak tervezésekor.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Fittings Helper ─────────────────────────────────────────────────────────

function FittingsHelper({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  // qty[i] = how many of BRANCH_FITTINGS[i] are selected
  const [qty, setQty] = useState<number[]>(BRANCH_FITTINGS.map(() => 0));

  const autoK = qty.reduce((sum, q, i) => sum + q * BRANCH_FITTINGS[i].K, 0);

  function setQtyAt(idx: number, delta: number) {
    setQty(prev => {
      const next = [...prev];
      next[idx] = Math.max(0, next[idx] + delta);
      const newK = next.reduce((s, q, i) => s + q * BRANCH_FITTINGS[i].K, 0);
      if (!manualMode) onChange(newK > 0 ? newK.toFixed(2) : '');
      console.log('[Légelosztás] Idom qty változás:', BRANCH_FITTINGS[idx].label, 'qty:', next[idx], 'autoK:', newK.toFixed(2));
      return next;
    });
  }

  function toggleManual() {
    setManualMode(m => {
      if (!m) {
        // switching to manual — keep current value
        console.log('[Légelosztás] Manuális K mód bekapcsolva');
      } else {
        // switching back to auto — write autoK
        onChange(autoK > 0 ? autoK.toFixed(2) : '');
        console.log('[Légelosztás] Automatikus K mód visszaállítva, autoK:', autoK.toFixed(2));
      }
      return !m;
    });
  }

  const totalItems = qty.reduce((s, q) => s + q, 0);

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Header row */}
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }]}
        onPress={() => {
          console.log('[Légelosztás] Idomok segéd toggled:', !open);
          setOpen(o => !o);
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: totalItems > 0 ? HVAC_TEXT : HVAC_TEXT_SECONDARY, fontSize: 15 }}>
          {totalItems > 0
            ? `${totalItems} idom · K = ${autoK.toFixed(2)}`
            : 'Idomok kiválasztása…'}
        </Text>
        {open ? <ChevronUp size={16} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={16} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: HVAC_BORDER, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', marginBottom: 0 }}>
          {BRANCH_FITTINGS.map((f, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: qty[idx] > 0 ? HVAC_BLUE + '18' : idx % 2 === 0 ? HVAC_SURFACE : HVAC_CARD,
                borderBottomWidth: idx < BRANCH_FITTINGS.length - 1 ? 1 : 0,
                borderBottomColor: HVAC_BORDER,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: qty[idx] > 0 ? HVAC_TEXT : HVAC_TEXT_SECONDARY }}>{f.label}</Text>
                <Text style={{ fontSize: 11, color: HVAC_TEXT_SECONDARY, marginTop: 1 }}>K = {f.K}</Text>
              </View>
              {/* Stepper */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setQtyAt(idx, -1)}
                  activeOpacity={0.7}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: HVAC_SURFACE, borderWidth: 1, borderColor: HVAC_BORDER, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={14} color={HVAC_TEXT_SECONDARY} />
                </TouchableOpacity>
                <Text style={{ fontSize: 15, fontWeight: '700', color: qty[idx] > 0 ? HVAC_BLUE : HVAC_TEXT_SECONDARY, minWidth: 20, textAlign: 'center' }}>
                  {qty[idx]}
                </Text>
                <TouchableOpacity
                  onPress={() => setQtyAt(idx, 1)}
                  activeOpacity={0.7}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: HVAC_BLUE, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Summary + manual toggle */}
          <View style={{ padding: 12, backgroundColor: HVAC_CARD, borderTopWidth: 1, borderTopColor: HVAC_BORDER }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY }}>Összesített K-érték</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: HVAC_BLUE }}>{autoK.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              onPress={toggleManual}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View style={{
                width: 16, height: 16, borderRadius: 4, borderWidth: 1.5,
                borderColor: manualMode ? HVAC_BLUE : HVAC_BORDER,
                backgroundColor: manualMode ? HVAC_BLUE : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {manualMode && <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13, color: HVAC_TEXT_SECONDARY }}>Manuális K-érték megadása</Text>
            </TouchableOpacity>
            {manualMode && (
              <TextInput
                style={[styles.input, { marginTop: 10, marginBottom: 0 }]}
                value={value}
                onChangeText={v => { console.log('[Légelosztás] Manuális K input:', v); onChange(v); }}
                keyboardType="numeric"
                placeholder="pl. 1.5"
                placeholderTextColor={HVAC_TEXT_SECONDARY}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Branch Card ──────────────────────────────────────────────────────────────

function BranchCard({ branch, onUpdate, onDelete, onDuplicate }: {
  branch: Branch;
  onUpdate: (updated: Branch) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(true);

  function update(field: keyof Branch, value: string) {
    onUpdate({ ...branch, [field]: value });
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Légelosztás] Ág kártya toggled, id:', branch.id, 'open:', !open);
          setOpen(o => !o);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.branchDot} />
          <Text style={styles.cardTitle}>{branch.name || 'Névtelen ág'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              console.log('[Légelosztás] Ág duplikálása gomb megnyomva, id:', branch.id);
              onDuplicate();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Copy size={16} color={HVAC_BLUE} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log('[Légelosztás] Ág törlés gomb megnyomva, id:', branch.id);
              onDelete();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={HVAC_RED} />
          </TouchableOpacity>
          {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>Helyiség / ág neve</Text>
          <TextInput
            style={styles.input}
            value={branch.name}
            onChangeText={v => update('name', v)}
            placeholder="pl. Nappali"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Légszállítás (m³/h)</Text>
          <TextInput
            style={styles.input}
            value={branch.airflow}
            onChangeText={v => update('airflow', v)}
            keyboardType="numeric"
            placeholder="pl. 200"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Ágvezeték hossza (m)</Text>
          <TextInput
            style={styles.input}
            value={branch.length}
            onChangeText={v => update('length', v)}
            keyboardType="numeric"
            placeholder="pl. 5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Csatorna Ø (mm)</Text>
          <TextInput
            style={styles.input}
            value={branch.ductSize}
            onChangeText={v => update('ductSize', v)}
            keyboardType="numeric"
            placeholder="pl. 160"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Idomok</Text>
          <FittingsHelper
            value={branch.fittings}
            onChange={v => update('fittings', v)}
          />

          {(() => {
            const r = calcBranch(branch);
            return (
              <View style={styles.resultBox}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Légsebesség</Text>
                  <Text style={[styles.resultValue, { color: r ? r.velocityColor : HVAC_TEXT_SECONDARY }]}>
                    {r ? `${r.velocity.toFixed(2)} m/s` : '—'}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Egyenes szakasz</Text>
                  <Text style={styles.resultValue}>
                    {r ? `${r.straightDrop.toFixed(1)} Pa` : '—'}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Idomveszteség</Text>
                  <Text style={styles.resultValue}>
                    {r ? `${r.fittingDrop.toFixed(1)} Pa` : '—'}
                  </Text>
                </View>
                <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 10, marginTop: 2 }]}>
                  <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>Ág nyomásesése</Text>
                  <Text style={[styles.resultValue, { color: r ? r.dropColor : HVAC_TEXT_SECONDARY }]}>
                    {r ? `${r.totalDrop.toFixed(1)} Pa` : '—'}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  branches,
  availableEsp,
  filterLoss,
  damperLoss,
}: {
  branches: Branch[];
  availableEsp: string;
  filterLoss: string;
  damperLoss: string;
}) {
  const esp = parseFloat(availableEsp);
  const filter = parseFloat(filterLoss);
  const damper = parseFloat(damperLoss);
  const hasEsp = !isNaN(esp) && esp > 0;
  const usableEsp = hasEsp
    ? esp - (isNaN(filter) ? 0 : filter) - (isNaN(damper) ? 0 : damper)
    : null;
  const usableEspColor = usableEsp === null
    ? HVAC_TEXT_SECONDARY
    : usableEsp >= 0 ? HVAC_GREEN : HVAC_RED;

  // Branch aggregation
  const branchResults = branches.map(b => ({ branch: b, result: calcBranch(b) }));
  const calculatedBranches = branchResults.filter(br => br.result !== null);

  const totalAirflow = branches.reduce((sum, b) => {
    const q = parseFloat(b.airflow);
    return sum + (isNaN(q) ? 0 : q);
  }, 0);

  const criticalBranch = calculatedBranches.length > 0
    ? calculatedBranches.reduce((max, br) =>
        br.result!.totalDrop > max.result!.totalDrop ? br : max
      )
    : null;

  const criticalDrop = criticalBranch?.result?.totalDrop ?? null;

  // ESP check
  type CheckState = 'ok' | 'warning' | 'fail' | 'nodata';
  let checkState: CheckState = 'nodata';
  let checkMessage = '—';
  let checkColor = HVAC_TEXT_SECONDARY;

  if (criticalDrop !== null && usableEsp !== null) {
    const margin = usableEsp - criticalDrop;
    if (margin >= 5) {
      checkState = 'ok';
      checkMessage = `✓ Rendben – ${margin.toFixed(1)} Pa tartalék`;
      checkColor = HVAC_GREEN;
    } else if (margin >= 0) {
      checkState = 'warning';
      checkMessage = `⚠ Szűk tartalék – csak ${margin.toFixed(1)} Pa maradt`;
      checkColor = HVAC_YELLOW;
    } else {
      checkState = 'fail';
      checkMessage = `✗ Túllépés – ${Math.abs(margin).toFixed(1)} Pa hiány`;
      checkColor = HVAC_RED;
    }
  } else if (criticalDrop !== null && usableEsp === null) {
    checkMessage = 'Add meg az ESP értéket az ellenőrzéshez';
    checkColor = HVAC_TEXT_SECONDARY;
  }

  const branchCountText = `${branches.length} db`;
  const espText = hasEsp ? `${esp} Pa` : '—';
  const filterText = !isNaN(filter) && filter > 0 ? `${filter} Pa` : '—';
  const damperText = !isNaN(damper) && damper > 0 ? `${damper} Pa` : '—';
  const usableEspText = usableEsp !== null ? `${usableEsp.toFixed(1)} Pa` : '—';
  const totalAirflowText = totalAirflow > 0 ? `${totalAirflow.toFixed(0)} m³/h` : '—';
  const criticalDropText = criticalDrop !== null ? `${criticalDrop.toFixed(1)} Pa` : '—';
  const criticalNameText = criticalBranch ? ` (${criticalBranch.branch.name || 'névtelen'})` : '';

  return (
    <View style={[styles.card, { borderColor: HVAC_BORDER }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <AlertCircle size={20} color={HVAC_YELLOW} />
          <Text style={styles.cardTitle}>Összesítés</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.resultBox}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Ágak száma</Text>
            <Text style={styles.resultValue}>{branchCountText}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Összes légszállítás</Text>
            <Text style={styles.resultValue}>{totalAirflowText}</Text>
          </View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 10, marginTop: 2 }]}>
            <Text style={styles.resultLabel}>Rendelkezésre álló ESP</Text>
            <Text style={styles.resultValue}>{espText}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>− Szűrődoboz veszteség</Text>
            <Text style={styles.resultValue}>{filterText}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>− Pillangószelep veszteség</Text>
            <Text style={styles.resultValue}>{damperText}</Text>
          </View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 10, marginTop: 2 }]}>
            <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>Felhasználható csatorna ESP</Text>
            <Text style={[styles.resultValue, { color: usableEspColor }]}>{usableEspText}</Text>
          </View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 10, marginTop: 2 }]}>
            <Text style={styles.resultLabel}>Kritikus ág{criticalNameText}</Text>
            <Text style={[styles.resultValue, { color: criticalDrop !== null ? (criticalDrop > (usableEsp ?? Infinity) ? HVAC_RED : HVAC_TEXT) : HVAC_TEXT_SECONDARY }]}>
              {criticalDropText}
            </Text>
          </View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: HVAC_BORDER, paddingTop: 10, marginTop: 2 }]}>
            <Text style={[styles.resultLabel, { fontWeight: '600', color: HVAC_TEXT }]}>ESP ellenőrzés</Text>
            <Text style={[styles.resultValue, { color: checkColor, flexShrink: 1, textAlign: 'right' }]}>
              {checkMessage}
            </Text>
          </View>
          {checkState !== 'nodata' && (
            <View style={{ marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: HVAC_BORDER }}>
              <Text style={{ fontSize: 13, color: checkColor, lineHeight: 19 }}>
                {checkState === 'ok' && 'A rendszer megfelelően méretezett. A kritikus ág nyomásesése belefér a rendelkezésre álló ESP-be.'}
                {checkState === 'warning' && (
                  (() => {
                    const hints: string[] = [];
                    if (criticalDrop !== null && usableEsp !== null && criticalDrop > usableEsp * 0.8) hints.push('a kritikus ág nyomásesése az ESP nagy részét felhasználja');
                    if (!isNaN(filter) && filter > 0 && !isNaN(damper) && damper > 0 && (filter + damper) > (usableEsp ?? 0) * 0.3) hints.push('a tartozékveszteségek jelentősen csökkentik a csatornára maradó nyomást');
                    if (hints.length === 0) hints.push('a tartalék szűk, érdemes ellenőrizni az ágak méretezését');
                    return `⚠ Figyelem: ${hints.join('; ')}.`;
                  })()
                )}
                {checkState === 'fail' && (
                  (() => {
                    const hints: string[] = [];
                    if (criticalDrop !== null && usableEsp !== null && criticalDrop > usableEsp) hints.push('a kritikus ág nyomásesése meghaladja a felhasználható ESP-t – növeld a csatorna átmérőjét vagy rövidítsd az ágat');
                    if (!isNaN(filter) && !isNaN(damper) && (filter + damper) > esp * 0.4) hints.push('a tartozékveszteségek az ESP több mint 40%-át elvesznek – ellenőrizd a szűrő és szelep adatait');
                    if (totalAirflow > 0 && hasEsp && totalAirflow > 1500 && esp < 50) hints.push('nagy légszállítás mellett alacsony ESP – ellenőrizd az egység adatlapját');
                    if (hints.length === 0) hints.push('csökkentsd az ágak nyomásesését vagy válassz nagyobb ESP-jű egységet');
                    return `✗ Ok: ${hints.join('; ')}.`;
                  })()
                )}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.noteText}>
          A kritikus ág a legnagyobb nyomásesésű ágat jelenti. Ez nem haladhatja meg a rendelkezésre álló külső statikus nyomást.
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LegelosztasScreen() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableEsp, setAvailableEsp] = useState('');
  const [filterLoss, setFilterLoss] = useState('');
  const [damperLoss, setDamperLoss] = useState('');

  function addBranch() {
    const id = Date.now().toString();
    const newName = `${branches.length + 1}. ág`;
    console.log('[Légelosztás] Új ág hozzáadása gomb megnyomva, id:', id, 'név:', newName);
    setBranches(prev => [...prev, {
      id,
      name: newName,
      airflow: '',
      length: '',
      ductSize: '',
      fittings: '',
    }]);
  }

  function updateBranch(id: string, updated: Branch) {
    setBranches(prev => prev.map(b => b.id === id ? updated : b));
  }

  function deleteBranch(id: string) {
    console.log('[Légelosztás] Ág törölve, id:', id);
    setBranches(prev => prev.filter(b => b.id !== id));
  }

  function duplicateBranch(id: string) {
    const source = branches.find(b => b.id === id);
    if (!source) return;
    const newId = Date.now().toString();
    const newName = `${source.name} (másolat)`;
    const duplicate: Branch = { ...source, id: newId, name: newName };
    setBranches(prev => {
      const idx = prev.findIndex(b => b.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, duplicate);
      return next;
    });
    console.log('[Légelosztás] Ág duplikálva, forrás id:', id, 'új id:', newId);
  }

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

  const hasBranches = branches.length > 0;

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
            console.log('[Légelosztás] Vissza gomb megnyomva');
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={HVAC_BLUE} />
          <Text style={backBtnText}>Vissza</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Légelosztás</Text>
        <Text style={styles.screenSubtitle}>Légcsatorna-ág tervezés és ESP ellenőrzés</Text>

        <UnitCard
          availableEsp={availableEsp} setAvailableEsp={setAvailableEsp}
          filterLoss={filterLoss} setFilterLoss={setFilterLoss}
          damperLoss={damperLoss} setDamperLoss={setDamperLoss}
        />

        {branches.map(branch => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onUpdate={updated => updateBranch(branch.id, updated)}
            onDelete={() => deleteBranch(branch.id)}
            onDuplicate={() => duplicateBranch(branch.id)}
          />
        ))}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={addBranch}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Új ág hozzáadása</Text>
        </TouchableOpacity>

        {(hasBranches || availableEsp !== '') && (
          <SummaryCard
            branches={branches}
            availableEsp={availableEsp}
            filterLoss={filterLoss}
            damperLoss={damperLoss}
          />
        )}
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
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    marginBottom: 20,
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
  resultBox: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: HVAC_TEXT_SECONDARY,
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: HVAC_TEXT,
  },
  noteText: {
    fontSize: 13,
    color: HVAC_TEXT_SECONDARY,
    lineHeight: 19,
    marginTop: 8,
  },
  addBtn: {
    backgroundColor: HVAC_BLUE,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  branchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HVAC_BLUE,
  },
});
