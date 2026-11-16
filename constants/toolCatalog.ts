export interface PlainTask { title: string; description: string; route: string; color: string; }
export interface TaskGroup { title: string; subtitle: string; color: string; tasks: PlainTask[]; }

export const TASK_GROUPS: TaskGroup[] = [
  {
    title: 'Légoldali kivitelezést tervezek', subtitle: 'Válaszd ki a tényleges munkát; az app lépésről lépésre vezet', color: '#06B6D4',
    tasks: [
      { title: 'Légcsatornázható splitet vagy fan-coilt építek be', description: 'Gyári kör csonkok, közvetlen ágak, Y-osztások, légsebesség, ESP és részletes nyomásveszteség.', route: '/(tabs)/(legtechnika)?tool=ducted-airside', color: '#06B6D4' },
      { title: 'Családi házas légkezelő hálózatát tervezem', description: 'Jellemzően 300–500 m³/h, külön befúvó és elszívó főcsatornákkal, helyiségi leágazásokkal és légmérleggel.', route: '/(tabs)/(legtechnika)?tool=residential-ahu', color: '#14B8A6' },
      { title: 'Fürdőszobát vagy WC-t szellőztetek', description: 'A helyiségből meghatározza az elszívást, vagy a meglévő csőből a használható légszállítást.', route: '/(tabs)/(legtechnika)?tool=bathroom-exhaust', color: '#38BDF8' },
      { title: 'Konyhai elszívást tervezek', description: 'Lakossági páraelszívó vagy ipari/nagykonyhai elszívóernyő külön munkafolyamatban.', route: '/(tabs)/(legtechnika)?tool=kitchen-exhaust', color: '#F97316' },
      { title: 'Lakás frisslevegő-igényét ellenőrzöm', description: 'Nappali és hálószoba ajánlott frisslevegő-befúvása helyiség és létszám alapján.', route: '/(tabs)/(legtechnika)?tool=fresh-air', color: '#2DD4BF' },
      { title: 'Páratartalmat és páralecsapódást ellenőrzök', description: 'Hőmérséklet, relatív páratartalom, harmatpont és hideg felület összefüggése.', route: '/(tabs)/(legtechnika)?tool=psychrometrics', color: '#38BDF8' },
      { title: 'Egy konkrét légút nyomásveszteségét számolom', description: 'Csövek, könyökök, idomok, légszelepek, esővédő rács és tetőkidobó egy útvonalon.', route: '/(tabs)/(legtechnika)?tool=pressure-drop', color: '#22D3EE' },
    ],
  },
  {
    title: 'Hűtőkört ellenőrzök', subtitle: 'Nyomás, hőmérséklet, túlhevítés, utóhűtés és nyomáspróba', color: '#3B82F6',
    tasks: [
      { title: 'Nyomásból telítési hőmérséklet kell', description: 'PT-adat hűtőközeg és mért nyomás alapján.', route: '/(tabs)/(hutestechnika)?tool=pt-table', color: '#3B82F6' },
      { title: 'Túlhevítést vagy utóhűtést számolok', description: 'A nyomás- és csőhőmérséklet-mérésből számol.', route: '/(tabs)/(hutestechnika)?tool=superheat-subcool', color: '#60A5FA' },
      { title: 'Nyomáspróbát ellenőrzök', description: 'Korrigálja a nyomást a kezdő és a jelenlegi hőmérsékletre.', route: '/(tabs)/(hutestechnika)?tool=pressure-test', color: '#818CF8' },
      { title: 'Klímát vagy fan-coilt méretezek', description: 'Hőterhelési adatokból segít készülékteljesítményt választani.', route: '/(tabs)/(hutestechnika)?tool=split-sizing', color: '#A78BFA' },
    ],
  },
  {
    title: 'Villamos mérést ellenőrzök', subtitle: 'Áram, feszültség, teljesítmény és kompresszorkapcsok', color: '#F59E0B',
    tasks: [
      { title: 'Egyfázisú teljesítményt számolok', description: 'Feszültség, áram és teljesítménytényező alapján.', route: '/(tabs)/(villany)?tool=single-phase', color: '#F59E0B' },
      { title: 'Háromfázisú teljesítményt számolok', description: 'Vonali feszültségből, áramból és teljesítménytényezőből.', route: '/(tabs)/(villany)?tool=three-phase', color: '#FBBF24' },
      { title: 'Kompresszor C–R–S kapcsait mérem', description: 'A három kapocspár ellenállásából ellenőrzi a két tekercs összefüggését, önkényes tűrés nélkül.', route: '/(tabs)/(diagnosztika)?tool=compressor-electrical', color: '#FB923C' },
    ],
  },
  {
    title: 'Gyorsan átváltok valamit', subtitle: 'Valuta, nyomás, hőmérséklet, légszállítás és teljesítmény', color: '#A855F7',
    tasks: [
      { title: 'Valutát váltok', description: 'Az elérhető legfrissebb referenciaárfolyammal.', route: '/(tabs)/(atvalto)?tool=currency', color: '#22C55E' },
      { title: 'Nyomást váltok át', description: 'Pa, kPa, bar, psi és más gyakori egységek között.', route: '/(tabs)/(atvalto)?tool=pressure', color: '#A855F7' },
      { title: 'Hőmérsékletet vagy légszállítást váltok', description: 'A leggyakoribb helyszíni mértékegységek között.', route: '/(tabs)/(atvalto)', color: '#C084FC' },
    ],
  },
];
