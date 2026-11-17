import React, { useMemo, useState } from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AccuracyNotice } from '@/components/AccuracyNotice';
import { useSavedRooms } from '@/contexts/SavedRoomsContext';
import { classifyCalculationQuality, type CalculationQuality } from '@/domain/calculationQuality';
import { useEngineeringSettings } from '@/contexts/EngineeringSettingsContext';
import { jurisdictionName, jurisdictionStatusLabel, jurisdictionStatus } from '@/domain/engineeringStandards';
import { psychrometricState } from '@/domain/psychrometrics';
import { CalculationReportButton } from '@/components/CalculationReportButton';
import { baseWallU, wallUWithExternalInsulation, type PanelSystem, type WallConstruction } from '@/domain/buildingEnvelope';

const CARD = '#161A1F', SURFACE = '#1C2128', BORDER = '#2A2F38', TEXT = '#E8ECF0', MUTED = '#98A3AF', BLUE = '#1E90FF', GREEN = '#22C55E';
type WindowFrame = 'oldSingle' | 'oldDouble' | 'plastic' | 'wood';
type Glazing = 'single' | 'double' | 'triple';
type FloorPosition = 'ground' | 'middle' | 'top';
type Roof = 'heatedAbove' | 'attic' | 'flat';
type Orientation = 'north' | 'east' | 'south' | 'west';
type Shading = 'none' | 'inside' | 'outside';

function num(value: string, fallback = 0) { const parsed = Number(value.trim().replace(',', '.')); return Number.isFinite(parsed) ? parsed : fallback; }
function uWithInsulation(baseU: number, insulationCm: number) { return wallUWithExternalInsulation(baseU, insulationCm) ?? Number.NaN; }
function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix: string }) { return <View style={{ flex: 1, minWidth: 130 }}><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>{label}</Text><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 11, backgroundColor: SURFACE }}><TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={{ color: TEXT, fontSize: 16, padding: 12, flex: 1 }} /><Text style={{ color: MUTED, marginRight: 10 }}>{suffix}</Text></View></View>; }
function Choice<T extends string | number>({ label, values, value, labels, onChange }: { label: string; values: readonly T[]; value: T; labels: Record<string, string>; onChange: (v: T) => void }) { return <View style={{ gap: 6 }}><Text style={{ color: MUTED, fontSize: 13 }}>{label}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{values.map(item => { const active = item === value; return <TouchableOpacity key={String(item)} onPress={() => onChange(item)} style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: active ? BLUE : BORDER, backgroundColor: active ? `${BLUE}28` : SURFACE }}><Text style={{ color: active ? '#fff' : MUTED, fontWeight: '700' }}>{labels[String(item)] ?? String(item)}</Text></TouchableOpacity>; })}</View></View>; }
function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 5 }}><Text style={{ color: MUTED, flex: 1 }}>{label}</Text><Text style={{ color: strong ? BLUE : TEXT, fontWeight: strong ? '900' : '700', fontSize: strong ? 18 : 14 }}>{value}</Text></View>; }

