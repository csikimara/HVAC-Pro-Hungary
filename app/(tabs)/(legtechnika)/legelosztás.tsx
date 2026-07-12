import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, Wind, Plus, Trash2, AlertCircle } from 'lucide-react-native';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Branch = {
  id: string;
  name: string;
  airflow: string;
  length: string;
  ductSize: string;
  fittings: string;
};

// ─── Unit Header Card ─────────────────────────────────────────────────────────

function UnitCard() {
  const [open, setOpen] = useState(true);
  const [unitName, setUnitName] = useState('');
  const [totalAirflow, setTotalAirflow] = useState('');
  const [availableEsp, setAvailableEsp] = useState('');

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
          <Text style={styles.label}>Egység neve / azonosítója</Text>
          <TextInput
            style={styles.input}
            value={unitName}
            onChangeText={setUnitName}
            placeholder="pl. FCU-01"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Névleges légszállítás (m³/h)</Text>
          <TextInput
            style={styles.input}
            value={totalAirflow}
            onChangeText={setTotalAirflow}
            keyboardType="numeric"
            placeholder="pl. 800"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.label}>Rendelkezésre álló külső statikus nyomás (Pa)</Text>
          <TextInput
            style={styles.input}
            value={availableEsp}
            onChangeText={setAvailableEsp}
            keyboardType="numeric"
            placeholder="pl. 50"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <Text style={styles.noteText}>
            A külső statikus nyomás a légkezelő műszaki adatlapjáról olvasható le a névleges légszállításhoz tartozó értékként.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Branch Card ──────────────────────────────────────────────────────────────

function BranchCard({ branch, onUpdate, onDelete }: {
  branch: Branch;
  onUpdate: (updated: Branch) => void;
  onDelete: () => void;
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
          <Text style={styles.label}>Idomok (K-értékek összege)</Text>
          <TextInput
            style={styles.input}
            value={branch.fittings}
            onChangeText={v => update('fittings', v)}
            keyboardType="numeric"
            placeholder="pl. 1.5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Result placeholder */}
          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Légsebesség</Text>
              <Text style={styles.resultValue}>— m/s</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Nyomásesés</Text>
              <Text style={styles.resultValue}>— Pa</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ branches }: { branches: Branch[] }) {
  const branchCount = branches.length;
  const branchCountText = `${branchCount} db`;

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
            <Text style={styles.resultValue}>— m³/h</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Kritikus ág nyomásesése</Text>
            <Text style={styles.resultValue}>— Pa</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>ESP ellenőrzés</Text>
            <Text style={[styles.resultValue, { color: HVAC_TEXT_SECONDARY }]}>—</Text>
          </View>
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

        <UnitCard />

        {branches.map(branch => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onUpdate={updated => updateBranch(branch.id, updated)}
            onDelete={() => deleteBranch(branch.id)}
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

        {hasBranches && <SummaryCard branches={branches} />}
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
