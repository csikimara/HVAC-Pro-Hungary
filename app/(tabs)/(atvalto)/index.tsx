import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp, ChevronLeft, Thermometer, Gauge, Wind, Zap, Activity, DollarSign, Home } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ToolGuide } from '@/components/AccuracyNotice';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_SURFACE = '#1C2128';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#7A8694';
const HVAC_BLUE = '#1E90FF';

// ─── Number formatting ────────────────────────────────────────────────────────

function formatResult(n: number): string {
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(4);
}

// ─── Temperature Converter ───────────────────────────────────────────────────

type TempUnit = 'C' | 'F' | 'K';
const TEMP_UNITS: TempUnit[] = ['C', 'F', 'K'];
const TEMP_DISPLAY: Record<TempUnit, string> = { C: '°C', F: '°F', K: 'K' };

function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  let celsius: number;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

function TemperatureConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState<TempUnit>('C');
  const [toUnit, setToUnit] = useState<TempUnit>('F');
  const [result, setResult] = useState('—');

  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v)) {
      setResult('—');
      return;
    }
    const converted = convertTemp(v, fromUnit, toUnit);
    setResult(formatResult(converted));
  }, [value, fromUnit, toUnit]);

  const resultUnit = TEMP_DISPLAY[toUnit];

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
          <Text style={styles.selectorLabel}>Ebből:</Text>
          <View style={styles.segmentRow}>
            {TEMP_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, fromUnit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Hőmérséklet from egység:', u);
                  setFromUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromUnit === u && styles.segmentTextActive]}>{TEMP_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectorLabel}>Ebbe:</Text>
          <View style={styles.segmentRow}>
            {TEMP_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, toUnit === u && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Átváltók] Hőmérséklet to egység:', u);
                  setToUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toUnit === u && styles.segmentTextActive]}>{TEMP_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték</Text>
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
          <View style={styles.resultSingle}>
            <Text style={styles.resultBigValue}>{result}</Text>
            <Text style={styles.resultUnitLabel}>{resultUnit}</Text>
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
  const [fromUnit, setFromUnit] = useState<PressureUnit>('Pa');
  const [toUnit, setToUnit] = useState<PressureUnit>('mbar');
  const [result, setResult] = useState('—');

  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v)) {
      setResult('—');
      return;
    }
    const converted = (v * PRESSURE_TO_PA[fromUnit]) / PRESSURE_TO_PA[toUnit];
    setResult(formatResult(converted));
  }, [value, fromUnit, toUnit]);

  const resultUnit = PRESSURE_DISPLAY[toUnit];

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
          <Text style={styles.selectorLabel}>Ebből:</Text>
          <View style={styles.segmentRow}>
            {PRESSURE_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, fromUnit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Nyomás from egység:', u);
                  setFromUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromUnit === u && styles.segmentTextActive]}>{PRESSURE_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectorLabel}>Ebbe:</Text>
          <View style={styles.segmentRow}>
            {PRESSURE_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, toUnit === u && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Átváltók] Nyomás to egység:', u);
                  setToUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toUnit === u && styles.segmentTextActive]}>{PRESSURE_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték</Text>
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
          <View style={styles.resultSingle}>
            <Text style={styles.resultBigValue}>{result}</Text>
            <Text style={styles.resultUnitLabel}>{resultUnit}</Text>
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
  const [fromUnit, setFromUnit] = useState<AirflowUnit>('m3h');
  const [toUnit, setToUnit] = useState<AirflowUnit>('ls');
  const [result, setResult] = useState('—');

  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v)) {
      setResult('—');
      return;
    }
    const converted = (v * AIRFLOW_TO_M3S[fromUnit]) / AIRFLOW_TO_M3S[toUnit];
    setResult(formatResult(converted));
  }, [value, fromUnit, toUnit]);

  const resultUnit = AIRFLOW_DISPLAY[toUnit];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Légszállítás kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Wind size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Légszállítás</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.selectorLabel}>Ebből:</Text>
          <View style={styles.segmentRow}>
            {AIRFLOW_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, fromUnit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Légszállítás from egység:', u);
                  setFromUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromUnit === u && styles.segmentTextActive]}>{AIRFLOW_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectorLabel}>Ebbe:</Text>
          <View style={styles.segmentRow}>
            {AIRFLOW_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, toUnit === u && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Átváltók] Légszállítás to egység:', u);
                  setToUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toUnit === u && styles.segmentTextActive]}>{AIRFLOW_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Átváltók] Légszállítás input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 1000"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />
          <View style={styles.resultSingle}>
            <Text style={styles.resultBigValue}>{result}</Text>
            <Text style={styles.resultUnitLabel}>{resultUnit}</Text>
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
  const [fromUnit, setFromUnit] = useState<PowerUnit>('kW');
  const [toUnit, setToUnit] = useState<PowerUnit>('BTUh');
  const [result, setResult] = useState('—');

  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v)) {
      setResult('—');
      return;
    }
    const converted = (v * POWER_TO_W[fromUnit]) / POWER_TO_W[toUnit];
    setResult(formatResult(converted));
  }, [value, fromUnit, toUnit]);

  const resultUnit = POWER_DISPLAY[toUnit];

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
          <Text style={styles.selectorLabel}>Ebből:</Text>
          <View style={styles.segmentRow}>
            {POWER_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, fromUnit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Teljesítmény from egység:', u);
                  setFromUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromUnit === u && styles.segmentTextActive]}>{POWER_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectorLabel}>Ebbe:</Text>
          <View style={styles.segmentRow}>
            {POWER_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, toUnit === u && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Átváltók] Teljesítmény to egység:', u);
                  setToUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toUnit === u && styles.segmentTextActive]}>{POWER_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték</Text>
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
          <View style={styles.resultSingle}>
            <Text style={styles.resultBigValue}>{result}</Text>
            <Text style={styles.resultUnitLabel}>{resultUnit}</Text>
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
  const [fromUnit, setFromUnit] = useState<MassFlowUnit>('kgh');
  const [toUnit, setToUnit] = useState<MassFlowUnit>('gs');
  const [result, setResult] = useState('—');

  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v)) {
      setResult('—');
      return;
    }
    const converted = (v * MASSFLOW_TO_KGS[fromUnit]) / MASSFLOW_TO_KGS[toUnit];
    setResult(formatResult(converted));
  }, [value, fromUnit, toUnit]);

  const resultUnit = MASSFLOW_DISPLAY[toUnit];

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
          <Text style={styles.selectorLabel}>Ebből:</Text>
          <View style={styles.segmentRow}>
            {MASSFLOW_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, fromUnit === u && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Átváltók] Tömegáram from egység:', u);
                  setFromUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromUnit === u && styles.segmentTextActive]}>{MASSFLOW_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectorLabel}>Ebbe:</Text>
          <View style={styles.segmentRow}>
            {MASSFLOW_UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, toUnit === u && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Átváltók] Tömegáram to egység:', u);
                  setToUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toUnit === u && styles.segmentTextActive]}>{MASSFLOW_DISPLAY[u]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Érték</Text>
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
          <View style={styles.resultSingle}>
            <Text style={styles.resultBigValue}>{result}</Text>
            <Text style={styles.resultUnitLabel}>{resultUnit}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Currency Converter ───────────────────────────────────────────────────────

const CURRENCIES = ['HUF', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'PLN', 'RON', 'RSD', 'UAH'];

function CurrencyConverter() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('HUF');
  const [result, setResult] = useState('—');
  const [rate, setRate] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rate whenever from/to changes
  useEffect(() => {
    if (fromCurrency === toCurrency) {
      setRate(1);
      setTimestamp(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRate(null);
    setResult('—');

    // Use frankfurter.app — free, no key, supports HUF and all listed currencies
    fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data && data.rates && data.rates[toCurrency] !== undefined) {
          const r = data.rates[toCurrency] as number;
          setRate(r);
          setTimestamp(data.date ?? null);
          setError(null);
          console.log(`[Pénzváltó] Árfolyam: 1 ${fromCurrency} = ${r} ${toCurrency}, dátum: ${data.date}`);
        } else {
          setError('Árfolyam nem elérhető');
          console.log('[Pénzváltó] Hiba: árfolyam nem elérhető', data);
        }
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        setError('Hálózati hiba');
        setLoading(false);
        console.log('[Pénzváltó] Hálózati hiba:', e);
      });

    return () => { cancelled = true; };
  }, [fromCurrency, toCurrency]);

  // Recalculate result when value or rate changes
  useEffect(() => {
    const v = parseFloat(value);
    if (value.trim() === '' || isNaN(v) || rate === null) {
      setResult('—');
      return;
    }
    const converted = v * rate;
    // Format: if HUF result, no decimals; otherwise 4 decimals
    const formatted = toCurrency === 'HUF' || converted >= 1000
      ? converted.toFixed(2)
      : converted.toFixed(4);
    setResult(formatted);
  }, [value, rate, toCurrency]);

  const swapCurrencies = () => {
    console.log(`[Pénzváltó] Csere: ${fromCurrency} ↔ ${toCurrency}`);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setValue('');
    setResult('—');
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          console.log('[Átváltók] Pénzváltó kártya toggled, open:', !open);
          setOpen(!open);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <DollarSign size={20} color={HVAC_BLUE} />
          <Text style={styles.cardTitle}>Pénzváltó</Text>
        </View>
        {open ? <ChevronUp size={18} color={HVAC_TEXT_SECONDARY} /> : <ChevronDown size={18} color={HVAC_TEXT_SECONDARY} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>

          {/* FROM currency */}
          <Text style={styles.label}>Ebből:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.segmentBtn, fromCurrency === c && styles.segmentBtnActive]}
                onPress={() => {
                  console.log('[Pénzváltó] Forrás pénznem:', c);
                  setFromCurrency(c);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, fromCurrency === c && styles.segmentTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TO currency */}
          <Text style={styles.label}>Ebbe:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.segmentBtn, toCurrency === c && styles.segmentBtnActiveTo]}
                onPress={() => {
                  console.log('[Pénzváltó] Cél pénznem:', c);
                  setToCurrency(c);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, toCurrency === c && styles.segmentTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount input */}
          <Text style={styles.label}>Összeg ({fromCurrency})</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={v => {
              console.log('[Pénzváltó] Összeg input:', v);
              setValue(v);
            }}
            keyboardType="numeric"
            placeholder="pl. 100"
            placeholderTextColor={HVAC_TEXT_SECONDARY}
          />

          {/* Swap button */}
          <TouchableOpacity
            onPress={swapCurrencies}
            activeOpacity={0.7}
            style={{
              alignSelf: 'center',
              marginBottom: 12,
              backgroundColor: HVAC_SURFACE,
              borderWidth: 1,
              borderColor: HVAC_BORDER,
              borderRadius: 10,
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: HVAC_BLUE, fontSize: 13, fontWeight: '600' }}>⇄ Csere</Text>
          </TouchableOpacity>

          {/* Result box */}
          <View style={{
            backgroundColor: HVAC_SURFACE,
            borderWidth: 1,
            borderColor: HVAC_BORDER,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
          }}>
            {loading ? (
              <Text style={{ color: HVAC_TEXT_SECONDARY, fontSize: 14 }}>Árfolyam betöltése...</Text>
            ) : error ? (
              <Text style={{ color: '#EF4444', fontSize: 14 }}>{error}</Text>
            ) : (
              <>
                <Text style={{ fontSize: 32, fontWeight: '800', color: HVAC_TEXT, fontVariant: ['tabular-nums'] }}>
                  {result}
                </Text>
                <Text style={{ fontSize: 14, color: HVAC_TEXT_SECONDARY, marginTop: 4 }}>
                  {toCurrency}
                </Text>
                {rate !== null && (
                  <Text style={{ fontSize: 12, color: HVAC_TEXT_SECONDARY, marginTop: 8 }}>
                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                  </Text>
                )}
                {timestamp && (
                  <Text style={{ fontSize: 11, color: HVAC_TEXT_SECONDARY, marginTop: 4, opacity: 0.7 }}>
                    MNB/ECB árfolyam · {timestamp}
                  </Text>
                )}
              </>
            )}
          </View>

        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AtvaltoScreen() {
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
        <Text style={styles.screenTitle}>{tool ? 'Gyors átváltás' : 'Átváltók'}</Text>
        {tool === 'currency' && <>
          <ToolGuide title="Valutaátváltó" useWhen="Egy összeget másik pénznemben szeretnél látni." needs="Összeg, kiinduló pénznem és célpénznem." accuracy="estimate" accuracyNote="Referenciaárfolyamot használ; a bank vagy kártyaszolgáltató tényleges árfolyama és díja eltérhet." />
          <CurrencyConverter />
        </>}
        {tool === 'pressure' && <>
          <ToolGuide title="Nyomás átváltása" useWhen="Ugyanazt a mért nyomást másik mértékegységben szeretnéd megkapni." needs="A mért érték, a jelenlegi és a kívánt mértékegység." accuracy="engineering" accuracyNote="Pontos mértékegység-átváltás. Az abszolút és relatív nyomás különbségét ez önmagában nem korrigálja." />
          <PressureConverter />
        </>}
        {!tool && <><CurrencyConverter /><TemperatureConverter /><PressureConverter /><AirflowConverter /><PowerConverter /><MassFlowConverter /></>}
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
  selectorLabel: {
    fontSize: 12,
    color: HVAC_TEXT_SECONDARY,
    marginBottom: 6,
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
  segmentBtnActiveTo: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
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
  resultSingle: {
    backgroundColor: HVAC_SURFACE,
    borderWidth: 1,
    borderColor: HVAC_BORDER,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  resultBigValue: {
    fontSize: 28,
    fontWeight: '800',
    color: HVAC_TEXT,
  },
  resultUnitLabel: {
    fontSize: 14,
    color: HVAC_TEXT_SECONDARY,
    marginTop: 4,
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