export function HeatLoadWizard() {
  const { saveRoom } = useSavedRooms();
  const { calculationMode, language, jurisdiction } = useEngineeringSettings();
  const completeMode = calculationMode === 'complete-engineering';
  const [roomName, setRoomName] = useState('Nappali');
  const [savedMessage, setSavedMessage] = useState('');
  const [area, setArea] = useState('25');
  const [height, setHeight] = useState('2,7');
  const [normalHeight, setNormalHeight] = useState(true);
  const [externalWalls, setExternalWalls] = useState(2);
  const [wall, setWall] = useState<WallConstruction>('brick');
  const [panelSystem, setPanelSystem] = useState<PanelSystem>('unknown');
  const [insulation, setInsulation] = useState(10);
  const [windowArea, setWindowArea] = useState('4');
  const [windowFrame, setWindowFrame] = useState<WindowFrame>('plastic');
  const [glazing, setGlazing] = useState<Glazing>('double');
  const [floorPosition, setFloorPosition] = useState<FloorPosition>('middle');
  const [roof, setRoof] = useState<Roof>('heatedAbove');
  const [orientation, setOrientation] = useState<Orientation>('south');
  const [shading, setShading] = useState<Shading>('inside');
  const [occupants, setOccupants] = useState('2');
  const [equipment, setEquipment] = useState('200');
  const [insideTemp, setInsideTemp] = useState('24');
  const [outsideTemp, setOutsideTemp] = useState('35');
  const [exactWallArea, setExactWallArea] = useState('');
  const [exactWallU, setExactWallU] = useState('');
  const [exactWindowU, setExactWindowU] = useState('');
  const [exactFloorArea, setExactFloorArea] = useState('0');
  const [exactFloorU, setExactFloorU] = useState('0');
  const [exactRoofArea, setExactRoofArea] = useState('0');
  const [exactRoofU, setExactRoofU] = useState('0');
  const [designSolar, setDesignSolar] = useState('');
  const [totalSolarFactor, setTotalSolarFactor] = useState('');
  const [airflow, setAirflow] = useState('');
  const [insideRh, setInsideRh] = useState('50');
  const [outsideRh, setOutsideRh] = useState('');
  const [personSensible, setPersonSensible] = useState('75');
  const [personLatent, setPersonLatent] = useState('55');
  const [lighting, setLighting] = useState('');

  const result = useMemo(() => {
    const a = num(area), h = normalHeight ? 2.7 : num(height), windows = num(windowArea), people = num(occupants), devices = num(equipment), inside = num(insideTemp), outside = num(outsideTemp);
    if (a <= 0 || h <= 0 || windows < 0 || inside >= outside) return null;
    const deltaT = outside - inside;
    const wallU = completeMode ? num(exactWallU, Number.NaN) : uWithInsulation(baseWallU(wall, panelSystem), insulation);
    const glazingU: Record<Glazing, number> = { single: 5.2, double: 1.3, triple: 0.8 };
    const oldWindowU: Record<'oldSingle' | 'oldDouble', number> = { oldSingle: 4.8, oldDouble: 2.6 };
    const windowU = completeMode ? num(exactWindowU, Number.NaN) : (windowFrame === 'oldSingle' || windowFrame === 'oldDouble' ? oldWindowU[windowFrame] : glazingU[glazing]);
    const side = Math.sqrt(a);
    const grossWallArea = side * h * externalWalls;
    const netWallArea = completeMode ? num(exactWallArea, Number.NaN) : Math.max(0, grossWallArea - windows);
    const floorArea = completeMode ? num(exactFloorArea) : a;
    const roofArea = completeMode ? num(exactRoofArea) : a;
    const floorU = completeMode ? num(exactFloorU, Number.NaN) : (floorPosition === 'ground' ? uWithInsulation(0.7, insulation) : 0);
    const roofBase = roof === 'heatedAbove' ? 0 : roof === 'attic' ? 1.0 : 1.2;
    const roofU = completeMode ? num(exactRoofU, Number.NaN) : (floorPosition === 'top' && roofBase > 0 ? uWithInsulation(roofBase, insulation) : 0);
    const transmissionW = (netWallArea * wallU + windows * windowU + floorArea * floorU + roofArea * roofU) * deltaT;
    const infiltrationAch = windowFrame === 'oldSingle' ? 1.2 : windowFrame === 'oldDouble' ? 0.8 : 0.45;
    const indoorState = completeMode ? psychrometricState(inside, num(insideRh), 101325) : null;
    const outdoorState = completeMode ? psychrometricState(outside, num(outsideRh), 101325) : null;
    const volumeFlowM3s = num(airflow) / 3600;
    const dryAirKgS = outdoorState && volumeFlowM3s > 0 ? volumeFlowM3s / outdoorState.specificVolumeM3Kg : 0;
    const airW = completeMode && indoorState && outdoorState
      ? Math.max(0, dryAirKgS * (outdoorState.enthalpyKjKg - indoorState.enthalpyKjKg) * 1000)
      : 0.33 * infiltrationAch * a * h * deltaT;
    const solarBase: Record<Orientation, number> = { north: 90, east: 220, south: 190, west: 280 };
    const shadeFactor: Record<Shading, number> = { none: 1, inside: 0.75, outside: 0.35 };
    const glassFactor = glazing === 'single' ? 0.85 : glazing === 'double' ? 0.65 : 0.5;
    const solarW = completeMode ? windows * num(designSolar) * num(totalSolarFactor) : windows * solarBase[orientation] * shadeFactor[shading] * glassFactor;
    const internalW = completeMode ? people * (num(personSensible) + num(personLatent)) + devices + num(lighting) : people * 120 + devices + a * 8;
    const totalW = completeMode ? transmissionW + airW + solarW + internalW : (transmissionW + airW + solarW + internalW) * 1.1;
    if (![wallU, windowU, netWallArea, floorU, roofU, transmissionW, airW, solarW, internalW, totalW].every(Number.isFinite)) return null;
    return { wallU, windowU, transmissionW, airW, solarW, internalW, totalW };
  }, [airflow, area, completeMode, designSolar, equipment, exactFloorArea, exactFloorU, exactRoofArea, exactRoofU, exactWallArea, exactWallU, exactWindowU, externalWalls, floorPosition, glazing, height, insideRh, insideTemp, insulation, lighting, normalHeight, occupants, orientation, outsideRh, outsideTemp, panelSystem, personLatent, personSensible, roof, shading, totalSolarFactor, wall, windowArea, windowFrame]);

  const completeRequired = [
    ['geometry.netWallArea', exactWallArea], ['construction.wallU', exactWallU], ['construction.windowU', exactWindowU],
    ['solar.designIrradiance', designSolar], ['solar.totalFactor', totalSolarFactor], ['air.outdoorFlow', airflow],
    ['air.outdoorRh', outsideRh], ['air.indoorRh', insideRh], ['internal.lighting', lighting],
  ] as const;
  const missingComplete = completeMode ? completeRequired.filter(([, value]) => !value.trim()).map(([key]) => key) : [];
  const quality: CalculationQuality = classifyCalculationQuality({
    mode: completeMode ? 'complete-inputs' : 'guided-estimate',
    methodId: completeMode ? 'room-design-point-heat-balance' : 'room-cooling-load-guided', methodVersion: '2.0.0',
    requiredInputCount: completeMode ? completeRequired.length : 12,
    suppliedRequiredInputCount: completeMode ? completeRequired.length - missingComplete.length : 12,
    assumedInputKeys: completeMode ? [] : ['construction.uValues', 'airLeakage', 'solarGainProfile', 'internalGainsProfile'],
    missingRequiredInputKeys: missingComplete,
    sources: [{ kind: 'engineering-reference', title: completeMode ? 'Tervezési ponti érzékelhető és látens hőegyensúly; ASHRAE pszichrometriai összefüggések' : wall === 'panel' || wall === 'solidConcrete25' ? 'Tételes mérnöki előméretezési modell; ÉMI panelvizsgálati adatok és közölt vasbeton rétegrendi U-érték' : 'Tételes mérnöki előméretezési modell' }],
    verificationRequired: 'designer-review',
  });

  return <View style={{ gap: 14 }}>
    <View style={{ backgroundColor: '#3A2507', borderColor: '#F59E0B', borderWidth: 2, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: '#FBBF24', fontSize: 20, fontWeight: '900' }}>{completeMode ? 'MINDEN ADAT ISMERT' : 'AJÁNLÁS ISMERT ADATOKBÓL'}</Text>
      <Text style={{ color: '#FDE68A', fontSize: 14, lineHeight: 20, marginTop: 6 }}>{completeMode ? 'Konkrét felületek, U-értékek, légállapotok és belső terhelések alapján készülő tervezési ponti hőegyensúly. A hiányzó kötelező adat visszaminősíti az eredményt.' : 'A közérthető szerkezettípusokhoz az alkalmazás tipikus anyagjellemzőket rendel. Ez előméretezés, nem teljes tervezői hűtési vagy fűtési hőterhelés-számítás.'}</Text>
    </View>
    <AccuracyNotice level={quality.level} note={completeMode ? `Adatkitöltöttség: ${quality.dataCompletenessPercent}%. ${missingComplete.length ? `Hiányzik: ${missingComplete.join(', ')}.` : 'A szükséges részletes mezők ki vannak töltve.'}` : 'A szerkezeti hőátadás, légcsere, napsugárzás és belső terhelés külön számolódik, de az U-érték, légzárás és napsugárzási profil részben feltételezett.'} />
    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>1. Helyiség</Text>
      <View><Text style={{ color: MUTED, fontSize: 13, marginBottom: 5 }}>Helyiség neve – ezzel mentjük el</Text><TextInput value={roomName} onChangeText={setRoomName} placeholder="pl. Nappali" placeholderTextColor="#66717E" style={{ color: TEXT, fontSize: 16, padding: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 11, backgroundColor: SURFACE }} /></View>
      <View style={{ backgroundColor: '#101820', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '800' }}>Normál, 2,70 m belmagasság</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Kapcsold ki, ha más a belmagasság.</Text></View><Switch value={normalHeight} onValueChange={setNormalHeight} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Alapterület" value={area} onChange={setArea} suffix="m²" />{!normalHeight && <Field label="Belmagasság" value={height} onChange={setHeight} suffix="m" />}</View>
      <Line label="Számított helyiségtérfogat" value={`${(num(area) * (normalHeight ? 2.7 : num(height))).toFixed(1)} m³`} />
      {!completeMode && <Choice label="Külső falak száma" values={[1, 2, 3, 4] as const} value={externalWalls} labels={{}} onChange={value => setExternalWalls(Number(value))} />}
      <Choice label="Tájolás" values={['north', 'east', 'south', 'west'] as const} value={orientation} labels={{ north: 'Észak', east: 'Kelet', south: 'Dél', west: 'Nyugat' }} onChange={value => setOrientation(value as Orientation)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Belső tervezési hőmérséklet" value={insideTemp} onChange={setInsideTemp} suffix="°C" /><Field label="Külső tervezési hőmérséklet" value={outsideTemp} onChange={setOutsideTemp} suffix="°C" /></View>
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>2. Fal, szigetelés és födém</Text>
      {completeMode ? <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Nettó külső falfelület" value={exactWallArea} onChange={setExactWallArea} suffix="m²" /><Field label="Fal igazolt U-értéke" value={exactWallU} onChange={setExactWallU} suffix="W/m²K" /></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Külső padlófelület" value={exactFloorArea} onChange={setExactFloorArea} suffix="m²" /><Field label="Padló U-értéke" value={exactFloorU} onChange={setExactFloorU} suffix="W/m²K" /></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Külső tető/födém felülete" value={exactRoofArea} onChange={setExactRoofArea} suffix="m²" /><Field label="Tető/födém U-értéke" value={exactRoofU} onChange={setExactRoofU} suffix="W/m²K" /></View></> : <>
      <Choice label="Falazat" values={['oldBrick', 'brick', 'modernBrick', 'panel', 'solidConcrete25', 'light'] as const} value={wall} labels={{ oldBrick: 'Régi tömör tégla', brick: 'Hagyományos tégla', modernBrick: 'Modern kerámia tégla', panel: 'Panelépület külső fala', solidConcrete25: 'Tömör vasbeton fal', light: 'Könnyűszerkezet' }} onChange={value => setWall(value as WallConstruction)} />
      {wall === 'panel' && <><Choice label="Panelrendszer / házgyár" values={['unknown', 'pecs', 'gyorMiskolc', 'larsenNielsen'] as const} value={panelSystem} labels={{ unknown: 'Nem tudom – óvatos becslés', pecs: 'Pécsi házgyári rendszer', gyorMiskolc: 'Győr–Miskolc rendszer', larsenNielsen: 'Larsen–Nielsen rendszer' }} onChange={value => setPanelSystem(value as PanelSystem)} /><Text style={{ color: '#FBBF24', fontSize: 13, lineHeight: 19 }}>A panel külső fala általában vasbeton szendvicspanel. A dokumentált magyar rendszerek U-értéke jelentősen eltér; ismeretlen típusnál az app a kedvezőtlenebb, 1,96 W/m²K értékkel számol, ezért az eredmény becslés.</Text></>}
      {wall === 'solidConcrete25' && <Text style={{ color: '#FBBF24', fontSize: 13, lineHeight: 19 }}>Ez az opció 25 cm tömör vasbeton falból indul ki (U ≈ 3,02 W/m²K). Panelépület külső szendvicsfalához a „Panelépület külső fala” lehetőséget válaszd.</Text>}
      <Choice label="Külső hőszigetelés vastagsága" values={[0, 7, 10, 15, 20, 25] as const} value={insulation} labels={{ 0: 'Nincs', 7: '7 cm', 10: '10 cm', 15: '15 cm', 20: '20 cm', 25: '20 cm felett' }} onChange={value => setInsulation(Number(value))} />
      <Choice label="A helyiség helye" values={['ground', 'middle', 'top'] as const} value={floorPosition} labels={{ ground: 'Földszint / talaj felett', middle: 'Közbenső szint', top: 'Legfelső szint' }} onChange={value => setFloorPosition(value as FloorPosition)} />
      {floorPosition === 'top' && <Choice label="Mi van fölötte?" values={['heatedAbove', 'attic', 'flat'] as const} value={roof} labels={{ heatedAbove: 'Fűtött tér', attic: 'Padlás / magastető', flat: 'Lapostető' }} onChange={value => setRoof(value as Roof)} />}</>}
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>3. Ablakok</Text>
      <Field label="Összes ablakfelület" value={windowArea} onChange={setWindowArea} suffix="m²" />
      {completeMode ? <><Field label="Ablak igazolt Uw/U-értéke" value={exactWindowU} onChange={setExactWindowU} suffix="W/m²K" /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Méretezési napsugárzás" value={designSolar} onChange={setDesignSolar} suffix="W/m²" /><Field label="Teljes g×árnyékolási tényező" value={totalSolarFactor} onChange={setTotalSolarFactor} suffix="–" /></View></> : <>
      <Choice label="Ablakszerkezet" values={['oldSingle', 'oldDouble', 'plastic', 'wood'] as const} value={windowFrame} labels={{ oldSingle: 'Régi faablak – egy ablaksík, egyszeres üveg', oldDouble: 'Régi kapcsolt gerébtokos – két külön ablaksík', plastic: 'Új műanyag ablak', wood: 'Új faablak' }} onChange={value => setWindowFrame(value as WindowFrame)} />
      {(windowFrame === 'plastic' || windowFrame === 'wood') && <Choice label="Üvegezés" values={['single', 'double', 'triple'] as const} value={glazing} labels={{ single: '1 rétegű', double: '2 rétegű hőszigetelő', triple: '3 rétegű hőszigetelő' }} onChange={value => setGlazing(value as Glazing)} />}
      <Choice label="Árnyékolás" values={['none', 'inside', 'outside'] as const} value={shading} labels={{ none: 'Nincs', inside: 'Belső függöny / reluxa', outside: 'Külső redőny / zsaluzia' }} onChange={value => setShading(value as Shading)} /></>}
    </View>

    <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }}>
      <Text style={{ color: TEXT, fontSize: 18, fontWeight: '900' }}>4. Belső terhelések</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Jellemző létszám" value={occupants} onChange={setOccupants} suffix="fő" /><Field label="Gépek, TV, számítógép" value={equipment} onChange={setEquipment} suffix="W" />{completeMode && <Field label="Világítás" value={lighting} onChange={setLighting} suffix="W" />}</View>
      {completeMode && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Személy érzékelhető hője" value={personSensible} onChange={setPersonSensible} suffix="W/fő" /><Field label="Személy látens hője" value={personLatent} onChange={setPersonLatent} suffix="W/fő" /></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}><Field label="Külső/friss levegő és beszivárgás" value={airflow} onChange={setAirflow} suffix="m³/h" /><Field label="Belső relatív páratartalom" value={insideRh} onChange={setInsideRh} suffix="%" /><Field label="Külső relatív páratartalom" value={outsideRh} onChange={setOutsideRh} suffix="%" /></View></>}
    </View>

    <View style={{ backgroundColor: '#101820', borderColor: BLUE, borderWidth: 1, borderRadius: 16, padding: 16 }}>
      <Text style={{ color: TEXT, fontSize: 20, fontWeight: '900', marginBottom: 8 }}>Eredmény és számítási bontás</Text>
      {!result ? <Text style={{ color: '#EF4444' }}>Ellenőrizd a megadott adatokat és a kötelező mezőket.</Text> : <><Line label="Fal alkalmazott U-értéke" value={`${result.wallU.toFixed(2)} W/m²K`} /><Line label="Ablak alkalmazott U-értéke" value={`${result.windowU.toFixed(2)} W/m²K`} /><Line label="Szerkezeti hőterhelés" value={`${Math.round(result.transmissionW)} W`} /><Line label="Légállapot / légcsere terhelése" value={`${Math.round(result.airW)} W`} /><Line label="Ablak napsugárzási terhelése" value={`${Math.round(result.solarW)} W`} /><Line label="Személyek, gépek és világítás" value={`${Math.round(result.internalW)} W`} /><Line label={completeMode ? 'Tervezési ponti hűtési igény' : 'Ajánlott előméretezési hűtési igény'} value={`${(result.totalW / 1000).toFixed(2)} kW`} strong /><TouchableOpacity onPress={() => { saveRoom({ name: roomName, areaM2: num(area), heightM: normalHeight ? 2.7 : num(height), coolingLoadKw: result.totalW / 1000, quality }); setSavedMessage(`${roomName.trim()} elmentve a légoldali tervezéshez – ${quality.dataCompletenessPercent}% adatkitöltöttséggel.`); }} disabled={!roomName.trim()} style={{ backgroundColor: roomName.trim() ? BLUE : '#374151', padding: 13, borderRadius: 11, marginTop: 12 }}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: '900' }}>Helyiség hűtési igényének mentése</Text></TouchableOpacity>
      <CalculationReportButton buildRecord={() => ({ toolId: 'split-sizing', toolTitle: 'Helyiség hűtési hőterhelése', language, jurisdiction, method: { id: quality.methodId, version: quality.methodVersion, name: completeMode ? 'Tervezési ponti hőegyensúly' : 'Választómezős tételes előméretezés', formulaSummary: 'Transzmissziós + légállapot/légcsere + napsugárzási + belső hőterhelés.' }, inputs: [{ key: 'area', label: 'Alapterület', value: num(area), unit: 'm²', origin: 'measured' }, { key: 'height', label: 'Belmagasság', value: normalHeight ? 2.7 : num(height), unit: 'm', origin: normalHeight ? 'selected-typical' : 'measured' }, { key: 'wallType', label: 'Falazat típusa', value: completeMode ? 'Igazolt U-érték' : wall, origin: completeMode ? 'measured' : 'selected-typical' }, ...(!completeMode && wall === 'panel' ? [{ key: 'panelSystem', label: 'Panelrendszer', value: panelSystem, origin: panelSystem === 'unknown' ? 'assumed' as const : 'selected-typical' as const }] : []), ...(!completeMode ? [{ key: 'externalInsulation', label: 'Külső hőszigetelés', value: insulation, unit: 'cm', origin: 'selected-typical' as const }, { key: 'appliedWallU', label: 'Alkalmazott fal U-érték', value: Number(result.wallU.toFixed(3)), unit: 'W/m²K', origin: 'calculated' as const }] : []), { key: 'windowArea', label: 'Ablakfelület', value: num(windowArea), unit: 'm²', origin: 'measured' }, ...completeRequired.map(([key, value]) => ({ key, label: key, value: value.trim() || null, origin: value.trim() ? 'measured' as const : 'missing' as const }))], outputs: [{ key: 'coolingLoad', label: 'Hűtési igény', value: Number((result.totalW / 1000).toFixed(3)), unit: 'kW', origin: 'calculated' }], assumptions: quality.assumedInputKeys, sources: quality.sources, quality, complianceState: `${jurisdictionName(jurisdiction)} · ${jurisdictionStatusLabel(jurisdictionStatus(jurisdiction))}`, requiredVerification: ['Helyszíni adategyeztetés', 'Készülék gyártói teljesítménytáblájának ellenőrzése', 'Szükség esetén jogosult szakági tervező felülvizsgálata'] })} />{savedMessage ? <Text style={{ color: GREEN, textAlign: 'center', marginTop: 8, fontWeight: '800' }}>{savedMessage}</Text> : null}</>}
    </View>
  </View>;
}
