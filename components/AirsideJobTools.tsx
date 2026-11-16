import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AccuracyNotice } from '@/components/AccuracyNotice';
import { CalculationModeSelector } from '@/components/CalculationModeSelector';
import { CalculationEvidencePanel } from '@/components/CalculationEvidencePanel';
import { CalculationReportButton } from '@/components/CalculationReportButton';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { classifyCalculationQuality } from '@/domain/calculationQuality';
import { jurisdictionName, jurisdictionStatus, jurisdictionStatusLabel } from '@/domain/engineeringStandards';
import { HelpText, HelpToggle } from '@/contexts/HelpContext';
import { useSavedRooms } from '@/contexts/SavedRoomsContext';
import { PressurePathBuilder } from '@/components/PressurePathBuilder';
import { airChangesForAirflow, airflowForAirChanges, filterFaceVelocity, kitchenAirBalance, preliminaryCommercialHoodAirflow, roomVolume, type CommercialCookingDuty } from '@/domain/kitchenVentilation';
import {
  airflowAtVelocity,
  classifyVelocity,
  designSpigotBranchNetwork,
  ductVelocity,
  pairedSupplyReturnRecommendation,
  recommendedDiameter,
  recommendedResidentialSupply,
  recommendedWetRoomExtract,
  roundSpigotDistribution,
  VELOCITY_LIMITS,
  type VelocityBand,
  type VelocityLocation,
} from '@/domain/airsideWorkflows';

const CARD = '#161A1F';
const SURFACE = '#1C2128';
const BORDER = '#2A2F38';
const TEXT = '#E8ECF0';
const MUTED = '#98A3AF';
const BLUE = '#1E90FF';
const GREEN = '#22C55E';
const YELLOW = '#F59E0B';
const RED = '#EF4444';

function n(value: string, fallback = 0) {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Field({ label, value, onChange, suffix, placeholder }: { label: string; value: string; onChange: (value: string) => void; suffix?: string; placeholder?: string }) {
  return <View style={{ flex: 1, minWidth: 135 }}>
    <Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11 }}>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder={placeholder} placeholderTextColor="#65717E" style={{ color: TEXT, fontSize: 16, padding: 12, flex: 1 }} />
      {suffix ? <Text style={{ color: MUTED, marginRight: 10 }}>{suffix}</Text> : null}
    </View>
  </View>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <View style={{ flex: 1, minWidth: 180 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#65717E" style={{ color: TEXT, fontSize: 16, padding: 12, backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11 }} /></View>;
}

function Choices<T extends string | number>({ values, value, labelOf, onChange }: { values: readonly T[]; value: T; labelOf?: (item: T) => string; onChange: (value: T) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
    {values.map(item => {
      const active = item === value;
      return <TouchableOpacity key={String(item)} onPress={() => onChange(item)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: active ? BLUE : BORDER, backgroundColor: active ? `${BLUE}28` : SURFACE }}>
        <Text style={{ color: active ? '#FFFFFF' : MUTED, fontSize: 14, fontWeight: '700' }}>{labelOf ? labelOf(item) : String(item)}</Text>
      </TouchableOpacity>;
    })}
  </View>;
}

function ResultLine({ label, value, color = TEXT }: { label: string; value: string; color?: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}><Text style={{ color: MUTED, flex: 1 }}>{label}</Text><Text style={{ color, fontWeight: '800', textAlign: 'right', flex: 1 }}>{value}</Text></View>;
}

function StandardsRegionNotice() {
  return <View style={{ backgroundColor: '#101820', borderColor: BORDER, borderWidth: 1, borderRadius: 12, padding: 12 }}><ResultLine label="Alkalmazott szabványrégió" value="Magyarország (HU)" color={BLUE} /><Text style={{ color: MUTED, fontSize: 12, lineHeight: 18 }}>A felület nyelve ettől független. Más országban a helyi előíráskészletet külön kell kiválasztani.</Text></View>;
}

function Band({ velocity, location }: { velocity: number; location: VelocityLocation }) {
  const band = classifyVelocity(velocity, location);
  const map: Record<VelocityBand, { label: string; color: string }> = {
    comfort: { label: 'Komfortos sebességi tartomány', color: GREEN },
    office: { label: 'Emelt / irodai sebességi tartomány', color: YELLOW },
    noisy: { label: 'Magas sebesség – zajkockázat', color: RED },
  };
  return <Text style={{ color: map[band].color, fontWeight: '800', marginTop: 5 }}>{velocity.toFixed(2)} m/s · {map[band].label}</Text>;
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 11 }}>
    <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>{number}. {title}</Text>
    {children}
  </View>;
}

type RoomType = 'living' | 'bedroom' | 'child' | 'office' | 'dining' | 'hall' | 'corridor' | 'kitchen' | 'bathroom' | 'wc' | 'utility' | 'other';
type RoomRow = { id: string | number; type: RoomType; customName: string; area: string; height: string; occupants: string; savedCoolingKw?: number; savedAccuracyLevel?: 'manufacturer' | 'engineering' | 'engineering-estimate' | 'estimate' };
const ROOM_LABELS: Record<RoomType, string> = { living: 'Nappali', bedroom: 'Hálószoba', child: 'Gyerekszoba', office: 'Dolgozó', dining: 'Étkező', hall: 'Előszoba', corridor: 'Folyosó', kitchen: 'Konyha', bathroom: 'Fürdőszoba', wc: 'WC', utility: 'Háztartási helyiség', other: 'Egyéb – saját név' };
const SUPPLY_ROOM_TYPES: RoomType[] = ['living', 'bedroom', 'child', 'office', 'dining', 'hall', 'corridor', 'other'];

function RoomTypeSelect({ value, onChange }: { value: RoomType; onChange: (value: RoomType) => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <TouchableOpacity onPress={() => setOpen(true)} style={{ backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 11, padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: TEXT, fontWeight: '800' }}>{ROOM_LABELS[value]}</Text><ChevronRight size={18} color={BLUE} /></TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: 24 }}><View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, maxHeight: '80%', padding: 12 }}><Text style={{ color: TEXT, fontSize: 18, fontWeight: '900', padding: 8 }}>Helyiség típusa</Text><ScrollView>{SUPPLY_ROOM_TYPES.map(type => <TouchableOpacity key={type} onPress={() => { onChange(type); setOpen(false); }} style={{ padding: 14, borderBottomColor: BORDER, borderBottomWidth: 1 }}><Text style={{ color: type === value ? BLUE : TEXT, fontSize: 16, fontWeight: '700' }}>{ROOM_LABELS[type]}</Text></TouchableOpacity>)}</ScrollView></View></View></Modal>
  </>;
}

