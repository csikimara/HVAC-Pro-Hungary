import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Droplets, Snowflake, ThermometerSun, TriangleAlert } from 'lucide-react-native';
import { HelpText } from '@/contexts/HelpContext';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { CalculationReportButton } from '@/components/CalculationReportButton';
import { classifyCalculationQuality } from '@/domain/calculationQuality';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';
import {
  psychrometricState,
  stateAfterTemperatureChange,
  surfaceCondensationMarginC,
} from '@/domain/psychrometrics';

const CARD = '#161A1F';
const SURFACE = '#1C2128';
const BORDER = '#2A2F38';
const TEXT = '#E8ECF0';
const MUTED = '#98A3AF';
const BLUE = '#38BDF8';
const GREEN = '#22C55E';
const YELLOW = '#F59E0B';
const RED = '#EF4444';

function numberValue(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) {
  return <View style={{ flex: 1, minWidth: 145 }}>
    <Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11 }}>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={{ color: TEXT, fontSize: 17, padding: 12, flex: 1 }} />
      <Text style={{ color: MUTED, marginRight: 11 }}>{suffix}</Text>
    </View>
  </View>;
}

function Result({ label, value, color = TEXT }: { label: string; value: string; color?: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}>
    <Text style={{ color: MUTED, flex: 1, lineHeight: 19 }}>{label}</Text>
    <Text style={{ color, fontWeight: '900', textAlign: 'right', flex: 1, lineHeight: 19 }}>{value}</Text>
  </View>;
}

function Card({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 11 }}>
    <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>{number}. {title}</Text>
    {children}
  </View>;
}

