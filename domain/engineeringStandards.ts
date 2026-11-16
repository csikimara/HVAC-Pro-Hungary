export const APP_LANGUAGES = [
  { code: 'hu', label: 'Magyar' },
  { code: 'ro', label: 'Română' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'hr', label: 'Hrvatski' },
] as const;

export type AppLanguage = typeof APP_LANGUAGES[number]['code'];
export type CalculationMode = 'complete-engineering' | 'guided-recommendation';
export type JurisdictionStatus = 'national-review-required' | 'verification-in-progress' | 'verified';

export const EUROPEAN_JURISDICTIONS = [
  ['AL', 'Albánia'], ['AT', 'Ausztria'], ['BE', 'Belgium'], ['BA', 'Bosznia-Hercegovina'],
  ['BG', 'Bulgária'], ['HR', 'Horvátország'], ['CY', 'Ciprus'], ['CZ', 'Csehország'],
  ['DK', 'Dánia'], ['EE', 'Észtország'], ['FI', 'Finnország'], ['FR', 'Franciaország'],
  ['DE', 'Németország'], ['GR', 'Görögország'], ['HU', 'Magyarország'], ['IS', 'Izland'],
  ['IE', 'Írország'], ['IT', 'Olaszország'], ['XK', 'Koszovó'], ['LV', 'Lettország'],
  ['LI', 'Liechtenstein'], ['LT', 'Litvánia'], ['LU', 'Luxemburg'], ['MT', 'Málta'],
  ['MD', 'Moldova'], ['ME', 'Montenegró'], ['NL', 'Hollandia'], ['MK', 'Észak-Macedónia'],
  ['NO', 'Norvégia'], ['PL', 'Lengyelország'], ['PT', 'Portugália'], ['RO', 'Románia'],
  ['RS', 'Szerbia'], ['SK', 'Szlovákia'], ['SI', 'Szlovénia'], ['ES', 'Spanyolország'],
  ['SE', 'Svédország'], ['CH', 'Svájc'], ['TR', 'Törökország'], ['UA', 'Ukrajna'],
  ['GB', 'Egyesült Királyság'],
] as const;

export type JurisdictionCode = typeof EUROPEAN_JURISDICTIONS[number][0];

export type StandardDomain = 'cooling-load' | 'heating-load' | 'ventilation' | 'ductwork' | 'commercial-kitchen' | 'refrigeration-safety' | 'commissioning';

export type StandardReference = {
  id: string;
  domain: StandardDomain;
  title: string;
  role: string;
  licensedMethodRequired: boolean;
};

export const EUROPEAN_CORE_STANDARDS: StandardReference[] = [
  { id: 'EN ISO 52016-1', domain: 'cooling-load', title: 'Épületek energiaigénye, belső hőmérséklete és hőterhelése', role: 'Órás vagy havi hűtési/fűtési és látens terhelési számítás', licensedMethodRequired: true },
  { id: 'EN 12831-1', domain: 'heating-load', title: 'Méretezési fűtési hőterhelés', role: 'Helyiségek és épületek fűtési hőszükséglete', licensedMethodRequired: true },
  { id: 'EN 16798-1', domain: 'ventilation', title: 'Beltéri környezeti bemeneti paraméterek', role: 'Beltéri levegőminőség és tervezési kategóriák', licensedMethodRequired: true },
  { id: 'EN 16798-3', domain: 'ventilation', title: 'Nem lakóépületek szellőzőrendszerei', role: 'Légtechnikai rendszerek teljesítménykövetelményei', licensedMethodRequired: true },
  { id: 'EN 12237 / EN 1507', domain: 'ductwork', title: 'Kör és négyszögletes légcsatornák szilárdsága és tömörsége', role: 'Szivárgási és kivitelezési osztályok', licensedMethodRequired: true },
  { id: 'EN 12599', domain: 'commissioning', title: 'Beépített szellőző- és klímarendszerek átvételi vizsgálata', role: 'Mérés, ellenőrzés és beszabályozás', licensedMethodRequired: true },
  { id: 'EN 16282-1…8', domain: 'commercial-kitchen', title: 'Nagykonyhai szellőzés elemei', role: 'Légmennyiség, ernyő, légpótlás, csatorna, leválasztó és biztonság', licensedMethodRequired: true },
  { id: 'EN 378-1…4', domain: 'refrigeration-safety', title: 'Hűtőrendszerek és hőszivattyúk biztonsági és környezetvédelmi követelményei', role: 'Biztonsági besorolás, töltet és telepítési követelmények', licensedMethodRequired: true },
];

export function jurisdictionName(code: JurisdictionCode) {
  return EUROPEAN_JURISDICTIONS.find(([item]) => item === code)?.[1] ?? code;
}

export function jurisdictionStatus(code: JurisdictionCode): JurisdictionStatus {
  return code === 'HU' ? 'verification-in-progress' : 'national-review-required';
}

export function jurisdictionStatusLabel(status: JurisdictionStatus) {
  if (status === 'verified') return 'A beépített országprofil szakmailag lezárt';
  if (status === 'verification-in-progress') return 'EN-alapú számítás · a magyar országprofil bővítése folyamatban';
  return 'EN-alapú számítás · a helyi követelményeket jogosult szakági tervező igazolja';
}

export function canClaimNationalCompliance(code: JurisdictionCode) {
  return jurisdictionStatus(code) === 'verified';
}