function RoomPlanner({ count, mode, totalFlow, totalCapacityKw, onFlowSummary, onCountChange, onRowsChange }: { count: number; mode: 'cooling' | 'ventilation'; totalFlow: number; totalCapacityKw?: number; onFlowSummary?: (total: number, maximum: number, flows: number[]) => void; onCountChange?: (count: number) => void; onRowsChange?: (rows: RoomRow[], normalHeight: boolean) => void }) {
  const { rooms: savedRooms } = useSavedRooms();
  const [normalHeight, setNormalHeight] = useState(true);
  const [rooms, setRooms] = useState<RoomRow[]>(() => Array.from({ length: count }, (_, index) => ({ id: index + 1, type: index === 0 ? 'living' : index === 1 ? 'bedroom' : 'child', customName: '', area: index === 0 ? '25' : '12', height: '2,7', occupants: index === 0 ? '2' : '1' })));
  useEffect(() => setRooms(current => Array.from({ length: count }, (_, index) => current[index] ?? ({ id: Date.now() + index, type: 'bedroom', customName: '', area: '12', height: '2,7', occupants: '1' }))), [count]);
  const volumes = rooms.map(room => n(room.area) * (normalHeight ? 2.7 : n(room.height)));
  const totalVolume = volumes.reduce((sum, value) => sum + value, 0);
  const allHaveSavedLoads = mode === 'cooling' && rooms.length > 0 && rooms.every(room => (room.savedCoolingKw ?? 0) > 0);
  const totalSavedLoad = rooms.reduce((sum, room) => sum + (room.savedCoolingKw ?? 0), 0);
  const flows = rooms.map((room, index) => {
    if (mode === 'cooling') return allHaveSavedLoads && totalSavedLoad > 0 ? totalFlow * (room.savedCoolingKw ?? 0) / totalSavedLoad : totalVolume > 0 ? totalFlow * volumes[index] / totalVolume : 0;
    if (room.type === 'hall' || room.type === 'corridor') return 0;
    const area = n(room.area);
    const people = Math.max(0, Math.round(n(room.occupants)));
    const roomHeight = normalHeight ? 2.7 : n(room.height);
    if (room.type === 'living' || room.type === 'dining') return recommendedResidentialSupply('living', area, people, roomHeight)?.recommendedM3h ?? 0;
    if (room.type === 'bedroom' || room.type === 'child') return recommendedResidentialSupply('bedroom', area, people, roomHeight)?.recommendedM3h ?? 0;
    return Math.max(area * 0.42, people * 7) * 3.6;
  });
  const flowTotal = flows.reduce((sum, value) => sum + value, 0);
  const maxFlow = Math.max(0, ...flows);
  const flowSignature = flows.map(value => value.toFixed(4)).join('|');
  useEffect(() => onFlowSummary?.(flowTotal, maxFlow, flows), [flowTotal, maxFlow, onFlowSummary, flowSignature]);
  useEffect(() => onRowsChange?.(rooms, normalHeight), [normalHeight, onRowsChange, rooms]);
  const update = (id: string | number, patch: Partial<RoomRow>) => setRooms(current => current.map(room => room.id === id ? { ...room, ...patch, savedCoolingKw: patch.area != null || patch.height != null ? undefined : room.savedCoolingKw } : room));
  return <View style={{ gap: 10 }}>
    {mode === 'cooling' && savedRooms.length > 0 && <TouchableOpacity onPress={() => { const selected = savedRooms.slice(0, 6); onCountChange?.(selected.length); setNormalHeight(false); setRooms(selected.map(room => ({ id: room.id, type: 'other', customName: room.name, area: String(room.areaM2), height: String(room.heightM).replace('.', ','), occupants: '1', savedCoolingKw: room.coolingLoadKw, savedAccuracyLevel: room.quality?.level ?? 'engineering-estimate' }))); }} style={{ backgroundColor: `${GREEN}22`, borderColor: GREEN, borderWidth: 1, borderRadius: 11, padding: 12 }}><Text style={{ color: GREEN, textAlign: 'center', fontWeight: '900' }}>Mentett helyiségi hőterhelések átvétele ({Math.min(savedRooms.length, 6)} db)</Text></TouchableOpacity>}
    <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>Normál, 2,70 m belmagasság</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kapcsold ki, ha a helyiségek magasságát külön szeretnéd megadni.</Text></View><Switch value={normalHeight} onValueChange={setNormalHeight} /></View>
    {rooms.map((room, index) => <View key={room.id} style={{ backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 13, gap: 9 }}>
      <Text style={{ color: TEXT, fontSize: 16, fontWeight: '900' }}>{index + 1}. befúvási helyiség</Text>
      <RoomTypeSelect value={room.type} onChange={type => update(room.id, { type })} />
      {room.type === 'other' && <Field label="Helyiség saját neve" value={room.customName} onChange={value => update(room.id, { customName: value })} />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Alapterület" value={room.area} onChange={value => update(room.id, { area: value })} suffix="m²" />{!normalHeight && <Field label="Belmagasság" value={room.height} onChange={value => update(room.id, { height: value })} suffix="m" />}{mode === 'ventilation' && <Field label="Rendszeresen bent lévők" value={room.occupants} onChange={value => update(room.id, { occupants: value })} suffix="fő" />}</View>
      <ResultLine label="Számított helyiségtérfogat" value={`${volumes[index].toFixed(1)} m³`} />
      {mode === 'ventilation' && (room.type === 'hall' || room.type === 'corridor') ? <Text style={{ color: YELLOW, lineHeight: 19 }}>Általában átáramlási terület, külön frisslevegő-befúvás helyett az ajtórést vagy átvezetőt kell méretezni.</Text> : <>
        <ResultLine label={mode === 'cooling' ? (allHaveSavedLoads ? 'Hőterhelés-arányos légmennyiség' : 'Térfogatarányos légmennyiség') : 'Javasolt frisslevegő'} value={`${flows[index].toFixed(0)} m³/h`} color={BLUE} />
        {mode === 'cooling' && room.savedCoolingKw != null ? <><ResultLine label="Mentett helyiségi hűtési igény" value={`${room.savedCoolingKw.toFixed(2)} kW`} color={GREEN} /><Text style={{ color: room.savedAccuracyLevel === 'engineering' ? GREEN : YELLOW, fontSize: 12, fontWeight: '800' }}>{room.savedAccuracyLevel === 'engineering' ? 'Mérnöki számításból átvéve' : 'Mérnöki ajánlásból átvéve'}</Text></> : mode === 'cooling' && totalCapacityKw != null && <ResultLine label="Térfogatarányos hűtési teljesítmény" value={`${(totalCapacityKw * (totalVolume > 0 ? volumes[index] / totalVolume : 0)).toFixed(2)} kW`} color={YELLOW} />}
        <ResultLine label="Komfortos induló ágméret" value={`Ø ${recommendedDiameter(flows[index], 'branch', 'comfort')} mm`} color={GREEN} />
      </>}
    </View>)}
    <ResultLine label={mode === 'ventilation' ? 'Helyiségek összes javasolt befúvása' : 'Felosztott teljes légmennyiség'} value={`${flowTotal.toFixed(0)} m³/h`} color={BLUE} />
    {mode === 'cooling' && <Text style={{ color: allHaveSavedLoads ? GREEN : YELLOW, fontSize: 13, lineHeight: 19 }}>{allHaveSavedLoads ? `A légmennyiség felosztása a mentett, összesen ${totalSavedLoad.toFixed(2)} kW helyiségi hőterhelés arányában történik.` : 'A helyiségi kW-érték itt csak térfogatarányos előbecslés. Falak, ablakok, tájolás és napsugárzás nélkül nem nevezhető helyiségi hőterhelés-számításnak.'}</Text>}
  </View>;
}

export function DuctedAirsideWizard() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [designMode, setDesignMode] = useState<'unit' | 'system'>('unit');
  const [airflow, setAirflow] = useState('600');
  const [supplyCount, setSupplyCount] = useState(4);
  const [extractCount, setExtractCount] = useState(1);
  const [returnLayout, setReturnLayout] = useState<'paired' | 'central'>('paired');
  const [machineSpigots, setMachineSpigots] = useState(4);
  const [spigotDiameter, setSpigotDiameter] = useState('200');
  const [branchDiameter, setBranchDiameter] = useState('160');
  const [returnDiameter, setReturnDiameter] = useState('250');
  const [pressureSide, setPressureSide] = useState<'supply' | 'return'>('supply');
  const [coolingCapacity, setCoolingCapacity] = useState('7');
  const [largestRoomFlow, setLargestRoomFlow] = useState(0);
  const [speed1Flow, setSpeed1Flow] = useState('450');
  const [speed1Esp, setSpeed1Esp] = useState('40');
  const [speed2Flow, setSpeed2Flow] = useState('600');
  const [speed2Esp, setSpeed2Esp] = useState('70');
  const [speed3Flow, setSpeed3Flow] = useState('750');
  const [speed3Esp, setSpeed3Esp] = useState('100');
  const [machineManufacturer, setMachineManufacturer] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [dataSheetRevision, setDataSheetRevision] = useState('');
  const [soundPowerDb, setSoundPowerDb] = useState('');
  const [roomRows, setRoomRows] = useState<RoomRow[]>([]);
  const [roomFlows, setRoomFlows] = useState<number[]>([]);
  const [roomsUseNormalHeight, setRoomsUseNormalHeight] = useState(true);

  const totalAirflow = n(airflow);
  const spigotSizing = useMemo(() => roundSpigotDistribution(totalAirflow, supplyCount, machineSpigots), [totalAirflow, supplyCount, machineSpigots]);
  const terminalDemands = roomRows.map((room, index) => ({ id: String(room.id), label: room.type === 'other' ? room.customName || `${index + 1}. helyiség` : ROOM_LABELS[room.type], airflowM3h: roomFlows[index] ?? 0 }));
  const branchNetwork = useMemo(() => designSpigotBranchNetwork(terminalDemands, machineSpigots, 'comfort'), [machineSpigots, roomRows, roomFlows]);
  const terminalFlow = largestRoomFlow > 0 ? largestRoomFlow : supplyCount > 0 ? totalAirflow / supplyCount : 0;
  const effectiveReturnCount = returnLayout === 'paired' ? supplyCount : extractCount;
  const returnFlow = returnLayout === 'paired' ? terminalFlow : effectiveReturnCount > 0 ? totalAirflow / effectiveReturnCount : 0;
  const pathStartFlow = branchNetwork ? Math.max(...branchNetwork.spigots.map(item => item.airflowM3h)) : (spigotSizing?.minimumYSplits ?? 0) > 0 ? terminalFlow * 2 : terminalFlow;
  const pairedComfort = pairedSupplyReturnRecommendation(totalAirflow, supplyCount, machineSpigots, 'comfort', terminalFlow);
  const pairedOffice = pairedSupplyReturnRecommendation(totalAirflow, supplyCount, machineSpigots, 'office', terminalFlow);
  const actualPathStartDiameter = n(spigotDiameter);
  const actualMainVelocity = ductVelocity(pathStartFlow, actualPathStartDiameter);
  const actualBranchVelocity = ductVelocity(terminalFlow, n(branchDiameter));
  const actualReturnDiameter = returnLayout === 'paired' ? n(branchDiameter) : n(returnDiameter);
  const actualReturnVelocity = ductVelocity(returnFlow, actualReturnDiameter);
  const selectedPathStartFlow = pressureSide === 'supply' ? pathStartFlow : returnLayout === 'paired' ? pathStartFlow : totalAirflow;
  const selectedPathEndFlow = pressureSide === 'supply' ? terminalFlow : returnFlow;
  const systemCapacity = Math.min(
    airflowAtVelocity(n(spigotDiameter), VELOCITY_LIMITS.branch.comfort) * Math.min(supplyCount, machineSpigots),
    airflowAtVelocity(n(branchDiameter), VELOCITY_LIMITS.branch.comfort) * supplyCount,
    airflowAtVelocity(actualReturnDiameter, VELOCITY_LIMITS.branch.comfort) * effectiveReturnCount,
  );
  const speeds = [
    { name: '1. fokozat', flow: n(speed1Flow), esp: n(speed1Esp) },
    { name: '2. fokozat', flow: n(speed2Flow), esp: n(speed2Esp) },
    { name: '3. fokozat', flow: n(speed3Flow), esp: n(speed3Esp) },
  ];
  const handleCoolingRoomSummary = useCallback((_total: number, maximum: number, flows: number[]) => { setLargestRoomFlow(maximum); setRoomFlows(flows); }, []);
  const handleRoomRows = useCallback((rows: RoomRow[], normalHeight: boolean) => { setRoomRows(rows); setRoomsUseNormalHeight(normalHeight); }, []);
  const requiredEntries = [
    ['airflow', airflow], ['coolingCapacity', coolingCapacity], ['machineSpigots', String(machineSpigots)], ['spigotDiameter', spigotDiameter], ['branchDiameter', branchDiameter],
    ...(returnLayout === 'central' ? [['returnDiameter', returnDiameter] as const] : []),
    ...(designMode === 'unit' ? [['machineManufacturer', machineManufacturer] as const, ['machineModel', machineModel] as const, ['dataSheetRevision', dataSheetRevision] as const, ['soundPowerDb', soundPowerDb] as const, ['speed1Flow', speed1Flow] as const, ['speed1Esp', speed1Esp] as const, ['speed2Flow', speed2Flow] as const, ['speed2Esp', speed2Esp] as const, ['speed3Flow', speed3Flow] as const, ['speed3Esp', speed3Esp] as const] : []),
    ...roomRows.flatMap((room, index) => [[`room.${index + 1}.area`, room.area], [`room.${index + 1}.height`, roomsUseNormalHeight ? '2.7' : room.height], [`room.${index + 1}.coolingLoad`, room.savedCoolingKw == null ? '' : String(room.savedCoolingKw)]] as const),
  ];
  const textKeys = ['machineManufacturer', 'machineModel', 'dataSheetRevision'];
  const missingRequired = completeMode ? requiredEntries.filter(([key, value]) => !String(value).trim() || (!textKeys.includes(key) && n(String(value)) <= 0)).map(([key]) => key) : [];
  const assumedKeys = completeMode ? roomRows.filter(room => room.savedCoolingKw == null).map((_, index) => `room.${index + 1}.coolingLoad`) : ['room.coolingLoadDistribution', 'fanCurve', 'soundData'];
  const quality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'ducted-unit-airside-sizing', methodVersion: '2.0.0',
    requiredInputCount: requiredEntries.length, suppliedRequiredInputCount: requiredEntries.length - missingRequired.length,
    assumedInputKeys: assumedKeys, missingRequiredInputKeys: missingRequired,
    sources: [{ kind: 'engineering-reference', title: 'Légmérleg, keresztmetszeti sebesség és kritikus légút nyomásvesztesége' }], verificationRequired: 'commissioning',
  });

  return <View style={{ gap: 14 }}>
    <HelpToggle />
    <CalculationModeSelector />
    <AccuracyNotice level="engineering-estimate" note="A keresztmetszet és légsebesség geometriailag számított. A komfort–irodai–magas sebességi sáv tervezési ajánlás; a tényleges zajhoz a kiválasztott gép, hangcsillapító és légtechnikai végpont gyártói hangadata is szükséges." />
    <CalculationEvidencePanel method="Légmérleg, keresztmetszeti sebesség, szakaszonkénti Darcy–Weisbach veszteség és kritikus út ESP-ellenőrzése." inputs="Helyiségek, hőigény/légmennyiség, gépcsonkok, ventilátor-fokozatok vagy szükséges ESP, csőszakaszok, idomok és végpontok." assumptions="Általános módban tipikus sebességhatárok és igazolt termékadat hiányában általános veszteségtényezők." source="EN-alapú légtechnikai módszerek, ellenőrzött mérnöki összefüggések és kiválasztáskor gyártói adat." accuracy="A bemenetektől függően részletes számítás vagy általános adatokkal készült ajánlás." verification="Gyári ventilátorgörbe, zajadat, helyszíni légmennyiségmérés és beszabályozás." />
    <Step number={1} title="Helyiségek és a gép adatai">
      <Text style={{ color: MUTED }}>Hány helyre szeretnél befújni?</Text><Choices values={[1, 2, 3, 4, 5, 6] as const} value={supplyCount} onChange={value => setSupplyCount(Number(value))} />
      <RoomPlanner count={supplyCount} mode="cooling" totalFlow={totalAirflow} totalCapacityKw={n(coolingCapacity)} onFlowSummary={handleCoolingRoomSummary} onCountChange={setSupplyCount} onRowsChange={handleRoomRows} />
      <Choices values={['unit', 'system'] as const} value={designMode} onChange={value => setDesignMode(value as 'unit' | 'system')} labelOf={item => item === 'unit' ? 'Megvan a beltéri / fan-coil' : 'Előbb megépítem a rendszert'} />
      <HelpText>{designMode === 'unit' ? 'A gép adatlapján fokozatonként keresd a légmennyiséget és az adott légmennyiségnél rendelkezésre álló külső statikus nyomást (ESP). Ha csak egyetlen Pa-adat szerepel, az még nem teljes ventilátorgörbe.' : 'Építsd fel a tervezett csöveket és végpontokat. Az app megmondja, mekkora légmennyiséget és nyomást kell tudnia a kiválasztandó gépnek.'}</HelpText>
      {designMode === 'unit' && [
        ['1.', speed1Flow, setSpeed1Flow, speed1Esp, setSpeed1Esp],
        ['2.', speed2Flow, setSpeed2Flow, speed2Esp, setSpeed2Esp],
        ['3.', speed3Flow, setSpeed3Flow, speed3Esp, setSpeed3Esp],
      ].map(([label, flow, setFlow, esp, setEsp]) => <View key={label as string} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        <Field label={`${label} fokozat légmennyisége`} value={flow as string} onChange={setFlow as (v: string) => void} suffix="m³/h" />
        <Field label="Gyári rendelkezésre álló ESP" value={esp as string} onChange={setEsp as (v: string) => void} suffix="Pa" />
      </View>)}
      <Field label="Gép névleges hűtési teljesítménye" value={coolingCapacity} onChange={setCoolingCapacity} suffix="kW" />
      {completeMode && <><Text style={{ color: BLUE, fontWeight: '900', marginTop: 4 }}>A konkrét gép igazolt adatai</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><TextField label="Gyártó" value={machineManufacturer} onChange={setMachineManufacturer} placeholder="pl. Fujitsu" /><TextField label="Pontos típus" value={machineModel} onChange={setMachineModel} placeholder="beltéri / fan-coil típusa" /><TextField label="Adatlap kiadása vagy hivatkozása" value={dataSheetRevision} onChange={setDataSheetRevision} placeholder="dokumentum, kiadás, oldal" /><Field label="Gyártói hangteljesítményszint" value={soundPowerDb} onChange={setSoundPowerDb} suffix="dB(A)" /></View></>}
    </Step>

    <Step number={2} title="Hány helyre fújunk és honnan szívunk?">
      <HelpText>Alapesetben minden helyiség befúvó ágához azonos légmennyiségű és azonos névleges méretű visszaszívó ág tartozik. Közös visszaszívást csak akkor válassz, ha valóban központi rácshoz vagy közös gyűjtőághoz építed a rendszert.</HelpText>
      <Text style={{ color: MUTED }}>Visszaszívás kialakítása</Text><Choices values={['paired', 'central'] as const} value={returnLayout} onChange={value => setReturnLayout(value as 'paired' | 'central')} labelOf={item => item === 'paired' ? 'Helyiségenként páros' : 'Közös / központi'} />
      {returnLayout === 'paired' ? <View style={{ backgroundColor: `${GREEN}18`, borderColor: `${GREEN}66`, borderWidth: 1, borderRadius: 12, padding: 12 }}><Text style={{ color: GREEN, fontWeight: '900' }}>{supplyCount} befúvó + {supplyCount} visszaszívó ág</Text><Text style={{ color: MUTED, marginTop: 4, lineHeight: 18 }}>A befúvó és visszaszívó helyiségi ágak mérete együtt változik.</Text></View> : <><Text style={{ color: MUTED }}>Közös visszaszívási helyek száma</Text><Choices values={[1, 2, 3, 4, 5, 6] as const} value={extractCount} onChange={value => setExtractCount(Number(value))} /></>}
      <Text style={{ color: MUTED }}>Gyári befúvócsonkok száma</Text><Choices values={[1, 2, 3, 4, 5, 6] as const} value={machineSpigots} onChange={value => setMachineSpigots(Number(value))} labelOf={item => `${item} db`} />
      <Field label="Egy gyári befúvócsonk átmérője" value={spigotDiameter} onChange={setSpigotDiameter} suffix="mm" />
      <Field label="Tervezett teljes légmennyiség" value={airflow} onChange={setAirflow} suffix="m³/h" />
      {spigotSizing && <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}>
        <ResultLine label="Használt gyári csonkok" value={`${spigotSizing.usedSpigots} db`} />
        <ResultLine label="Közvetlen, osztás nélküli ág" value={`${spigotSizing.directBranches} db`} />
        <ResultLine label="Szükséges Y-osztás legalább" value={`${spigotSizing.minimumYSplits} db`} color={spigotSizing.minimumYSplits > 0 ? YELLOW : GREEN} />
        <ResultLine label="Mértékadó befúvó végpont" value={`${terminalFlow.toFixed(0)} m³/h`} />
        {spigotSizing.unusedSpigots > 0 && <Text style={{ color: YELLOW, lineHeight: 19 }}>A fennmaradó {spigotSizing.unusedSpigots} csonk lezárhatóságát és a megengedett légelosztást a gép gyártói dokumentációja alapján kell ellenőrizni.</Text>}
        {branchNetwork && branchNetwork.maximumSplitDepth > 1 && <Text style={{ color: BLUE, lineHeight: 19 }}>A program {branchNetwork.maximumSplitDepth} elágazási szintig felépítette az eltérő helyiségi légmennyiségeket kezelő Y-hálózatot.</Text>}
      </View>}
      {branchNetwork && <View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ color: TEXT, fontWeight: '900', fontSize: 16 }}>Javasolt elosztás a gyári csonkok között</Text>
        <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18 }}>A csonkok terhelését a helyiségek tényleges légmennyisége alapján egyenlíti ki, nem azonos végponti légmennyiséget feltételez.</Text>
        {branchNetwork.spigots.map(item => <View key={item.spigotIndex} style={{ backgroundColor: SURFACE, borderRadius: 10, padding: 10 }}><Text style={{ color: GREEN, fontWeight: '900' }}>{item.spigotIndex}. csonk: {item.airflowM3h.toFixed(0)} m³/h · Ø {item.root.diameterMm} mm</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>{item.terminalCount} helyiség · {item.splitCount} Y-idom · legfeljebb {item.maximumSplitDepth} elágazási szint</Text></View>)}
        {returnLayout === 'paired' && <Text style={{ color: GREEN, fontSize: 12, lineHeight: 18 }}>A visszaszívó hálózat ugyanezt a helyiségenkénti légmennyiséget és ágszerkezetet tükrözi.</Text>}
      </View>}
      <ResultLine label={returnLayout === 'paired' ? 'Egy befúvó–visszaszívó ág párban' : 'Egy közös visszaszívási ágban'} value={`${returnFlow.toFixed(0)} m³/h`} />
    </Step>

    <Step number={3} title="Csőméretek oda-vissza ellenőrzése">
      <HelpText>A komfortos méret a halkabb, kisebb sebességű kiindulás. Az „irodai/helyszűkés” méret kisebb lehet, de nagyobb a zaj és nyomásveszteség kockázata.</HelpText>
      {spigotSizing && <>
        {returnLayout === 'paired' && pairedComfort && pairedOffice ? <>
          <ResultLine label="Komfortos legterheltebb induló ág – mindkét oldalon" value={`Ø ${recommendedDiameter(pathStartFlow, 'branch', 'comfort')} mm`} color={GREEN} />
          <ResultLine label="Komfortos legterheltebb helyiségi ág – mindkét oldalon" value={`Ø ${recommendedDiameter(terminalFlow, 'branch', 'comfort')} mm`} color={GREEN} />
          <ResultLine label="Helyszűkés/irodai induló / helyiségi ág" value={`Ø ${recommendedDiameter(pathStartFlow, 'branch', 'office')} / Ø ${recommendedDiameter(terminalFlow, 'branch', 'office')} mm`} color={YELLOW} />
          <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18 }}>Az egyes csonkok és Y-idomok tényleges légmennyiségét a fenti hálózati felosztás tartalmazza; nem feltételezünk automatikusan két azonos ágat.</Text>
        </> : <>
          <ResultLine label="Komfortos javaslat – géptől induló, legterheltebb befúvó ág" value={`Ø ${recommendedDiameter(pathStartFlow, 'branch', 'comfort')} mm`} color={GREEN} />
          <ResultLine label="Komfortos javaslat – Y utáni befúvó végponti ág" value={`Ø ${recommendedDiameter(terminalFlow, 'branch', 'comfort')} mm`} color={GREEN} />
          <ResultLine label="Helyszűkés/irodai javaslat – induló / végponti befúvó ág" value={`Ø ${recommendedDiameter(pathStartFlow, 'branch', 'office')} / Ø ${recommendedDiameter(terminalFlow, 'branch', 'office')} mm`} color={YELLOW} />
        </>}
      </>}
      {returnLayout === 'central' && <ResultLine label="Komfortos javaslat – közös visszaszívó ág" value={`Ø ${recommendedDiameter(returnFlow, 'branch', 'comfort')} mm`} color={GREEN} />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        <Field label="Tényleges induló ág / gyári csonk" value={spigotDiameter} onChange={setSpigotDiameter} suffix="mm" />
        <Field label={returnLayout === 'paired' ? 'Helyiségi ág mérete mindkét oldalon' : 'Y utáni / végponti befúvó ág'} value={branchDiameter} onChange={setBranchDiameter} suffix="mm" />
        {returnLayout === 'central' && <Field label="Közös visszaszívó ág" value={returnDiameter} onChange={setReturnDiameter} suffix="mm" />}
      </View>
      <Text style={{ color: MUTED }}>Géptől induló befúvó ág</Text><Band velocity={actualMainVelocity} location="branch" />
      <Text style={{ color: MUTED }}>Befúvó végponti ág</Text><Band velocity={actualBranchVelocity} location="branch" />
      <Text style={{ color: MUTED }}>{returnLayout === 'paired' ? 'Páros visszaszívó ág – ugyanazzal az átmérővel' : 'Közös visszaszívó ág'}</Text><Band velocity={actualReturnVelocity} location="branch" />
      {designMode === 'system' && <ResultLine label="A megadott csövekkel komfortosan szállítható" value={`${systemCapacity.toFixed(0)} m³/h`} color={GREEN} />}
    </Step>

    <Step number={4} title="Gép/fokozat előzetes ellenőrzése">
      <HelpText>Itt még csak azt nézzük, hogy a fokozat légmennyisége elég-e. A Pa-értéket az 5. lépésben kiszámolt teljes nyomásveszteséggel kell összevetni.</HelpText>
      {speeds.map(speed => {
        const flowOk = speed.flow >= totalAirflow;
        return <ResultLine key={speed.name} label={speed.name} value={`${speed.flow.toFixed(0)} m³/h · ${speed.esp.toFixed(0)} Pa${flowOk ? ' · légmennyiség rendben' : ' · kevés légmennyiség'}`} color={flowOk ? GREEN : RED} />;
      })}
      <Text style={{ color: MUTED, lineHeight: 19 }}>A teljes megfelelőséghez a részletes útvonal nyomásveszteségének kisebbnek kell lennie a gyári ventilátorgörbén, az adott légmennyiségnél rendelkezésre álló ESP-nél. Egyetlen katalógus-munkapont nem helyettesíti a teljes görbét.</Text>
      <Text style={{ color: missingRequired.length ? RED : quality.assumedInputKeys.length ? YELLOW : GREEN, fontWeight: '800', lineHeight: 19 }}>Adatkitöltöttség: {quality.dataCompletenessPercent}% · {missingRequired.length ? `Hiányzik: ${missingRequired.join(', ')}` : quality.assumedInputKeys.length ? 'Általános vagy feltételezett adatok is szerepelnek.' : 'A kötelező rendszeradatok rendelkezésre állnak.'}</Text>
      <CalculationReportButton buildRecord={() => ({
        toolId: 'ducted-airside', toolTitle: 'Légcsatornázható split / fan-coil légoldali méretezése', language, jurisdiction,
        method: { id: quality.methodId, version: quality.methodVersion, name: 'Helyiségi hőigény-arányos légelosztás és légoldali ellenőrzés', formulaSummary: 'Helyiségi légmennyiség-felosztás, csonkelosztás, keresztmetszeti sebesség, befúvó-visszaszívó egyensúly és gyári ESP összevetése.' },
        inputs: [
          { key: 'airflow', label: 'Tervezett teljes légmennyiség', value: totalAirflow, unit: 'm³/h', origin: 'measured' },
          { key: 'coolingCapacity', label: 'Névleges hűtési teljesítmény', value: n(coolingCapacity), unit: 'kW', origin: designMode === 'unit' ? 'manufacturer' : 'measured' },
          { key: 'machine', label: 'Gép', value: `${machineManufacturer} ${machineModel}`.trim() || null, origin: machineModel ? 'manufacturer' : 'missing' },
          { key: 'dataSheet', label: 'Gyártói adatlap', value: dataSheetRevision || null, origin: dataSheetRevision ? 'manufacturer' : 'missing' },
          { key: 'spigots', label: 'Gyári befúvócsonkok', value: machineSpigots, unit: 'db', origin: designMode === 'unit' ? 'manufacturer' : 'measured' },
          { key: 'spigotDiameter', label: 'Gyári/induló ág átmérője', value: n(spigotDiameter), unit: 'mm', origin: designMode === 'unit' ? 'manufacturer' : 'measured' },
          ...roomRows.flatMap((room, index) => [
            { key: `room.${index + 1}.name`, label: `${index + 1}. helyiség`, value: room.type === 'other' ? room.customName : ROOM_LABELS[room.type], origin: 'measured' as const },
            { key: `room.${index + 1}.area`, label: `${index + 1}. helyiség alapterülete`, value: n(room.area), unit: 'm²', origin: 'measured' as const },
            { key: `room.${index + 1}.height`, label: `${index + 1}. helyiség belmagassága`, value: roomsUseNormalHeight ? 2.7 : n(room.height), unit: 'm', origin: roomsUseNormalHeight ? 'selected-typical' as const : 'measured' as const },
            { key: `room.${index + 1}.coolingLoad`, label: `${index + 1}. helyiség hűtési igénye`, value: room.savedCoolingKw ?? null, unit: 'kW', origin: room.savedCoolingKw == null ? 'missing' as const : 'calculated' as const },
          ]),
        ],
        outputs: [
          { key: 'terminalFlow', label: 'Mértékadó végponti légmennyiség', value: Number(terminalFlow.toFixed(1)), unit: 'm³/h', origin: 'calculated' },
          { key: 'startVelocity', label: 'Induló ág légsebessége', value: Number(actualMainVelocity.toFixed(2)), unit: 'm/s', origin: 'calculated' },
          { key: 'branchVelocity', label: 'Végponti ág légsebessége', value: Number(actualBranchVelocity.toFixed(2)), unit: 'm/s', origin: 'calculated' },
          { key: 'returnVelocity', label: 'Visszaszívó ág légsebessége', value: Number(actualReturnVelocity.toFixed(2)), unit: 'm/s', origin: 'calculated' },
          { key: 'minimumYSplits', label: 'Szükséges Y-osztások', value: spigotSizing?.minimumYSplits ?? 0, unit: 'db', origin: 'calculated' },
        ],
        assumptions: quality.assumedInputKeys, sources: quality.sources, quality,
        complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
        requiredVerification: ['A teljes befúvó és visszaszívó kritikus út kiszámítása', 'Gyári ventilátorgörbe és hangadat ellenőrzése', 'Helyszíni légmennyiségmérés és beszabályozás'],
      })} />
    </Step>

    <Step number={5} title="Csövek, idomok, rácsok és légszelepek">
      <HelpText>A befúvó és a visszaszívó helyiségi ág légmennyisége és névleges mérete páros kialakításnál azonos. A nyomásveszteségüket mégis külön ellenőrizd, mert eltérhet a csőhossz, az idom, a rács és a szűrő. Mindkét oldalon a legnagyobb veszteségű útvonal a mértékadó.</HelpText>
      <Choices values={['supply', 'return'] as const} value={pressureSide} onChange={value => setPressureSide(value as 'supply' | 'return')} labelOf={item => item === 'supply' ? 'Befúvó légút' : 'Visszaszívó légút'} />
      <PressurePathBuilder key={`${pressureSide}-${returnLayout}`} externalAirflow={String(selectedPathStartFlow)} downstreamAirflow={String(selectedPathEndFlow)} />
    </Step>
  </View>;
}