export function PsychrometricTool() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [temperature, setTemperature] = useState('24');
  const [relativeHumidity, setRelativeHumidity] = useState('60');
  const [standardPressure, setStandardPressure] = useState(true);
  const [pressureHpa, setPressureHpa] = useState('1013,25');
  const [targetTemperature, setTargetTemperature] = useState('18');
  const [surfaceTemperature, setSurfaceTemperature] = useState('16');
  const [airTemperatureInstrument, setAirTemperatureInstrument] = useState('');
  const [humidityInstrument, setHumidityInstrument] = useState('');
  const [surfaceInstrument, setSurfaceInstrument] = useState('');
  const [calibrationReference, setCalibrationReference] = useState('');

  const state = useMemo(() => psychrometricState(
    numberValue(temperature),
    numberValue(relativeHumidity),
    (standardPressure ? 1013.25 : numberValue(pressureHpa)) * 100,
  ), [temperature, relativeHumidity, standardPressure, pressureHpa]);

  const changed = useMemo(() => state
    ? stateAfterTemperatureChange(state, numberValue(targetTemperature))
    : null, [state, targetTemperature]);
  const surfaceMargin = useMemo(() => state
    ? surfaceCondensationMarginC(state, numberValue(surfaceTemperature))
    : null, [state, surfaceTemperature]);

  const inputInvalid = state === null;
  const nearCondensation = surfaceMargin != null && surfaceMargin >= 0 && surfaceMargin < 2;
  const surfaceRisk = surfaceMargin != null && surfaceMargin < 0;
  const requiredEvidence: Array<readonly [string, string]> = completeMode
    ? [
      ['airTemperatureInstrument', airTemperatureInstrument],
      ['humidityInstrument', humidityInstrument],
      ['surfaceInstrument', surfaceInstrument],
      ['calibrationReference', calibrationReference],
    ] as const
    : [];
  const missingEvidence = requiredEvidence.filter(([, value]) => !value.trim()).map(([key]) => key);
  const quality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate',
    methodId: 'ashrae-psychrometrics',
    methodVersion: '2.0.0',
    requiredInputCount: completeMode ? requiredEvidence.length + 4 : 4,
    suppliedRequiredInputCount: completeMode ? requiredEvidence.length + 4 - missingEvidence.length : 4,
    assumedInputKeys: completeMode || !standardPressure ? [] : ['standardAtmosphericPressure'],
    missingRequiredInputKeys: missingEvidence,
    sources: [{ kind: 'engineering-reference', title: 'ASHRAE Fundamentals – Psychrometrics' }],
    verificationRequired: 'commissioning',
  });

  return <View style={{ gap: 14 }}>
    <View style={{ backgroundColor: '#101820', borderColor: `${BLUE}55`, borderWidth: 1, borderRadius: 14, padding: 14, gap: 7 }}>
      <Text style={{ color: BLUE, fontSize: 16, fontWeight: '900' }}>Röviden, mit kell érteni?</Text>
      <Text style={{ color: TEXT, lineHeight: 21 }}>A relatív páratartalom nem önálló vízmennyiség: azt mutatja, hogy az adott hőmérsékleten lehetséges maximumhoz képest mennyi vízgőz van a levegőben.</Text>
      <Text style={{ color: MUTED, lineHeight: 20 }}>Ha ugyanazt a levegőt lehűtöd, az RH nő. Ha eléred a harmatpontot, 100% lesz; további hűtésnél víz csapódik ki. Melegítéskor az RH csökken, miközben a tényleges nedvességtartalom változatlan maradhat.</Text>
    </View>

    <Card number={1} title="Milyen most a levegő?">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        <Field label="Levegő hőmérséklete" value={temperature} onChange={setTemperature} suffix="°C" />
        <Field label="Relatív páratartalom" value={relativeHumidity} onChange={setRelativeHumidity} suffix="% RH" />
      </View>
      <Text style={{ color: MUTED, fontSize: 13 }}>Légköri nyomás</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <TouchableOpacity onPress={() => setStandardPressure(true)} style={{ padding: 11, borderRadius: 10, borderWidth: 1, borderColor: standardPressure ? BLUE : BORDER, backgroundColor: standardPressure ? `${BLUE}22` : SURFACE }}><Text style={{ color: standardPressure ? TEXT : MUTED, fontWeight: '800' }}>Normál · 1013,25 hPa</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setStandardPressure(false)} style={{ padding: 11, borderRadius: 10, borderWidth: 1, borderColor: !standardPressure ? BLUE : BORDER, backgroundColor: !standardPressure ? `${BLUE}22` : SURFACE }}><Text style={{ color: !standardPressure ? TEXT : MUTED, fontWeight: '800' }}>Mért / helyi nyomás</Text></TouchableOpacity>
      </View>
      {!standardPressure && <Field label="Helyi abszolút légköri nyomás" value={pressureHpa} onChange={setPressureHpa} suffix="hPa(abs)" />}
      {completeMode && <View style={{ gap: 9 }}>
        <Text style={{ color: BLUE, fontWeight: '900' }}>Mérési bizonyíték a teljes adatkészlethez</Text>
        <Field label="Levegő-hőmérő azonosító / típus" value={airTemperatureInstrument} onChange={setAirTemperatureInstrument} suffix="" />
        <Field label="Páratartalom-mérő azonosító / típus" value={humidityInstrument} onChange={setHumidityInstrument} suffix="" />
        <Field label="Felületi hőmérő azonosító / típus" value={surfaceInstrument} onChange={setSurfaceInstrument} suffix="" />
        <Field label="Kalibrálási bizonylat / dátum" value={calibrationReference} onChange={setCalibrationReference} suffix="" />
        {missingEvidence.length > 0 && <Text style={{ color: YELLOW, fontWeight: '800' }}>A hiányzó műszeradatok miatt az eredmény jelenleg mérnöki ajánlásként menthető.</Text>}
      </View>}
      {inputInvalid ? <Text style={{ color: RED, fontWeight: '800' }}>Ellenőrizd az adatokat: RH 0–100%, hőmérséklet −80…200 °C, nyomás 300–1200 hPa lehet.</Text> : <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}>
        <Result label="Harmatpont" value={`${state.dewPointC.toFixed(1)} °C`} color={BLUE} />
        <Result label="Nedvességtartalom" value={`${(state.humidityRatioKgKg * 1000).toFixed(2)} g/kg száraz levegő`} />
        <Result label="Abszolút páratartalom" value={`${state.absoluteHumidityGm3.toFixed(2)} g/m³`} />
        <Result label="Vízgőz parciális nyomása" value={`${(state.vapourPressurePa / 100).toFixed(2)} hPa`} />
        <Result label="Nedves levegő fajlagos entalpiája" value={`${state.enthalpyKjKg.toFixed(1)} kJ/kg száraz levegő`} />
      </View>}
    </Card>

    <Card number={2} title="Mi történik, ha lehűl vagy felmelegszik?">
      <Field label="Új levegő-hőmérséklet" value={targetTemperature} onChange={setTargetTemperature} suffix="°C" />
      <HelpText>Itt azt feltételezzük, hogy nem adunk hozzá és nem veszünk el nedvességet. Ha a levegő a harmatpont alá hűl, ez már fizikailag nem tartható: a többlet víz kicsapódik.</HelpText>
      {changed && <View style={{ backgroundColor: changed.condensationOccurs ? `${RED}12` : `${GREEN}10`, borderColor: changed.condensationOccurs ? `${RED}66` : `${GREEN}44`, borderWidth: 1, borderRadius: 12, padding: 12 }}>
        <Result label="Új relatív páratartalom" value={`${changed.finalRelativeHumidityPct.toFixed(1)} % RH`} color={changed.condensationOccurs ? RED : GREEN} />
        <Result label="Kicsapódás nélküli elméleti RH" value={`${changed.theoreticalRelativeHumidityPct.toFixed(1)} %`} />
        <Result label="Várható kicsapódó víz" value={`${changed.condensateGPerKgDryAir.toFixed(2)} g/kg száraz levegő`} color={changed.condensationOccurs ? RED : TEXT} />
        <Result label="Lehűlés utáni harmatpont" value={`${changed.finalDewPointC.toFixed(1)} °C`} />
        <Text style={{ color: changed.condensationOccurs ? RED : GREEN, fontWeight: '900', lineHeight: 20, marginTop: 5 }}>{changed.condensationOccurs ? 'PÁRALECSAPÓDÁS: a célhőmérséklet a jelenlegi harmatpont alatt van.' : 'Nincs kicsapódás: a levegő ezen a hőmérsékleten még telítetlen.'}</Text>
      </View>}
    </Card>

    <Card number={3} title="Lecsapódik-e egy csövön, falon vagy befúvón?">
      <Field label="Mért felületi hőmérséklet" value={surfaceTemperature} onChange={setSurfaceTemperature} suffix="°C" />
      {state && surfaceMargin != null && <View style={{ backgroundColor: surfaceRisk ? `${RED}12` : nearCondensation ? `${YELLOW}12` : `${GREEN}10`, borderColor: surfaceRisk ? RED : nearCondensation ? YELLOW : `${GREEN}66`, borderWidth: 1, borderRadius: 12, padding: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {surfaceRisk ? <TriangleAlert size={21} color={RED} /> : nearCondensation ? <Droplets size={21} color={YELLOW} /> : <ThermometerSun size={21} color={GREEN} />}
          <Text style={{ color: surfaceRisk ? RED : nearCondensation ? YELLOW : GREEN, fontSize: 16, fontWeight: '900', flex: 1 }}>{surfaceRisk ? 'Páralecsapódás várható' : nearCondensation ? 'Nagyon kicsi a tartalék' : 'A felület a harmatpont felett van'}</Text>
        </View>
        <Result label="Felület − harmatpont különbség" value={`${surfaceMargin >= 0 ? '+' : ''}${surfaceMargin.toFixed(1)} K`} color={surfaceRisk ? RED : nearCondensation ? YELLOW : GREEN} />
        <Text style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>{surfaceRisk ? 'A felület hidegebb a levegő harmatpontjánál. Szigetelés, magasabb felületi hőmérséklet vagy a levegő nedvességtartalmának csökkentése szükséges.' : nearCondensation ? 'A mérőműszer pontatlansága és helyi hőhíd miatt már lehet nedvesedés. Ne tekintsd biztonságos tartaléknak.' : 'A pillanatnyi mérési pont alapján nincs felületi kondenzáció. Hőhíd és időben változó állapot ettől még külön ellenőrizendő.'}</Text>
      </View>}
    </Card>

    <View style={{ backgroundColor: '#101820', borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 14, gap: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Snowflake size={19} color={BLUE} /><Text style={{ color: TEXT, fontWeight: '900' }}>Helyszíni példa</Text></View>
      <Text style={{ color: MUTED, lineHeight: 20 }}>24 °C és 60% RH mellett a harmatpont körülbelül 15,8 °C. Egy 14 °C-os szigeteletlen cső felületén ezért várható vízkicsapódás; egy 18 °C-os felületen pillanatnyilag nem.</Text>
    </View>
    {state && changed && surfaceMargin != null && <CalculationReportButton buildRecord={() => ({
      toolId: 'psychrometrics', toolTitle: 'Hőmérséklet–páratartalom–harmatpont', language, jurisdiction,
      method: { id: quality.methodId, version: quality.methodVersion, name: 'Nedves levegő pszichrometriai állapota', formulaSummary: 'ASHRAE telítési gőznyomás, nedvességtartalom, entalpia, harmatpont és állandó nedvességtartalmú hőmérséklet-változás.' },
      inputs: [
        { key: 'temperature', label: 'Levegő hőmérséklete', value: numberValue(temperature), unit: '°C', origin: 'measured' },
        { key: 'relativeHumidity', label: 'Relatív páratartalom', value: numberValue(relativeHumidity), unit: '% RH', origin: 'measured' },
        { key: 'pressure', label: 'Abszolút légköri nyomás', value: standardPressure ? 1013.25 : numberValue(pressureHpa), unit: 'hPa(abs)', origin: standardPressure ? 'selected-typical' : 'measured' },
        { key: 'targetTemperature', label: 'Célhőmérséklet', value: numberValue(targetTemperature), unit: '°C', origin: 'measured' },
        { key: 'surfaceTemperature', label: 'Felületi hőmérséklet', value: numberValue(surfaceTemperature), unit: '°C', origin: 'measured' },
        ...requiredEvidence.map(([key, value]) => ({ key, label: key, value: value || null, origin: value ? 'measured' as const : 'missing' as const })),
      ],
      outputs: [
        { key: 'dewPoint', label: 'Harmatpont', value: Number(state.dewPointC.toFixed(2)), unit: '°C', origin: 'calculated' },
        { key: 'humidityRatio', label: 'Nedvességtartalom', value: Number((state.humidityRatioKgKg * 1000).toFixed(3)), unit: 'g/kg száraz levegő', origin: 'calculated' },
        { key: 'enthalpy', label: 'Entalpia', value: Number(state.enthalpyKjKg.toFixed(2)), unit: 'kJ/kg száraz levegő', origin: 'calculated' },
        { key: 'targetRh', label: 'Célhőmérsékleten várható RH', value: Number(changed.finalRelativeHumidityPct.toFixed(2)), unit: '% RH', origin: 'calculated' },
        { key: 'condensate', label: 'Kicsapódó víz', value: Number(changed.condensateGPerKgDryAir.toFixed(3)), unit: 'g/kg száraz levegő', origin: 'calculated' },
        { key: 'surfaceMargin', label: 'Felület–harmatpont tartalék', value: Number(surfaceMargin.toFixed(2)), unit: 'K', origin: 'calculated' },
      ],
      assumptions: quality.assumedInputKeys,
      sources: quality.sources,
      quality,
      complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
      requiredVerification: ['Műszerpontosság és kalibrálás ellenőrzése', 'Hőhidas és időben változó állapotok helyszíni vizsgálata'],
    })} />}
  </View>;
}
