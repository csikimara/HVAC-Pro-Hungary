export interface PlainTask { title: string; description: string; route: string; color: string; }
export interface TaskGroup { title: string; subtitle: string; color: string; tasks: PlainTask[]; }

export const TASK_GROUPS: TaskGroup[] = [
  {
    title: 'Légcsatornát építek',
    subtitle: 'Méret, sebesség, nyomásveszteség és ventilátornyomás',
    color: '#06B6D4',
    tasks: [
      { title: 'Mekkora légcsatorna kell?', description: 'A légmennyiségből és a kívánt sebességből csőméretet számol.', route: '/(tabs)/(legtechnika)?tool=duct-sizing', color: '#06B6D4' },
      { title: 'Mekkora a teljes nyomásveszteség?', description: 'Csövek, könyökök, idomok és légszelepek egy konkrét légútján.', route: '/(tabs)/(legtechnika)?tool=pressure-drop', color: '#38BDF8' },
      { title: 'Több helyiség között osztom el a levegőt', description: 'Áganként méretez és megkeresi a legnagyobb ellenállású légutat.', route: '/(tabs)/(legtechnika)/legelosztasscreen', color: '#22D3EE' },
      { title: 'Csőben áramló víz mérete és vesztesége', description: 'Víz térfogatáramából csőátmérőt, sebességet és súrlódási veszteséget számol.', route: '/(tabs)/(legtechnika)?tool=pipe-sizing', color: '#2DD4BF' },
    ],
  },
  {
    title: 'Hűtőkört ellenőrzök',
    subtitle: 'Nyomás, hőmérséklet, túlhevítés, utóhűtés és nyomáspróba',
    color: '#3B82F6',
    tasks: [
      { title: 'Nyomásból telítési hőmérséklet kell', description: 'PT-adat hűtőközeg és mért nyomás alapján.', route: '/(tabs)/(hutestechnika)?tool=pt-table', color: '#3B82F6' },
      { title: 'Túlhevítést vagy utóhűtést számolok', description: 'A nyomás- és csőhőmérséklet-mérésből számol.', route: '/(tabs)/(hutestechnika)?tool=superheat-subcool', color: '#60A5FA' },
      { title: 'Nyomáspróbát ellenőrzök', description: 'Korrigálja a nyomást a kezdő és jelenlegi hőmérsékletre.', route: '/(tabs)/(hutestechnika)?tool=pressure-test', color: '#818CF8' },
      { title: 'Klímát vagy fan-coilt méretezek', description: 'Hőterhelési adatokból segít készülékteljesítményt választani.', route: '/(tabs)/(hutestechnika)?tool=split-sizing', color: '#A78BFA' },
    ],
  },
  {
    title: 'Villamos mérést ellenőrzök',
    subtitle: 'Áram, feszültség, teljesítmény és kompresszorkapcsok',
    color: '#F59E0B',
    tasks: [
      { title: 'Egyfázisú teljesítményt számolok', description: 'Feszültség, áram és teljesítménytényező alapján.', route: '/(tabs)/(villany)?tool=single-phase', color: '#F59E0B' },
      { title: 'Háromfázisú teljesítményt számolok', description: 'Vonali feszültségből, áramból és teljesítménytényezőből.', route: '/(tabs)/(villany)?tool=three-phase', color: '#FBBF24' },
      { title: 'Kompresszor C–R–S kapcsait mérem', description: 'A három tekercsellenállás kapcsolatát ellenőrzi, önkényes tűrés nélkül.', route: '/(tabs)/(diagnosztika)?tool=compressor-electrical', color: '#FB923C' },
    ],
  },
  {
    title: 'Gyorsan átváltok valamit',
    subtitle: 'Valuta, nyomás, hőmérséklet, légszállítás és teljesítmény',
    color: '#A855F7',
    tasks: [
      { title: 'Valutát váltok', description: 'A legfrissebb elérhető referenciaárfolyammal.', route: '/(tabs)/(atvalto)?tool=currency', color: '#22C55E' },
      { title: 'Nyomást váltok át', description: 'Pa, kPa, bar, psi és más gyakori egységek között.', route: '/(tabs)/(atvalto)?tool=pressure', color: '#A855F7' },
      { title: 'Hőmérsékletet vagy légszállítást váltok', description: 'A leggyakoribb helyszíni mértékegységek között.', route: '/(tabs)/(atvalto)', color: '#C084FC' },
    ],
  },
];