export function ResidentialAhuWizard() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [side, setSide] = useState<'supply' | 'extract'>('supply');
  const [supplyFlow, setSupplyFlow] = useState('400');
  const [extractFlow, setExtractFlow] = useState('400');
  const [supplyRooms, setSupplyRooms] = useState(5);
  const [extractRooms, setExtractRooms] = useState(3);
  const [supplyMains, setSupplyMains] = useState<1 | 2>(1);
  const [extractMains, setExtractMains] = useState<1 | 2>(1);
  const [supplyMainDiameter, setSupplyMainDiameter] = useState('250');
  const [extractMainDiameter, setExtractMainDiameter] = useState('250');
  const [supplyBranchDiameter, setSupplyBranchDiameter] = useState('125');
  const [extractBranchDiameter, setExtractBranchDiameter] = useState('125');
  const [roomSuggestedFlow, setRoomSuggestedFlow] = useState(0);
  const [largestSupplyRoomFlow, setLargestSupplyRoomFlow] = useState(0);
  const [useRoomDemand, setUseRoomDemand] = useState(true);
  const [machineManufacturer, setMachineManufacturer] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineDataSheet, setMachineDataSheet] = useState('');
  const [supplyCurveRef, setSupplyCurveRef] = useState('');
  const [extractCurveRef, setExtractCurveRef] = useState('');
  const [soundPowerDb, setSoundPowerDb] = useState('');
  const [roomRows, setRoomRows] = useState<RoomRow[]>([]);
  const [roomsUseNormalHeight, setRoomsUseNormalHeight] = useState(true);

  const supplyTotal = useRoomDemand && roomSuggestedFlow > 0 ? roomSuggestedFlow : n(supplyFlow);
  const extractTotal = n(extractFlow);
  const supplyMainFlow = supplyTotal / supplyMains;
  const extractMainFlow = extractTotal / extractMains;
  const supplyRoomFlow = largestSupplyRoomFlow > 0 ? largestSupplyRoomFlow : supplyTotal / supplyRooms;
  const extractRoomFlow = extractTotal / extractRooms;
  const imbalance = supplyTotal - extractTotal;
  const selectedStartFlow = side === 'supply' ? supplyMainFlow : extractMainFlow;
  const selectedEndFlow = side === 'supply' ? supplyRoomFlow : extractRoomFlow;
  const handleVentilationRoomSummary = useCallback((total: number, maximum: number) => { setRoomSuggestedFlow(total); setLargestSupplyRoomFlow(maximum); }, []);
  const handleVentilationRows = useCallback((rows: RoomRow[], normalHeight: boolean) => { setRoomRows(rows); setRoomsUseNormalHeight(normalHeight); }, []);
  const ahuRequired = [
    ['supplyFlow', String(supplyTotal)], ['extractFlow', extractFlow], ['supplyMainDiameter', supplyMainDiameter], ['extractMainDiameter', extractMainDiameter], ['supplyBranchDiameter', supplyBranchDiameter], ['extractBranchDiameter', extractBranchDiameter],
    ['machineManufacturer', machineManufacturer], ['machineModel', machineModel], ['machineDataSheet', machineDataSheet], ['supplyCurveRef', supplyCurveRef], ['extractCurveRef', extractCurveRef], ['soundPowerDb', soundPowerDb],
    ...roomRows.flatMap((room, index) => [[`room.${index + 1}.area`, room.area], [`room.${index + 1}.height`, roomsUseNormalHeight ? '2.7' : room.height], [`room.${index + 1}.occupants`, room.occupants]] as const),
  ];
  const ahuTextKeys = ['machineManufacturer', 'machineModel', 'machineDataSheet', 'supplyCurveRef', 'extractCurveRef'];
  const ahuMissing = completeMode ? ahuRequired.filter(([key, value]) => !String(value).trim() || (!ahuTextKeys.includes(key) && n(String(value)) <= 0)).map(([key]) => key) : [];
  const ahuQuality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'residential-ahu-air-balance', methodVersion: '2.0.0',
    requiredInputCount: ahuRequired.length, suppliedRequiredInputCount: ahuRequired.length - ahuMissing.length,
    assumedInputKeys: completeMode ? [] : ['roomUseProfiles', 'airQualityCategory', 'terminalLosses'], missingRequiredInputKeys: ahuMissing,
    sources: [{ kind: 'standard', title: 'EN 16798-alapú lakóépületi légmérleg és légcsatorna-méretezés' }], verificationRequired: 'commissioning',
  });

  return <View style={{ gap: 14 }}>
    <HelpToggle />
    <CalculationModeSelector />
    <AccuracyNotice level="engineering-estimate" note="A légmennyiség-elosztás és a légsebesség geometriailag számított. A csőhálózat végleges megfelelőségéhez a kiválasztott légkezelő külön befúvó- és elszívó ventilátorgörbéjét, hangadatait, valamint a helyiségenkénti légmérleget is ellenőrizni kell." />
    <CalculationEvidencePanel method="Helyiségi frisslevegő-igény, befúvó/elszívó légmérleg, főcsatorna és leágazás méretezése, kritikus út vesztesége." inputs="Helyiségek, használat és létszám, belmagasság, befúvó és elszívó légmennyiségek, hálózati elemek, gépgörbe." assumptions="Ajánlásos módban tipikus lakóépületi használat és általános elemveszteségek." source="EN 16798/REHVA-alapú modell, csatorna-méretezési összefüggések, igazolt gyártói görbék." accuracy="A bemenetektől és az országprofil lezártságától függő minősítés." verification="Helyiségenkénti légmennyiségmérés, légmérleg és beszabályozás; szükség esetén tervezői ellenőrzés." />
    <Step number={1} title="Befúvási helyiségek és frisslevegő-igény">
      <HelpText>Ez a munkafolyamat családi házas hővisszanyerős légkezelőhöz készült, ahol közös befúvó és elszívó főcsatornából ágazunk le a helyiségek felé. A 300–500 m³/h csak gyakori készüléktartomány, nem kötelező határ.</HelpText>
      <Text style={{ color: MUTED }}>Befúvási helyiségek száma</Text><Choices values={[2, 3, 4, 5, 6, 7, 8] as const} value={supplyRooms} onChange={value => setSupplyRooms(Number(value))} />
      <RoomPlanner count={supplyRooms} mode="ventilation" totalFlow={supplyTotal} onFlowSummary={handleVentilationRoomSummary} onRowsChange={handleVentilationRows} />
      <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>A helyiségekből számolt befúvást használjuk</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kikapcsolva kézzel adhatsz meg más teljes légmennyiséget.</Text></View><Switch value={useRoomDemand} onValueChange={setUseRoomDemand} /></View>
      {useRoomDemand ? <ResultLine label="Számított teljes befúvás" value={`${supplyTotal.toFixed(0)} m³/h`} color={BLUE} /> : <Field label="Kézzel megadott befújt levegő" value={supplyFlow} onChange={setSupplyFlow} suffix="m³/h" />}
      <Field label="Elszívott levegő" value={extractFlow} onChange={setExtractFlow} suffix="m³/h" />
      <ResultLine label="Légmérleg (befúvás − elszívás)" value={`${imbalance >= 0 ? '+' : ''}${imbalance.toFixed(0)} m³/h`} color={Math.abs(imbalance) <= Math.max(supplyTotal, extractTotal) * 0.05 ? GREEN : YELLOW} />
      <HelpText>A nulla közeli érték kiegyensúlyozott alapállapot. A kívánt épületnyomást, kandallót, páraelszívót és egyéb elszívókat külön figyelembe kell venni.</HelpText>
      {completeMode && <><Text style={{ color: BLUE, fontWeight: '900' }}>A konkrét légkezelő igazolt adatai</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><TextField label="Gyártó" value={machineManufacturer} onChange={setMachineManufacturer} /><TextField label="Pontos típus" value={machineModel} onChange={setMachineModel} /><TextField label="Adatlap kiadása / oldala" value={machineDataSheet} onChange={setMachineDataSheet} /><TextField label="Befúvó ventilátorgörbe hivatkozása" value={supplyCurveRef} onChange={setSupplyCurveRef} /><TextField label="Elszívó ventilátorgörbe hivatkozása" value={extractCurveRef} onChange={setExtractCurveRef} /><Field label="Gyártói hangteljesítményszint" value={soundPowerDb} onChange={setSoundPowerDb} suffix="dB(A)" /></View></>}
    </Step>
    <Step number={2} title="Főcsatornák és helyiségi leágazások">
      <Text style={{ color: MUTED }}>Elszívási helyiségek száma</Text><Choices values={[1, 2, 3, 4, 5, 6] as const} value={extractRooms} onChange={value => setExtractRooms(Number(value))} />
      <Text style={{ color: MUTED }}>Befúvó főcsatornák</Text><Choices values={[1, 2] as const} value={supplyMains} onChange={value => setSupplyMains(value as 1 | 2)} labelOf={item => `${item} db`} />
      <Text style={{ color: MUTED }}>Elszívó főcsatornák</Text><Choices values={[1, 2] as const} value={extractMains} onChange={value => setExtractMains(value as 1 | 2)} labelOf={item => `${item} db`} />
      <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}>
        <ResultLine label="Egy befúvó főcsatornában" value={`${supplyMainFlow.toFixed(0)} m³/h`} />
        <ResultLine label="Átlagosan egy befúvó helyiségbe" value={`${supplyRoomFlow.toFixed(0)} m³/h`} />
        <ResultLine label="Egy elszívó főcsatornában" value={`${extractMainFlow.toFixed(0)} m³/h`} />
        <ResultLine label="Átlagosan egy elszívó helyiségből" value={`${extractRoomFlow.toFixed(0)} m³/h`} />
      </View>
      <HelpText>Az egyenlő elosztás csak induló felosztás. A nappali, hálók, fürdő, WC és konyha tényleges légmennyiségét a helyiségek funkciója és használata alapján kell megadni.</HelpText>
    </Step>
    <Step number={3} title="Főcsatorna és leágazások mérete">
      <ResultLine label="Befúvó főcsatorna – komfortos javaslat" value={`Ø ${recommendedDiameter(supplyMainFlow, 'main', 'comfort')} mm`} color={GREEN} />
      <ResultLine label="Befúvó helyiségi ág – induló javaslat" value={`Ø ${recommendedDiameter(supplyRoomFlow, 'branch', 'comfort')} mm`} color={GREEN} />
      <ResultLine label="Elszívó főcsatorna – komfortos javaslat" value={`Ø ${recommendedDiameter(extractMainFlow, 'main', 'comfort')} mm`} color={GREEN} />
      <ResultLine label="Elszívó helyiségi ág – induló javaslat" value={`Ø ${recommendedDiameter(extractRoomFlow, 'branch', 'comfort')} mm`} color={GREEN} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Befúvó főcsatorna" value={supplyMainDiameter} onChange={setSupplyMainDiameter} suffix="mm" /><Field label="Befúvó leágazás" value={supplyBranchDiameter} onChange={setSupplyBranchDiameter} suffix="mm" /><Field label="Elszívó főcsatorna" value={extractMainDiameter} onChange={setExtractMainDiameter} suffix="mm" /><Field label="Elszívó leágazás" value={extractBranchDiameter} onChange={setExtractBranchDiameter} suffix="mm" /></View>
      <Text style={{ color: MUTED }}>Befúvó főcsatorna</Text><Band velocity={ductVelocity(supplyMainFlow, n(supplyMainDiameter))} location="main" />
      <Text style={{ color: MUTED }}>Befúvó helyiségi ág</Text><Band velocity={ductVelocity(supplyRoomFlow, n(supplyBranchDiameter))} location="branch" />
      <Text style={{ color: MUTED }}>Elszívó főcsatorna</Text><Band velocity={ductVelocity(extractMainFlow, n(extractMainDiameter))} location="main" />
      <Text style={{ color: MUTED }}>Elszívó helyiségi ág</Text><Band velocity={ductVelocity(extractRoomFlow, n(extractBranchDiameter))} location="branch" />
      <Text style={{ color: ahuMissing.length ? RED : ahuQuality.assumedInputKeys.length ? YELLOW : GREEN, fontWeight: '800', lineHeight: 19 }}>Adatkitöltöttség: {ahuQuality.dataCompletenessPercent}% · {ahuMissing.length ? `Hiányzik: ${ahuMissing.join(', ')}` : ahuQuality.assumedInputKeys.length ? 'Általános tervezési adatok is szerepelnek.' : 'A kötelező rendszeradatok rendelkezésre állnak.'}</Text>
      <CalculationReportButton buildRecord={() => ({
        toolId: 'residential-ahu', toolTitle: 'Családi házas légkezelő hálózata', language, jurisdiction,
        method: { id: ahuQuality.methodId, version: ahuQuality.methodVersion, name: 'Helyiségi frisslevegő-igény és kétoldali légmérleg', formulaSummary: 'Helyiségi befúvás + elszívási mérleg, főcsatornánkénti térfogatáram, keresztmetszeti légsebesség és külön kritikus út.' },
        inputs: [
          { key: 'machine', label: 'Légkezelő', value: `${machineManufacturer} ${machineModel}`.trim() || null, origin: machineModel ? 'manufacturer' : 'missing' },
          { key: 'supplyFlow', label: 'Teljes befúvás', value: Number(supplyTotal.toFixed(1)), unit: 'm³/h', origin: useRoomDemand ? 'calculated' : 'measured' },
          { key: 'extractFlow', label: 'Teljes elszívás', value: extractTotal, unit: 'm³/h', origin: 'measured' },
          ...roomRows.flatMap((room, index) => [
            { key: `room.${index + 1}.name`, label: `${index + 1}. befúvási helyiség`, value: room.type === 'other' ? room.customName : ROOM_LABELS[room.type], origin: 'measured' as const },
            { key: `room.${index + 1}.area`, label: `${index + 1}. helyiség alapterülete`, value: n(room.area), unit: 'm²', origin: 'measured' as const },
            { key: `room.${index + 1}.height`, label: `${index + 1}. helyiség belmagassága`, value: roomsUseNormalHeight ? 2.7 : n(room.height), unit: 'm', origin: roomsUseNormalHeight ? 'selected-typical' as const : 'measured' as const },
            { key: `room.${index + 1}.occupants`, label: `${index + 1}. helyiség létszáma`, value: n(room.occupants), unit: 'fő', origin: 'measured' as const },
          ]),
        ],
        outputs: [
          { key: 'imbalance', label: 'Befúvás–elszívás légmérleg', value: Number(imbalance.toFixed(1)), unit: 'm³/h', origin: 'calculated' },
          { key: 'supplyMainVelocity', label: 'Befúvó főcsatorna sebessége', value: Number(ductVelocity(supplyMainFlow, n(supplyMainDiameter)).toFixed(2)), unit: 'm/s', origin: 'calculated' },
          { key: 'extractMainVelocity', label: 'Elszívó főcsatorna sebessége', value: Number(ductVelocity(extractMainFlow, n(extractMainDiameter)).toFixed(2)), unit: 'm/s', origin: 'calculated' },
        ],
        assumptions: ahuQuality.assumedInputKeys, sources: ahuQuality.sources, quality: ahuQuality,
        complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`,
        requiredVerification: ['Befúvó és elszívó kritikus út külön számítása', 'Mindkét ventilátorgörbe ellenőrzése', 'Helyiségenkénti légmennyiségmérés és beszabályozás'],
      })} />
    </Step>
    <Step number={4} title="A mértékadó légút részletes ellenőrzése">
      <Choices values={['supply', 'extract'] as const} value={side} onChange={value => setSide(value as 'supply' | 'extract')} labelOf={item => item === 'supply' ? 'Befúvó oldal' : 'Elszívó oldal'} />
      <HelpText>A befúvó és elszívó hálózatot külön kell kiszámolni, mert más lehet a csőhossz, az idomok, a szűrő és a végpontok vesztesége. Mindkét eredményt a légkezelő megfelelő ventilátorgörbéjével kell összevetni.</HelpText>
      <PressurePathBuilder externalAirflow={String(selectedStartFlow)} downstreamAirflow={String(selectedEndFlow)} />
    </Step>
  </View>;
}

export function BathroomExhaustWizard() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [roomType, setRoomType] = useState<'bathroom' | 'wc' | 'combined'>('bathroom');
  const [area, setArea] = useState('6');
  const [height, setHeight] = useState('2,6');
  const [normalHeight, setNormalHeight] = useState(true);
  const [mode, setMode] = useState<'flow' | 'diameter'>('flow');
  const [diameter, setDiameter] = useState('125');
  const [requiredFlow, setRequiredFlow] = useState('');
  const [requirementSource, setRequirementSource] = useState('');
  const [fanManufacturer, setFanManufacturer] = useState('');
  const [fanModel, setFanModel] = useState('');
  const [fanRatedFlow, setFanRatedFlow] = useState('');
  const [fanPressure, setFanPressure] = useState('');
  const [fanSound, setFanSound] = useState('');
  const effectiveHeight = normalHeight ? 2.7 : n(height);
  const recommendation = recommendedWetRoomExtract(roomType, n(area), effectiveHeight);
  const selectedFlow = completeMode && n(requiredFlow) > 0 ? n(requiredFlow) : recommendation?.recommendedM3h ?? 0;
  const suggestedDiameter = recommendedDiameter(selectedFlow, 'branch', 'comfort');
  const velocity = ductVelocity(selectedFlow, n(diameter));
  const diameterCapacity = airflowAtVelocity(n(diameter), VELOCITY_LIMITS.branch.comfort);
  const bathRequired = [['area', area], ['height', String(effectiveHeight)], ['requiredFlow', requiredFlow], ['requirementSource', requirementSource], ['diameter', diameter], ['fanManufacturer', fanManufacturer], ['fanModel', fanModel], ['fanRatedFlow', fanRatedFlow], ['fanPressure', fanPressure], ['fanSound', fanSound]] as const;
  const bathTextKeys = ['requirementSource', 'fanManufacturer', 'fanModel'];
  const bathMissing = completeMode ? bathRequired.filter(([key, value]) => !value.trim() || (!bathTextKeys.includes(key) && n(value) <= 0)).map(([key]) => key) : [];
  const bathQuality = classifyCalculationQuality({ mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'wet-room-exhaust', methodVersion: '2.0.0', requiredInputCount: bathRequired.length, suppliedRequiredInputCount: bathRequired.length - bathMissing.length, assumedInputKeys: completeMode ? [] : ['airChangesPerHour', 'roomTypeMinimum'], missingRequiredInputKeys: bathMissing, sources: [{ kind: 'standard', title: completeMode && requirementSource ? requirementSource : 'EN 16798/REHVA-alapú lakóépületi ajánlás' }], verificationRequired: 'commissioning' });

  return <View style={{ gap: 14 }}>
    <HelpToggle />
    <CalculationModeSelector />
    <StandardsRegionNotice />
    <AccuracyNotice level="engineering-estimate" note="A helyiségtípus szerinti minimum a REHVA/EN 16798-alapú lakóépületi ajánlásból, a térfogat szerinti ellenőrzés általános 6 1/h légcsere-tervezési értékből készül. A nagyobbik eredményt használjuk; helyi előírás vagy gyártói adat felülírhatja." />
    <CalculationEvidencePanel method="Helyiségtípus szerinti légmennyiség és térfogati légcsere közül a nagyobbik, majd csősebesség-ellenőrzés." inputs="Helyiségtípus, alapterület, tényleges belmagasság, csőátmérő és ventilátoradat." assumptions="Ajánlásos módban 6 1/h térfogati ellenőrzés és lakóépületi tipikus használat." source="EN 16798/REHVA-alapú lakóépületi ajánlás és gyártói ventilátorgörbe." accuracy="Ajánlás mindaddig, amíg a helyi minimum és a konkrét ventilátorgörbe nincs igazolva." verification="Helyi előírás, légmennyiségmérés, zaj és utánpótló levegő ellenőrzése." />
    <View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 14, padding: 14, gap: 5 }}><Text style={{ color: TEXT, fontSize: 16, fontWeight: '900' }}>Az alkalmazott értékek ajánlások</Text><Text style={{ color: MUTED, lineHeight: 19 }}>Fürdő: 54 m³/h · külön WC: 36 m³/h · fürdő + WC: 72 m³/h. Emellett 6 1/h térfogati ellenőrzés készül, és a nagyobb érték lesz a javaslat. Ezek nem egységes magyar jogszabályi minimumként jelennek meg.</Text></View>
    <Step number={1} title="Milyen helyiséget szellőztetsz?">
      <HelpText>Az alapterület és belmagasság a helyiség térfogatához kell. Az app a helyiségtípus szerinti minimumot és a térfogat szerinti ellenőrzést is megmutatja, majd a nagyobb értéket ajánlja.</HelpText>
      <Choices values={['bathroom', 'wc', 'combined'] as const} value={roomType} onChange={value => setRoomType(value as 'bathroom' | 'wc' | 'combined')} labelOf={item => item === 'bathroom' ? 'Fürdőszoba' : item === 'wc' ? 'Külön WC' : 'Fürdő + WC'} />
      <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>Normál, 2,70 m belmagasság</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kapcsold ki, ha más a belmagasság.</Text></View><Switch value={normalHeight} onValueChange={setNormalHeight} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Alapterület" value={area} onChange={setArea} suffix="m²" />{!normalHeight && <Field label="Belmagasság" value={height} onChange={setHeight} suffix="m" />}</View>
      {completeMode && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Alkalmazandó előírt/tervezett elszívás" value={requiredFlow} onChange={setRequiredFlow} suffix="m³/h" /><TextField label="Követelmény forrása, kiadása, pontja" value={requirementSource} onChange={setRequirementSource} /></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><TextField label="Ventilátor gyártója" value={fanManufacturer} onChange={setFanManufacturer} /><TextField label="Ventilátor pontos típusa" value={fanModel} onChange={setFanModel} /><Field label="Gyári légszállítás az üzemi pontban" value={fanRatedFlow} onChange={setFanRatedFlow} suffix="m³/h" /><Field label="Gyári rendelkezésre álló nyomás" value={fanPressure} onChange={setFanPressure} suffix="Pa" /><Field label="Gyártói hangadat" value={fanSound} onChange={setFanSound} suffix="dB(A)" /></View></>}
      {recommendation && <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}><ResultLine label="Számított helyiségtérfogat" value={`${recommendation.volumeM3.toFixed(1)} m³`} /><ResultLine label="Helyiségtípus szerinti ajánlás" value={`${recommendation.standardMinimumM3h.toFixed(0)} m³/h`} /><ResultLine label="6 1/h térfogati ellenőrzés" value={`${recommendation.volumeCheckM3h.toFixed(0)} m³/h`} /><ResultLine label="Javasolt elszívás" value={`${recommendation.recommendedM3h.toFixed(0)} m³/h`} color={BLUE} /></View>}
    </Step>
    <Step number={2} title="Légszállításból csőméret – vagy csőméretből légszállítás">
      <HelpText>Ha még nincs cső, kérj javasolt átmérőt. Ha a cső már be van építve, add meg a belső átmérőjét, és ellenőrizd, mennyi levegőt tud elfogadható sebességgel elvinni.</HelpText>
      <Choices values={['flow', 'diameter'] as const} value={mode} onChange={value => setMode(value as 'flow' | 'diameter')} labelOf={item => item === 'flow' ? 'Az app adjon csőméretet' : 'Megvan a csőméret'} />
      <Field label="Beépíthető belső csőátmérő" value={diameter} onChange={setDiameter} suffix="mm" />
      {mode === 'flow' ? <ResultLine label="Komfortos javasolt csőméret" value={`Ø ${suggestedDiameter} mm`} color={GREEN} /> : <ResultLine label="Ezzel a csővel komfortosan szállítható" value={`${diameterCapacity.toFixed(0)} m³/h`} color={GREEN} />}
      <Band velocity={velocity} location="branch" />
      <ResultLine label="Ventilátor névleges légszállítása legalább" value={`${Math.ceil(selectedFlow / 5) * 5} m³/h + a csőhálózat nyomásvesztesége`} color={BLUE} />
      <Text style={{ color: bathMissing.length ? RED : bathQuality.assumedInputKeys.length ? YELLOW : GREEN, fontWeight: '800' }}>Adatkitöltöttség: {bathQuality.dataCompletenessPercent}%{bathMissing.length ? ` · Hiányzik: ${bathMissing.join(', ')}` : ''}</Text>
      <CalculationReportButton buildRecord={() => ({ toolId: 'bathroom-exhaust', toolTitle: 'Fürdőszoba / WC elszívása', language, jurisdiction, method: { id: bathQuality.methodId, version: bathQuality.methodVersion, name: 'Nedves helyiség elszívási méretezése', formulaSummary: 'Helyiségtípus szerinti követelmény és térfogati légcsere, majd csősebesség és ventilátor üzemi pont ellenőrzése.' }, inputs: [{ key: 'roomType', label: 'Helyiségtípus', value: roomType, origin: 'measured' }, { key: 'area', label: 'Alapterület', value: n(area), unit: 'm²', origin: 'measured' }, { key: 'height', label: 'Belmagasság', value: effectiveHeight, unit: 'm', origin: normalHeight ? 'selected-typical' : 'measured' }, { key: 'requiredFlow', label: 'Igazolt tervezési légmennyiség', value: requiredFlow || null, unit: 'm³/h', origin: requiredFlow ? 'measured' : 'missing' }, { key: 'requirementSource', label: 'Követelmény forrása', value: requirementSource || null, origin: requirementSource ? 'manufacturer' : 'missing' }, { key: 'fan', label: 'Ventilátor', value: `${fanManufacturer} ${fanModel}`.trim() || null, origin: fanModel ? 'manufacturer' : 'missing' }, { key: 'diameter', label: 'Cső belső átmérője', value: n(diameter), unit: 'mm', origin: 'measured' }], outputs: [{ key: 'flow', label: 'Tervezési elszívás', value: Number(selectedFlow.toFixed(1)), unit: 'm³/h', origin: 'calculated' }, { key: 'diameter', label: 'Komfortos javasolt csőméret', value: suggestedDiameter, unit: 'mm', origin: 'calculated' }, { key: 'velocity', label: 'Légsebesség', value: Number(velocity.toFixed(2)), unit: 'm/s', origin: 'calculated' }], assumptions: bathQuality.assumedInputKeys, sources: bathQuality.sources, quality: bathQuality, complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`, requiredVerification: ['Utánpótló levegő biztosítása', 'Ventilátorgörbe és csőhálózati nyomásveszteség összevetése', 'Helyszíni légmennyiség- és zajmérés'] })} />
    </Step>
  </View>;
}

