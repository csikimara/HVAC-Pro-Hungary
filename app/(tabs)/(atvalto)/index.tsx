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
import { ChevronDown, ChevronUp, Thermometer, Gauge, Wind, Zap, Activity } from 'lucide-react-native';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';

// ─── Temperature Converter ───────────────────────────────────────────────────

function TemperatureConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'C' | 'F' | 'K'>('C');
  const [results, setResults] = useState<{ C: string; F: string; K: string }>({ C: '—', F: '—', K: '—' });

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      setResults({ C: '—', F: '—', K: '—' });
      return;
    }
    let celsius: number;
    if (unit === 'C') celsius = v;
    else if (unit === 'F') celsius = (v - 32) * 5 / 9;
    else celsius = v - 273.15;

    const fahrenheit = celsius * 9 / 5 + 32;
    const kelvin = celsius + 273.15;

    setResults({
      C: celsius.toFixed(2),
      F: fahrenheit.toFixed(2),
      K: kelvin.toFixed(2),
    });
  }, [value, unit]);

  const unitLabels: ('C' | 'F' | 'K')[] = ['C', 'F', 'K'];
  const unitDisplay = { C: '°C', F: '°F', K: 'K' };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Hőmérséklet kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Thermometer size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Hőmérséklet</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {unitLabels.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, unit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Hőmérséklet egység:', u);
                  setUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, unit === u && styles.segmentTextActive]}>{unitDisplay[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték ({unitDisplay[unit]})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Hőmérséklet input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 25"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultBox}>
            {unitLabels.map(u => (
              <View key={u} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{unitDisplay[u]}</Text>
                <Text style={styles.resultValue}>{results[u]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Pressure Converter ───────────────────────────────────────────────────────

type PressureUnit = 'Pa' | 'kPa' | 'bar' | 'mbar' | 'psi' | 'mmH2O';
const PRESSURE_TO_PA: Record<PressureUnit, number> = {
  Pa: 1,
  kPa: 1000,
  bar: 100000,
  mbar: 100,
  psi: 6894.76,
  mmH2O: 9.80665,
};
const PRESSURE_UNITS: PressureUnit[] = ['Pa', 'kPa', 'bar', 'mbar', 'psi', 'mmH2O'];
const PRESSURE_DISPLAY: Record<PressureUnit, string> = {
  Pa: 'Pa', kPa: 'kPa', bar: 'bar', mbar: 'mbar', psi: 'psi', mmH2O: 'mmH₂O',
};

function PressureConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<PressureUnit>('Pa');
  const [results, setResults] = useState<Record<PressureUnit, string>>({
    Pa: '—', kPa: '—', bar: '—', mbar: '—', psi: '—', mmH2O: '—',
  });

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      const empty: Record<PressureUnit, string> = { Pa: '—', kPa: '—', bar: '—', mbar: '—', psi: '—', mmH2O: '—' };
      setResults(empty);
      return;
    }
    const pa = v * PRESSURE_TO_PA[unit];
    const res = {} as Record<PressureUnit, string>;
    PRESSURE_UNITS.forEach(u => {
      const converted = pa / PRESSURE_TO_PA[u];
      res[u] = converted < 0.001 ? converted.toFixed(6) : converted.toFixed(4);
    });
    setResults(res);
  }, [value, unit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Nyomás kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Gauge size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Nyomás</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
            <View style={styles.segmentRow}>
              {PRESSURE_UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segmentBtn, unit === u && styles.segmentBtnActive]}
                  onPress={() => {
                    console.log('[Átváltók] Nyomás egység:', u);
                    setUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, unit === u && styles.segmentTextActive]}>{PRESSURE_DISPLAY[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.label}>Érték ({PRESSURE_DISPLAY[unit]})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Nyomás input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 101325"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultBox}>
            {PRESSURE_UNITS.map(u => (
              <View key={u} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{PRESSURE_DISPLAY[u]}</Text>
                <Text style={styles.resultValue}>{results[u]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Airflow Converter ────────────────────────────────────────────────────────

type AirflowUnit = 'm3h' | 'm3s' | 'ls' | 'CFM';
const AIRFLOW_TO_M3S: Record<AirflowUnit, number> = {
  m3h: 1 / 3600,
  m3s: 1,
  ls: 0.001,
  CFM: 0.000471947,
};
const AIRFLOW_UNITS: AirflowUnit[] = ['m3h', 'm3s', 'ls', 'CFM'];
const AIRFLOW_DISPLAY: Record<AirflowUnit, string> = {
  m3h: 'm³/h', m3s: 'm³/s', ls: 'l/s', CFM: 'CFM',
};

function AirflowConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<AirflowUnit>('m3h');
  const [results, setResults] = useState<Record<AirflowUnit, string>>({
    m3h: '—', m3s: '—', ls: '—', CFM: '—',
  });

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      setResults({ m3h: '—', m3s: '—', ls: '—', CFM: '—' });
      return;
    }
    const m3s = v * AIRFLOW_TO_M3S[unit];
    const res = {} as Record<AirflowUnit, string>;
    AIRFLOW_UNITS.forEach(u => {
      const converted = m3s / AIRFLOW_TO_M3S[u];
      res[u] = converted.toFixed(4);
    });
    setResults(res);
  }, [value, unit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Légmennyiség kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Wind size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Légmennyiség</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
            <View style={styles.segmentRow}>
              {AIRFLOW_UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segmentBtn, unit === u && styles.segmentBtnActive]}
                  onPress={() => {
                    console.log('[Átváltók] Légmennyiség egység:', u);
                    setUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, unit === u && styles.segmentTextActive]}>{AIRFLOW_DISPLAY[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.label}>Érték ({AIRFLOW_DISPLAY[unit]})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Légmennyiség input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 1000"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultBox}>
            {AIRFLOW_UNITS.map(u => (
              <View key={u} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{AIRFLOW_DISPLAY[u]}</Text>
                <Text style={styles.resultValue}>{results[u]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Power Converter ──────────────────────────────────────────────────────────

type PowerUnit = 'W' | 'kW' | 'BTUh' | 'kcalh' | 'HP';
const POWER_TO_W: Record<PowerUnit, number> = {
  W: 1,
  kW: 1000,
  BTUh: 0.29307107,
  kcalh: 1.16279,
  HP: 745.7,
};
const POWER_UNITS: PowerUnit[] = ['W', 'kW', 'BTUh', 'kcalh', 'HP'];
const POWER_DISPLAY: Record<PowerUnit, string> = {
  W: 'W', kW: 'kW', BTUh: 'BTU/h', kcalh: 'kcal/h', HP: 'HP',
};

function PowerConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<PowerUnit>('kW');
  const [results, setResults] = useState<Record<PowerUnit, string>>({
    W: '—', kW: '—', BTUh: '—', kcalh: '—', HP: '—',
  });

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      setResults({ W: '—', kW: '—', BTUh: '—', kcalh: '—', HP: '—' });
      return;
    }
    const watts = v * POWER_TO_W[unit];
    const res = {} as Record<PowerUnit, string>;
    POWER_UNITS.forEach(u => {
      const converted = watts / POWER_TO_W[u];
      res[u] = converted.toFixed(4);
    });
    setResults(res);
  }, [value, unit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Teljesítmény kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Zap size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Teljesítmény</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
            <View style={styles.segmentRow}>
              {POWER_UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segmentBtn, unit === u && styles.segmentBtnActive]}
                  onPress={() => {
                    console.log('[Átváltók] Teljesítmény egység:', u);
                    setUnit(u);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, unit === u && styles.segmentTextActive]}>{POWER_DISPLAY[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.label}>Érték ({POWER_DISPLAY[unit]})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Teljesítmény input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 5"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultBox}>
            {POWER_UNITS.map(u => (
              <View key={u} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{POWER_DISPLAY[u]}</Text>
                <Text style={styles.resultValue}>{results[u]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Mass Flow Converter ──────────────────────────────────────────────────────

type MassFlowUnit = 'kgh' | 'kgs' | 'gs';
const MASSFLOW_TO_KGS: Record<MassFlowUnit, number> = {
  kgh: 1 / 3600,
  kgs: 1,
  gs: 0.001,
};
const MASSFLOW_UNITS: MassFlowUnit[] = ['kgh', 'kgs', 'gs'];
const MASSFLOW_DISPLAY: Record<MassFlowUnit, string> = {
  kgh: 'kg/h', kgs: 'kg/s', gs: 'g/s',
};

function MassFlowConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<MassFlowUnit>('kgh');
  const [results, setResults] = useState<Record<MassFlowUnit, string>>({
    kgh: '—', kgs: '—', gs: '—',
  });

  useEffect(() => {
    const v = parseFloat(value);
    if (isNaN(v)) {
      setResults({ kgh: '—', kgs: '—', gs: '—' });
      return;
    }
    const kgs = v * MASSFLOW_TO_KGS[unit];
    const res = {} as Record<MassFlowUnit, string>;
    MASSFLOW_UNITS.forEach(u => {
      const converted = kgs / MASSFLOW_TO_KGS[u];
      res[u] = converted.toFixed(4);
    });
    setResults(res);
  }, [value, unit]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Tömegáram kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Activity size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Tömegáram</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.segmentRow}>
            {MASSFLOW_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, unit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Tömegáram egység:', u);
                  setUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, unit === u && styles.segmentTextActive]}>{MASSFLOW_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték ({MASSFLOW_DISPLAY[unit]})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Tömegáram input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 100"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultBox}>
            {MASSFLOW_UNITS.map(u => (
              <View key={u} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{MASSFLOW_DISPLAY[u]}</Text>
                <Text style={styles.resultValue}>{results[u]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AtvaltoScreen() {
  const isIOS = process.env.EXPO_OS === 'ios';
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={isIOS ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Átváltók</Text>
        <TemperatureConverter />
        <PressureConverter />
        <AirflowConverter />
        <PowerConverter />
        <MassFlowConverter />
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
  segmentScroll: { marginBottom: 12 },
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
  resultBox: {
    backgroundColor: HVAC_CARD,
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
  resultLabel: {
    fontSize: 14,
    color: HVAC_TEXT_SECONDARY,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: HVAC_TEXT,
  },
});