export function FreshAirGuide() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [roomType, setRoomType] = useState<'living' | 'bedroom'>('living');
  const [area, setArea] = useState('25');
  const [height, setHeight] = useState('2,7');
  const [normalHeight, setNormalHeight] = useState(true);
  const [occupants, setOccupants] = useState('3');
  const [personRate, setPersonRate] = useState('');
  const [areaRate, setAreaRate] = useState('');
  const [categorySource, setCategorySource] = useState('');
  const effectiveRoomHeight = normalHeight ? 2.7 : n(height);
  const guidedResult = recommendedResidentialSupply(roomType, n(area), Math.max(0, Math.round(n(occupants))), effectiveRoomHeight);
  const exactFlow = Math.max(n(occupants) * n(personRate), n(area) * n(areaRate));
  const result = completeMode && exactFlow > 0 ? { volumeM3: n(area) * effectiveRoomHeight, roomScheduleM3h: n(area) * n(areaRate), personCheckM3h: n(occupants) * n(personRate), recommendedM3h: exactFlow, resultingAirChangesPerHour: exactFlow / Math.max(0.001, n(area) * effectiveRoomHeight) } : guidedResult;
  const freshRequired = [['area', area], ['height', String(effectiveRoomHeight)], ['occupants', occupants], ['personRate', personRate], ['areaRate', areaRate], ['categorySource', categorySource]] as const;
  const freshMissing = completeMode ? freshRequired.filter(([key, value]) => !value.trim() || (key !== 'categorySource' && n(value) <= 0)).map(([key]) => key) : [];
  const freshQuality = classifyCalculationQuality({ mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: 'residential-fresh-air', methodVersion: '2.0.0', requiredInputCount: freshRequired.length, suppliedRequiredInputCount: freshRequired.length - freshMissing.length, assumedInputKeys: completeMode ? [] : ['personRate', 'areaRate', 'iaqCategory'], missingRequiredInputKeys: freshMissing, sources: [{ kind: 'standard', title: categorySource || 'EN 16798/REHVA lakóépületi modellajánlás' }], verificationRequired: 'commissioning' });
  return <View style={{ gap: 14 }}>
    <HelpToggle />
    <CalculationModeSelector />
    <StandardsRegionNotice />
    <AccuracyNotice level="engineering-estimate" note="REHVA lakóépületi modellajánlás: a befúvás a nappaliba és hálókba kerül, a levegő átáramlik a vizes helyiségek felé, ahonnan elszívjuk. Az app a helyiség- és személyalapú ellenőrzés közül a nagyobbat ajánlja." />
    <CalculationEvidencePanel method="Helyiség- és személyalapú frisslevegő-igény összevetése, a nagyobb tervezési érték kiválasztása." inputs="Helyiségtípus, alapterület, belmagasság, rendszeresen bent tartózkodók száma." assumptions="Általános módban tipikus lakóépületi aktivitás és átáramlási út." source="EN 16798/REHVA lakóépületi modellajánlás." accuracy="Országprofil és tényleges használati adatok szerinti minősítés." verification="Helyiséghasználat, átvezető nyílások, elszívási mérleg és beszabályozás." />
    <Step number={1} title="Helyiség és használat">
      <HelpText>A rendszeresen bent tartózkodók számát add meg, ne a lakás maximális vendéglétszámát. A nappaliba és hálóba friss levegőt fújunk; a használt levegő a fürdő/WC felé áramlik és ott távozik.</HelpText>
      <Choices values={['living', 'bedroom'] as const} value={roomType} onChange={value => setRoomType(value as 'living' | 'bedroom')} labelOf={item => item === 'living' ? 'Nappali' : 'Hálószoba'} />
      <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>Normál, 2,70 m belmagasság</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kapcsold ki, ha más a belmagasság.</Text></View><Switch value={normalHeight} onValueChange={setNormalHeight} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Alapterület" value={area} onChange={setArea} suffix="m²" />{!normalHeight && <Field label="Belmagasság" value={height} onChange={setHeight} suffix="m" />}<Field label="Rendszeresen bent lévők" value={occupants} onChange={setOccupants} suffix="fő" /></View>
      {completeMode && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Előírt személyenkénti légmennyiség" value={personRate} onChange={setPersonRate} suffix="m³/h·fő" /><Field label="Előírt alapterület-arányos légmennyiség" value={areaRate} onChange={setAreaRate} suffix="m³/h·m²" /><TextField label="IAQ-kategória és forrás pontos hivatkozása" value={categorySource} onChange={setCategorySource} /></View>}
      {result && <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}><ResultLine label="Számított helyiségtérfogat" value={`${result.volumeM3.toFixed(1)} m³`} /><ResultLine label="Helyiségméret szerinti ajánlás" value={`${result.roomScheduleM3h.toFixed(0)} m³/h`} /><ResultLine label="Személyek szerinti ellenőrzés" value={`${result.personCheckM3h.toFixed(0)} m³/h`} /><ResultLine label="Javasolt frisslevegő-befúvás" value={`${result.recommendedM3h.toFixed(0)} m³/h`} color={GREEN} /><ResultLine label="Ez a térfogat mellett" value={`${result.resultingAirChangesPerHour.toFixed(2)} 1/h légcserének felel meg`} /><ResultLine label="Komfortos ágméret" value={`Ø ${recommendedDiameter(result.recommendedM3h, 'branch', 'comfort')} mm`} color={BLUE} /></View>}
      <Text style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>A belmagasság itt a térfogat- és légcsere-ellenőrzéshez kell. A frisslevegő-ajánlás elsődlegesen helyiségméret- és személyalapú, ezért a magasság önmagában nem módosítja automatikusan az ajánlott m³/h értéket.</Text>
      <Text style={{ color: freshMissing.length ? RED : freshQuality.assumedInputKeys.length ? YELLOW : GREEN, fontWeight: '800' }}>Adatkitöltöttség: {freshQuality.dataCompletenessPercent}%{freshMissing.length ? ` · Hiányzik: ${freshMissing.join(', ')}` : ''}</Text>
      {result && <CalculationReportButton buildRecord={() => ({ toolId: 'fresh-air', toolTitle: 'Lakóhelyiség frisslevegő-igénye', language, jurisdiction, method: { id: freshQuality.methodId, version: freshQuality.methodVersion, name: 'Személy- és alapterület-alapú frisslevegő-méretezés', formulaSummary: 'A választott IAQ-kategória személyenkénti és alapterület-arányos követelményének összevetése.' }, inputs: [{ key: 'roomType', label: 'Helyiségtípus', value: roomType, origin: 'measured' }, { key: 'area', label: 'Alapterület', value: n(area), unit: 'm²', origin: 'measured' }, { key: 'height', label: 'Belmagasság', value: effectiveRoomHeight, unit: 'm', origin: normalHeight ? 'selected-typical' : 'measured' }, { key: 'occupants', label: 'Rendszeresen bent lévők', value: n(occupants), unit: 'fő', origin: 'measured' }, { key: 'personRate', label: 'Személyenkénti érték', value: personRate || null, unit: 'm³/h·fő', origin: personRate ? 'measured' : 'missing' }, { key: 'areaRate', label: 'Alapterület-arányos érték', value: areaRate || null, unit: 'm³/h·m²', origin: areaRate ? 'measured' : 'missing' }], outputs: [{ key: 'recommendedFlow', label: 'Tervezési frisslevegő', value: Number(result.recommendedM3h.toFixed(1)), unit: 'm³/h', origin: 'calculated' }, { key: 'airChanges', label: 'Eredő légcsere', value: Number(result.resultingAirChangesPerHour.toFixed(2)), unit: '1/h', origin: 'calculated' }, { key: 'diameter', label: 'Komfortos ágméret', value: recommendedDiameter(result.recommendedM3h, 'branch', 'comfort'), unit: 'mm', origin: 'calculated' }], assumptions: freshQuality.assumedInputKeys, sources: freshQuality.sources, quality: freshQuality, complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`, requiredVerification: ['Teljes lakás befúvó–elszívó légmérlegének ellenőrzése', 'Átvezető nyílások méretezése', 'Helyszíni beszabályozás'] })} />}
    </Step>
    <View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 8 }}><ChevronRight size={19} color={BLUE} /><Text style={{ color: TEXT, lineHeight: 20, flex: 1 }}>A hálóba és nappaliba befújt levegőnek ajtórésen vagy átvezetőn keresztül el kell jutnia a fürdő/WC elszívásáig; ezt a teljes lakás légmérlegében külön ellenőrizni kell.</Text></View>
  </View>;
}

export function KitchenExhaustWizard() {
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [useType, setUseType] = useState<'residential' | 'commercial'>('residential');
  const [direction, setDirection] = useState<'size' | 'check'>('size');
  const [area, setArea] = useState('15');
  const [height, setHeight] = useState('2,7');
  const [normalHeight, setNormalHeight] = useState(true);
  const [knownFlow, setKnownFlow] = useState('350');
  const [ductDiameter, setDuctDiameter] = useState('150');
  const [operation, setOperation] = useState<'extract' | 'recirculating'>('extract');
  const [cooktop, setCooktop] = useState<'electric' | 'gas'>('electric');
  const [cooktopWidth, setCooktopWidth] = useState('60');
  const [hoodWidth, setHoodWidth] = useState('60');
  const [mountingHeight, setMountingHeight] = useState('55');
  const [hoodDepth, setHoodDepth] = useState('120');
  const [commercialDuty, setCommercialDuty] = useState<CommercialCookingDuty>('medium');
  const [makeUpPercent, setMakeUpPercent] = useState('90');
  const [filterType, setFilterType] = useState<'baffle' | 'cyclone' | 'mesh'>('baffle');
  const [filterArea, setFilterArea] = useState('0,5');
  const [filterLoss, setFilterLoss] = useState('80');
  const [equipmentList, setEquipmentList] = useState('');
  const [designSource, setDesignSource] = useState('');
  const [hoodManufacturer, setHoodManufacturer] = useState('');
  const [hoodModel, setHoodModel] = useState('');
  const [fanManufacturer, setKitchenFanManufacturer] = useState('');
  const [fanModel, setKitchenFanModel] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const effectiveHeight = normalHeight ? 2.7 : n(height);
  const volume = roomVolume(n(area), effectiveHeight);
  const hoodArea = n(hoodWidth) / 100 * n(hoodDepth) / 100;
  const residentialGuideFlow = airflowForAirChanges(volume, 10);
  const commercialGuideFlow = preliminaryCommercialHoodAirflow(hoodArea, commercialDuty);
  const calculatedFlow = useType === 'residential' ? residentialGuideFlow : commercialGuideFlow;
  const selectedFlow = direction === 'size' ? calculatedFlow : n(knownFlow);
  const achievedAirChanges = airChangesForAirflow(volume, selectedFlow);
  const balance = kitchenAirBalance(selectedFlow, n(makeUpPercent));
  const faceVelocity = filterFaceVelocity(selectedFlow, n(filterArea));
  const ductAirVelocity = ductVelocity(selectedFlow, n(ductDiameter));
  const generalMinimumHeight = cooktop === 'gas' ? 65 : 45;
  const residentialHeightOk = cooktop === 'gas'
    ? n(mountingHeight) >= generalMinimumHeight
    : n(mountingHeight) >= 45 && n(mountingHeight) <= 64;
  const hoodWidthOk = n(hoodWidth) >= n(cooktopWidth);
  const kitchenRequired = [
    ['area', area], ['height', String(effectiveHeight)], ['verifiedFlow', direction === 'check' ? knownFlow : ''], ['designSource', designSource], ['hoodManufacturer', hoodManufacturer], ['hoodModel', hoodModel], ['fanManufacturer', fanManufacturer], ['fanModel', fanModel], ['filterProduct', filterProduct], ['filterArea', filterArea], ['filterLoss', filterLoss], ['ductDiameter', ductDiameter],
    ...(useType === 'commercial' ? [['equipmentList', equipmentList] as const, ['makeUpPercent', makeUpPercent] as const] : [['cooktopWidth', cooktopWidth] as const, ['hoodWidth', hoodWidth] as const, ['mountingHeight', mountingHeight] as const]),
  ];
  const kitchenTextKeys = ['designSource', 'hoodManufacturer', 'hoodModel', 'fanManufacturer', 'fanModel', 'filterProduct', 'equipmentList'];
  const kitchenMissing = completeMode ? kitchenRequired.filter(([key, value]) => !String(value).trim() || (!kitchenTextKeys.includes(key) && n(String(value)) <= 0)).map(([key]) => key) : [];
  const kitchenQuality = classifyCalculationQuality({ mode: completeMode ? 'complete-inputs' : 'guided-estimate', methodId: useType === 'commercial' ? 'commercial-kitchen-air-balance' : 'residential-kitchen-extract', methodVersion: '2.0.0', requiredInputCount: kitchenRequired.length, suppliedRequiredInputCount: kitchenRequired.length - kitchenMissing.length, assumedInputKeys: completeMode ? [] : ['captureEfficiency', 'cookingDiversity', 'filterCurve'], missingRequiredInputKeys: kitchenMissing, sources: [{ kind: useType === 'commercial' ? 'standard' : 'manufacturer', title: designSource || (useType === 'commercial' ? 'EN 16282 sorozat – teljes módszeradat még szükséges' : 'Készülék gyártói telepítési útmutatója szükséges') }], verificationRequired: 'designer-review' });

  return <View style={{ gap: 14 }}>
    <HelpToggle />
    <CalculationModeSelector />
    <StandardsRegionNotice />
    <Choices values={['residential', 'commercial'] as const} value={useType} onChange={value => setUseType(value as 'residential' | 'commercial')} labelOf={item => item === 'residential' ? 'Lakossági konyha' : 'Ipari / nagykonyha'} />
    {useType === 'residential' ? <AccuracyNotice level="engineering-estimate" note="A helyiségtérfogat × 10 1/h Bosch gyártói kiválasztási útmutató szerinti előméretezés, nem magyar jogszabályi minimum és nem konkrét készülék gyári teljesítménygörbéje. A kiválasztott páraelszívó saját telepítési útmutatója elsőbbséget élvez." /> : <AccuracyNotice level="estimate" note="A nagykonyhai végleges méretezés alapja az MSZ EN 16282 sorozat és a konkrét ernyő/leválasztó gyártói adata. Az itt látható felület- és terhelésalapú érték csak Greenheck gyártói előméretezési irányérték; nem minősül MSZ EN 16282 szerinti számításnak." />}
    <CalculationEvidencePanel method={useType === 'residential' ? 'Térfogati légcsere és készülék/csatorna ellenőrzése.' : 'Ernyőfelület, főzési terhelés, befogási geometria, leválasztó és légpótlási mérleg.'} inputs={useType === 'residential' ? 'Konyhatérfogat, főzőlap, elszívó mérete és magassága, légmennyiség, cső és végpont.' : 'Berendezések hő- és páraterhelése, ernyőgeometria, magasság, leválasztó, elszívott és befújt levegő, csatornahálózat.'} assumptions="Ajánlásos módban tipikus használati és termékjellemzők; minden ilyen érték a jegyzőkönyvben szerepel." source={useType === 'residential' ? 'Készülék gyártói telepítési útmutatója és mérnöki előméretezés.' : 'EN 16282 sorozat és igazolt ernyő/leválasztó gyártói adatok.'} accuracy="A konkrét gyártói adatok és a teljes terhelési adatlap meglététől függ." verification="Helyszíni befogási próba, légmennyiség- és nyomásmérés, tűzvédelmi és helyi hatósági ellenőrzés." />

    <Step number={1} title={useType === 'residential' ? 'Konyha, főzőlap és elszívó' : 'Elszívóernyő és főzési terhelés'}>
      <Choices values={['size', 'check'] as const} value={direction} onChange={value => setDirection(value as 'size' | 'check')} labelOf={item => item === 'size' ? 'Az app becsülje a légmennyiséget' : 'Meglévő légmennyiséget ellenőrzök'} />
      {useType === 'residential' && <Choices values={['extract', 'recirculating'] as const} value={operation} onChange={value => setOperation(value as 'extract' | 'recirculating')} labelOf={item => item === 'extract' ? 'Kivezetés a szabadba' : 'Belső keringetés'} />}
      <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>Normál, 2,70 m belmagasság</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kapcsold ki, ha más a belmagasság.</Text></View><Switch value={normalHeight} onValueChange={setNormalHeight} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Konyha alapterülete" value={area} onChange={setArea} suffix="m²" />{!normalHeight && <Field label="Belmagasság" value={height} onChange={setHeight} suffix="m" />}</View>
      {completeMode && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><TextField label="Méretezési módszer/adatlap pontos forrása" value={designSource} onChange={setDesignSource} /><TextField label={useType === 'commercial' ? 'Elszívóernyő gyártója' : 'Páraelszívó gyártója'} value={hoodManufacturer} onChange={setHoodManufacturer} /><TextField label="Pontos típus / termékkód" value={hoodModel} onChange={setHoodModel} /><TextField label="Ventilátor gyártója" value={fanManufacturer} onChange={setKitchenFanManufacturer} /><TextField label="Ventilátor pontos típusa" value={fanModel} onChange={setKitchenFanModel} /></View>{useType === 'commercial' && <TextField label="Konyhai berendezések tételes listája, teljesítménye és energiafajtája" value={equipmentList} onChange={setEquipmentList} placeholder="minden sütő, főzőlap, rostlap, olajsütő…" />}</>}
      <ResultLine label="Számított konyhatérfogat" value={`${volume.toFixed(1)} m³`} />
      {useType === 'residential' ? <>
        <Choices values={['electric', 'gas'] as const} value={cooktop} onChange={value => setCooktop(value as 'electric' | 'gas')} labelOf={item => item === 'electric' ? 'Elektromos / indukciós' : 'Gáz főzőlap'} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Főzőlap szélessége" value={cooktopWidth} onChange={setCooktopWidth} suffix="cm" /><Field label="Elszívó szélessége" value={hoodWidth} onChange={setHoodWidth} suffix="cm" /><Field label="Főzőlaptól mért magasság" value={mountingHeight} onChange={setMountingHeight} suffix="cm" /></View>
        <Text style={{ color: hoodWidthOk ? GREEN : RED, lineHeight: 19, fontWeight: '800' }}>{hoodWidthOk ? 'Az elszívó legalább olyan széles, mint a főzőlap.' : 'Az elszívó keskenyebb a főzőlapnál; romolhat a befogás.'}</Text>
        <Text style={{ color: residentialHeightOk ? GREEN : YELLOW, lineHeight: 19, fontWeight: '800' }}>{residentialHeightOk ? 'A megadott magasság beleesik az általános Bosch útmutató tartományába.' : cooktop === 'gas' ? `Az általános útmutató gázfőzőlapnál legalább ${generalMinimumHeight} cm-t ad meg.` : 'Az általános útmutató elektromos főzőlapnál körülbelül 45–64 cm-t ad meg; túl nagy távolságnál romolhat a befogás.'} A konkrét elszívó és főzőlap kézikönyvének szigorúbb értéke kötelező.</Text>
        {operation === 'recirculating' && <Text style={{ color: YELLOW, lineHeight: 19, fontWeight: '800' }}>A belső keringetés nem távolít el levegőt a lakásból, ezért ez nem számítható külső elszívási légmennyiségnek.</Text>}
      </> : <>
        <Choices values={['light', 'medium', 'heavy'] as const} value={commercialDuty} onChange={value => setCommercialDuty(value as CommercialCookingDuty)} labelOf={item => item === 'light' ? 'Könnyű terhelés' : item === 'medium' ? 'Közepes terhelés' : 'Nagy terhelés'} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Ernyő szélessége" value={hoodWidth} onChange={setHoodWidth} suffix="cm" /><Field label="Ernyő mélysége" value={hoodDepth} onChange={setHoodDepth} suffix="cm" /><Field label="Munkasíktól mért magasság" value={mountingHeight} onChange={setMountingHeight} suffix="cm" /></View>
        <ResultLine label="Elszívóernyő felülete" value={`${hoodArea.toFixed(2)} m²`} />
        <Text style={{ color: YELLOW, lineHeight: 19 }}>A terhelési kategória és a felületi irányérték csak előméretezés. Az MSZ EN 16282 szerinti végleges légmennyiséghez a készüléksor hő- és szennyezőanyag-terhelése, az ernyő típusa, túlnyúlása és telepítési geometriája szükséges.</Text>
      </>}
      {direction === 'check' && <Field label="Meglévő / gyártói légmennyiség" value={knownFlow} onChange={setKnownFlow} suffix="m³/h" />}
      <View style={{ backgroundColor: SURFACE, borderRadius: 12, padding: 12 }}><ResultLine label={operation === 'recirculating' && useType === 'residential' ? 'Előméretezett keringtetett légmennyiség' : direction === 'size' ? 'Előméretezett elszívási légmennyiség' : 'Ellenőrzött légmennyiség'} value={`${selectedFlow.toFixed(0)} m³/h`} color={direction === 'size' ? YELLOW : BLUE} /><ResultLine label="A konyha térfogatára vetítve" value={`${achievedAirChanges.toFixed(1)} 1/h`} /></View>
    </Step>

    <Step number={2} title="Légpótlás, szűrő és légcsatorna">
      {useType === 'commercial' && <><Field label="Tervezett légpótlás aránya" value={makeUpPercent} onChange={setMakeUpPercent} suffix="%" /><ResultLine label="Közvetlenül befújt légpótlás" value={`${balance.supplyM3h.toFixed(0)} m³/h`} color={GREEN} /><ResultLine label="Szomszédos terekből szükséges átáramlás" value={`${balance.transferAirM3h.toFixed(0)} m³/h`} color={YELLOW} /><Text style={{ color: MUTED, lineHeight: 19 }}>A 90% kiinduló érték gyártói mérnöki ajánlás, nem minden konyhára kötelező arány. Az épület nyomásviszonyát, égési levegőt és a teljes légmérleget külön ellenőrizni kell.</Text></>}
      {useType === 'residential' && operation === 'extract' && <Text style={{ color: RED, lineHeight: 20, fontWeight: '800' }}>A kivezetett levegő pótlásáról gondoskodni kell. Nyílt égésterű készülék, kandalló vagy kémény esetén az elszívás veszélyes depressziót okozhat; külön égési-levegő- és kéménybiztonsági ellenőrzés szükséges.</Text>}
      <Choices values={['baffle', 'cyclone', 'mesh'] as const} value={filterType} onChange={value => setFilterType(value as 'baffle' | 'cyclone' | 'mesh')} labelOf={item => item === 'baffle' ? 'Lamellás zsírfogó' : item === 'cyclone' ? 'Ciklonos leválasztó' : 'Fémhálós szűrő'} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Aktív szűrőfelület" value={filterArea} onChange={setFilterArea} suffix="m²" /><Field label="Gyártói tiszta nyomásesés" value={filterLoss} onChange={setFilterLoss} suffix="Pa" /></View>
      {completeMode && <TextField label="Zsírfogó/leválasztó gyártója és termékkódja" value={filterProduct} onChange={setFilterProduct} />}
      <ResultLine label="Szűrő homloksebessége" value={`${faceVelocity.toFixed(2)} m/s`} />
      <ResultLine label="Alkalmazott tiszta szűrőveszteség" value={`${n(filterLoss).toFixed(0)} Pa`} color={BLUE} />
      <Field label="Elszívócső belső átmérője" value={ductDiameter} onChange={setDuctDiameter} suffix="mm" />
      <ResultLine label="Elszívócső légsebessége" value={`${ductAirVelocity.toFixed(2)} m/s`} color={classifyVelocity(ductAirVelocity, 'main') === 'comfort' ? GREEN : classifyVelocity(ductAirVelocity, 'main') === 'office' ? YELLOW : RED} />
      <Text style={{ color: MUTED, lineHeight: 19 }}>A szűrő nyomásesését nem becsüljük típusnévből: a konkrét termék gyártói görbéjének, méretének és az aktuális légmennyiségnek megfelelő Pa-értéket kell megadni. Később ellenőrzött termékkódok választhatók lesznek.</Text>
      <Text style={{ color: kitchenMissing.length ? RED : kitchenQuality.assumedInputKeys.length ? YELLOW : GREEN, fontWeight: '800', lineHeight: 19 }}>Adatkitöltöttség: {kitchenQuality.dataCompletenessPercent}%{kitchenMissing.length ? ` · Hiányzik: ${kitchenMissing.join(', ')}` : ''}</Text>
      <CalculationReportButton buildRecord={() => ({ toolId: 'kitchen-exhaust', toolTitle: useType === 'commercial' ? 'Ipari / nagykonyhai elszívás' : 'Lakossági konyhai elszívás', language, jurisdiction, method: { id: kitchenQuality.methodId, version: kitchenQuality.methodVersion, name: useType === 'commercial' ? 'Ernyő, terhelés és légpótlási mérleg' : 'Páraelszívó és csatorna ellenőrzése', formulaSummary: useType === 'commercial' ? 'Igazolt tervezési légmennyiség, ernyőgeometria, légpótlási mérleg, szűrőfelületi és csatornasebesség.' : 'Igazolt gyártói légmennyiség, szerelési geometria, szűrő- és csatornaellenőrzés.' }, inputs: [{ key: 'area', label: 'Konyha alapterülete', value: n(area), unit: 'm²', origin: 'measured' }, { key: 'height', label: 'Belmagasság', value: effectiveHeight, unit: 'm', origin: normalHeight ? 'selected-typical' : 'measured' }, { key: 'designFlow', label: 'Igazolt tervezési légmennyiség', value: direction === 'check' ? n(knownFlow) : null, unit: 'm³/h', origin: direction === 'check' ? 'manufacturer' : 'missing' }, { key: 'designSource', label: 'Méretezési forrás', value: designSource || null, origin: designSource ? 'manufacturer' : 'missing' }, { key: 'hood', label: 'Elszívó/ernyő', value: `${hoodManufacturer} ${hoodModel}`.trim() || null, origin: hoodModel ? 'manufacturer' : 'missing' }, { key: 'fan', label: 'Ventilátor', value: `${fanManufacturer} ${fanModel}`.trim() || null, origin: fanModel ? 'manufacturer' : 'missing' }, { key: 'filter', label: 'Zsírfogó/leválasztó', value: filterProduct || null, origin: filterProduct ? 'manufacturer' : 'missing' }, { key: 'filterLoss', label: 'Tiszta szűrőveszteség', value: n(filterLoss), unit: 'Pa', origin: filterProduct ? 'manufacturer' : 'selected-typical' }, { key: 'ductDiameter', label: 'Elszívócső belső átmérője', value: n(ductDiameter), unit: 'mm', origin: 'measured' }], outputs: [{ key: 'selectedFlow', label: 'Alkalmazott elszívási légmennyiség', value: Number(selectedFlow.toFixed(1)), unit: 'm³/h', origin: 'calculated' }, { key: 'airChanges', label: 'Térfogati légcsere', value: Number(achievedAirChanges.toFixed(2)), unit: '1/h', origin: 'calculated' }, { key: 'filterVelocity', label: 'Szűrő homloksebessége', value: Number(faceVelocity.toFixed(2)), unit: 'm/s', origin: 'calculated' }, { key: 'ductVelocity', label: 'Csatorna légsebessége', value: Number(ductAirVelocity.toFixed(2)), unit: 'm/s', origin: 'calculated' }, ...(useType === 'commercial' ? [{ key: 'makeUpAir', label: 'Közvetlen légpótlás', value: Number(balance.supplyM3h.toFixed(1)), unit: 'm³/h', origin: 'calculated' as const }] : [])], assumptions: kitchenQuality.assumedInputKeys, sources: kitchenQuality.sources, quality: kitchenQuality, complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`, requiredVerification: useType === 'commercial' ? ['EN 16282 szerinti jogosult tervezői felülvizsgálat', 'Tűzvédelmi ellenőrzés', 'Helyszíni befogási, légmennyiség- és nyomásmérés'] : ['Mindkét készülék gyártói szerelési előírásának ellenőrzése', 'Égési levegő és depresszió ellenőrzése', 'Helyszíni légmennyiség- és zajmérés'] })} />
    </Step>

    {operation === 'extract' || useType === 'commercial' ? <Step number={3} title="Az elszívási légút részletes nyomásvesztesége">
      <HelpText>Építsd fel a ventilátortól vagy ernyőtől a kültéri kidobásig tartó mértékadó légutat. A megadott zsírfogó gyártói Pa-értékét külön készülékveszteségként add hozzá; a ventilátor munkapontjához a teljes légút vesztesége kell.</HelpText>
      <PressurePathBuilder externalAirflow={String(selectedFlow)} downstreamAirflow={String(selectedFlow)} />
    </Step> : null}

    <Step number={4} title="Szerelési és biztonsági ellenőrzés">
      <HelpText>Az elszívó legyen a főzőfelület fölött középre igazítva, lehetőleg legalább olyan széles, mint a főzőlap. A pontos minimális szerelési magasságot mindig az elszívó és a főzőberendezés gyártói előírásai közül a szigorúbb határozza meg.</HelpText>
      <Text style={{ color: MUTED, lineHeight: 19 }}>A légcsatorna legyen a gyártó által engedett lehető legnagyobb átmérőjű, rövid és kevés iránytörésű. Nagykonyhánál hozzáférhető tisztítás, zsírálló kivitel, tűzvédelmi leválasztás és az MSZ EN 16282 vonatkozó részeinek ellenőrzése szükséges.</Text>
    </Step>
  </View>;
}
