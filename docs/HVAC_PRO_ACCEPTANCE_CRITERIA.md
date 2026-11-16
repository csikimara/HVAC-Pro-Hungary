# HVAC Pro Hungary – elfogadási feltételek

Az APK csak akkor készülhet el kiadható tesztváltozatként, ha az alábbi pontok teljesülnek.

## 1. Célközönség és kezelési elv

- Elsődleges felhasználó: klíma- és légtechnikai kivitelező, nem tervezőmérnök.
- A felhasználó a helyszínen ismert adatokat adja meg; az app végzi a szakmai számítást.
- A kezdőképernyő feladatot kérdez: „Mit szeretnél megoldani?”.
- Minden eszköz előtt szerepel:
  - mikor kell használni;
  - mit kell megadni vagy megmérni;
  - milyen pontosságú az eredmény;
  - mi korlátozza a pontosságot.
- Egy feladat megnyitásakor csak az adott eszköz látszik.
- A szakmai kategóriák másodlagos böngészési lehetőségként megmaradhatnak.
- Kereső és működő Kedvencek szükséges.
- A betűméret telefonon és tableten jól olvasható, de nem aránytalanul nagy.
- A kezdőlap gombja görgetés közben is könnyen elérhető.

## 2. Az eredmények kötelező minősítése

Minden számított eredmény egyértelmű jelölést kap:

- **Gyártói adat:** konkrét gyártó, termékcsalád, termékkód, kivitel és hivatalos dokumentum alapján.
- **Mérnöki számítás:** ellenőrzött fizikai/mérnöki képlet, a szükséges és megfelelő pontosságú bemeneti adatokkal.
- **Mérnöki becslés:** elfogadott mérnöki képlet, de legalább egy általános anyagjellemző, veszteségtényező vagy feltételezett bemenet alapján. Szakmailag számított eredmény, de nem gyári pontosságú.
- **Gyors előbecslés:** egyszerűsített módszer, ökölszabály vagy jelentősen hiányos bemenet alapján; nem nevezhető teljes mérnöki számításnak.

Az app külön mutatja a **számítási módszert** és az **adatminőséget**. Egy elfogadott képlet nem válik pontatlanná attól, hogy általános adatot kap, de a végeredmény bizonytalanságát ilyenkor jól láthatóan jelezni kell. Nem megengedett egyetlen százalékos „pontosságot” állítani igazolható hibabecslés nélkül.

Az alkalmazás sehol nem ígér „abszolút pontos” eredményt. Teljes bemenetnél a megnevezés **részletes, szabványalapú mérnöki számítás**. Minden eredmény mellett és a mentett jegyzőkönyvben kötelező:

- a számítási mód és minősítési szint;
- a módszer azonosítója és verziója;
- az adatkitöltöttség;
- a feltételezett és hiányzó bemenetek felsorolása;
- a felhasznált szabványos, gyártói vagy mérnöki forrás;
- a szükséges helyszíni ellenőrzés, mérés vagy beszabályozás;
- a számítás időpontja és a bemeneti adatok változatlan másolata.

A pontossági minősítés gépileg, a bemenetek és források alapján készül; a felhasználó nem állíthat át becslést mérnöki számítássá. Nyelvváltáskor a minősítés nem veszhet el, mert a mentett projekt nyelvfüggetlen minősítési kódot tárol.

### Nyelvek

- A kiadási cél nyolc teljes nyelv: magyar, román, német, angol, szlovák, francia, olasz és horvát.
- Minden mező, súgó, eredmény, pontossági jelölés, feltételezés, figyelmeztetés, jelentés és jogi szöveg fordítási kulcsból jelenik meg.
- Hiányzó fordításnál a nyilvános kiadás buildje hibával áll le; csendes magyar vagy angol visszaesés nem engedélyezett biztonsági szövegnél.
- A képletek, mértékegységek és tárolt adatok nyelvfüggetlenek; csak a megjelenítés lokalizált.
- A kezelőfelület nyelve és a számítás joghatósága két külön beállítás. Például egy német nyelven dolgozó magyarországi felhasználónál továbbra is a magyar előíráskészlet alkalmazandó.
- Az app első használatkor külön kéri az országot/szabványrégiót, és minden eredményen megjeleníti az alkalmazott joghatóságot, szabványkiadást és módszerverziót.
- Ismeretlen vagy még nem támogatott ország esetén az app nem állít helyi megfelelést: nemzetközi mérnöki ajánlást ad, ezt jól láthatóan jelöli, és helyi tervezői ellenőrzést kér.
- A főképernyő fogaskerekéből megnyitható Beállításokban külön választható a nyolc kezelőfelületi nyelv, az európai számítási ország/szabványrégió és a számítási mód.
- A két számítási mód: **Teljes mérnöki számítás** és **Mérnöki ajánlás**. Teljes módban hiányzó kötelező adat, jogtiszta módszer vagy lezáratlan országprofil esetén az app nem adhat teljes megfelelőségi minősítést.
- Mérnöki ajánlás módban a közérthető választókhoz ellenőrzött tipikus jellemzők tartoznak, de minden feltételezés és az ebből eredő korlátozás látható marad.

### Kiadási és felelősségi védelem

- A figyelmeztetés nem helyettesíti a helyes számítást, tesztelést és forráskezelést.
- Légmennyiségnél a számított érték tervezési érték; a tényleges értéket helyszíni mérés és beszabályozás igazolja.
- A fizetős vagy nyilvános kiadás előtt a felhasználási feltételeket, adatkezelést és felelősségi szövegeket magyar jogban jártas szakemberrel ellenőriztetni kell.
- Minden kiadott számítás reprodukálható és auditálható legyen az elmentett bemenetekből, módszerverzióból és forrásokból.

Az app nem nevezhet általános K-értéket egy márka adatának. Gyártói rekordhoz kötelező:

- gyártó és pontos termékkód;
- méret és kivitel;
- érvényes légmennyiség-/sebességtartomány;
- dokumentum címe, kiadása vagy dátuma és oldala;
- forráslink;
- az interpoláció módja.

Gyártói táblázaton vagy görbén kívül nincs automatikus extrapoláció. Hiányzó gyártói adat nem akadályozza a fejlesztést: az adott választás „adat pótlásra vár” állapotú, és csak külön jelölt, elfogadott módszerrel készült mérnöki becslés vagy gyors előbecslés használható.

Első adatforrási kör: Lindab, TROX, Airvent és Systemair. Csak ellenőrzött termékek kerülnek a választható gyártói listába.

## 3. Navigáció és tartalom

- Minden munkafolyamatban közös **Részletes segítség** kapcsoló van.
- Bekapcsolva hétköznapi nyelven, lépésenként elmagyarázza, mit kell kiválasztani, mit kell megmérni és mit jelent az eredmény.
- Kikapcsolva a mezők mellett csak a pontossági besorolás, a biztonsági figyelmeztetés és a számításhoz feltétlenül szükséges leírás marad.
- A választást a webes és az APK-változat is megjegyzi.
- A Valutaátváltó az Átváltók első eleme.
- A teljesítmény-átváltó csak az Átváltók között szerepel.
- Villanyszámla-kalkulátor nem szerepel.
- A modul neve: **Légcsatornaág-tervezés és ESP**.
- Az alkalmazás neve és ikonja jelenik meg, nem a `northwind.hu` böngészőfejléc.
- A PWA megmaradhat, de az APK önálló alkalmazásként fusson.

### Northwind Flow kapcsolat

- A számítások verziózott, hordozható projektcsomagként tárolódnak; nem csak a képernyőn látható végeredmény marad meg.
- A projekt később Northwind Flow tenant-, ügyfél-, ügyfélhelyszín-, felmérés- és munkalap-azonosítóhoz kapcsolható.
- A Flow felé küldött csomag tartalmazza a helyiségi bemeneteket, számított hűtési igényt, pontossági besorolást, számítási típust és verziót.
- HVAC Pro nem tárol beégetett Flow API-kulcsot. A kapcsolat a bejelentkezett felhasználó jogosultságával, a Flow API-ján és RLS-szabályain keresztül működik majd.
- Kapcsolat nélkül minden számítás helyben használható és később szinkronizálható.

## 4. Légtechnika

### Munkafolyamatok

- A légtechnikai kezdőképernyő nem képletnevekkel, hanem kivitelezési munkákkal indul:
  - légcsatornázható split / fan-coil légoldali beépítése;
  - családi házas, jellemzően 300–500 m³/h légkezelő befúvó- és elszívó hálózata;
  - fürdőszoba és WC elszívása;
  - lakossági konyhai páraelszívás és ipari/nagykonyhai elszívás külön számítási úton;
  - lakás frisslevegő-igényének ellenőrzése;
  - egy konkrét légút részletes nyomásvesztesége.
- Split/fan-coil munkánál a gép vagy osztódoboz külön kör csonkjai, a közvetlen ágak és a szükséges Y-osztások kezelhetők. Ezen a képernyőn nem használjuk a „gerinc” fogalmát.
- A légkezelős munkánál külön befúvó és elszívó főcsatorna/gerinc, egy vagy két főág, helyiségi leágazások és befúvás–elszívás légmérleg kezelhető.
- A számítás oda-vissza működik: légmennyiségből méretet, meglévő méretből használható légmennyiséget ad.
- Minden alapterületet használó helyiségkártyán alapértelmezett a 2,70 m belmagasság, de egy kapcsolóval egyedi magasság adható meg. A számított helyiségtérfogat mindig látható.
- Az alkalmazás egyértelműen jelzi, hogy az ajánlás személy-, alapterület-, térfogat- vagy légcsereszám-alapú; a belmagasság nem módosíthat olyan ajánlást, amelynek szabványos alapja nem térfogatalapú.
- A befúvási helyek számának megfelelően dinamikusan létrejönnek a helyiségkártyák: előre megadott helyiségtípus, „Egyéb” saját név, alapterület, alapértelmezett 2,70 m vagy külön belmagasság.
- A hőterhelési modulban kiszámolt helyiségek névvel elmenthetők és a split/fan-coil légoldali tervezésbe átvehetők.
- Mentett helyiségi hőterhelés esetén a gép légmennyisége a kW-igények arányában oszlik meg; mentett adatok nélkül csak jól jelölt térfogatarányos előbecslés használható.
- A légkezelős munkafolyamatban a helyiségtípus, terület és létszám módosítására a frisslevegő-ajánlás, a teljes légmennyiség és az ágméret azonnal újraszámolódik.
- Minden csőszakasz mellett látszik a légsebesség és a komfortos / emelt-irodai / magas-zajkockázatú sebességi sáv.
- A sáv nem minősül zajszámításnak; a tényleges akusztikai eredményhez gyártói hangteljesítmény-adat szükséges.
- A hibás rendszerhez számszerű javítási ajánlás kell: idom kivétele vagy cseréje, átmérőnövelés, két gerinc, másik ventilátorfokozat vagy nagyobb ESP.

### Légcsatorna-méretező

- Közérthetően elmagyarázza, milyen konkrét helyzetben használható.
- Kör és négyszög keresztmetszet.
- Szabványos méret és a választott méretnél kialakuló tényleges sebesség.
- A javasolt sebesség nem univerzális „jó/rossz” határ, hanem a használati hely és zajigény függvénye.

### Légút nyomásesés-összeállító

- Egy konkrét légutat számol a ventilátortól a kiválasztott végpontig.
- Több, külön megadható csőszakasz:
  - Sonodec/flexibilis cső;
  - spirálkorcolt fémcső;
  - műanyag cső;
  - alumínium vagy egyéb támogatott cső.
- Szakaszonként: típus, hossz, átmérő/méret, szükséges kiviteladat.
- Sonodecnél kihúzottság; opcionálisan gyártói Pa/m adat, amely elsőbbséget kap.
- Idomonként típus és darabszám: könyök, ív, T-idom, szűkítés, bővítés, visszacsapó stb.
- Végpontok és berendezések: légszelep, rács, diffúzor, szűrő, hőcserélő vagy kézzel megadott gyártói nyomásesés.
- A végpontlistában külön szerepel a kültéri esővédő/esővető rács, a kalapos függőleges kidobó, a tetős beszívó sapka, a résbefúvó és a fúvóka.
- A gyártó kiválasztása önmagában nem aktivál gyártói adatot. Az app az idom/végpont és méret alapján pontos termékkódot ajánl, amelyet a felhasználónak külön meg kell erősítenie.
- A termékkód alapállapotban rejtve marad; csak a gyártó, a terméktípus és a névleges méret kiválasztása után jelenik meg ellenőrzésre.
- Megerősített termékkódnál is csak a hivatalos görbe tartományán belül használható a gyártói érték; extrapoláció nincs.
- Külön mutatja az egyenes szakaszok, idomok, gyártói termékek és a teljes légút veszteségét.
- Párhuzamos ágakat nem ad össze hibásan; ehhez az ágtervezőhöz irányít.

### Légcsatornaág-tervezés és ESP

- Ágankénti légmennyiség és szakaszadatok.
- Közös és különálló szakaszok helyes kezelése.
- Mértékadó/indexág meghatározása.
- Beszabályozási különbség és szükséges külső statikus nyomás (ESP).
- Általános résbefúvó- vagy légszelepmodell nem hivatkozhat konkrét gyártóra.

### Konyhai ipari / lakossági elszívás

- A legelső választás: **Lakossági konyha** vagy **Ipari / nagykonyha**; a két módszer és figyelmeztetés nem keverhető.
- Mindkét ág oda-vissza működik: szükséges légmennyiségből csatorna/ventilátor, illetve meglévő légmennyiségből elért légcsere és sebesség.
- Lakossági módban külön kezelendő a szabadba kivezetett és a belső keringetéses páraelszívó. A keringetéses készülék nem számítható külső elszívásnak.
- Lakossági szerelési ellenőrzés: főzőlap és elszívó szélessége, telepítési magasság, gyártói minimum, légpótlás, nyílt égésterű készülék/kandalló figyelmeztetés.
- A gyártói telepítési útmutató elsőbbséget élvez az általános ajánlással szemben.
- Nagykonyhai szakmai alap: MSZ EN 16282-1 (általános és számítás), -2 (ernyők), -4 (levegő be-/elszívás), -5 (légcsatorna), -6 (aeroszol-/zsírleválasztók), továbbá a vonatkozó tűzvédelmi és munkavédelmi előírások.
- Az MSZ EN 16282 szerinti minősítéshez a teljes ellenőrzött szabványmódszer és bemenet szükséges. Külföldi gyártói felületi irányérték csak jól látható előméretezés lehet.
- Zsírfogó/leválasztó veszteségét nem szabad általános típusnévből kitalálni. Gyártó, termékkód, aktív felület, érvényes légmennyiség-tartomány és hivatalos görbe vagy táblázat szükséges.
- A számítás mutassa az elszívást, a közvetlen légpótlást, a szomszédos terekből szükséges átáramlást, a szűrő homloksebességét, a gyártói szűrőveszteséget és a csatorna légsebességét.
- A végső eredményhez tisztíthatósági, zsírállósági, tűzvédelmi és beszabályozási ellenőrző lista tartozik.

## 5. Hűtéstechnika

- PT-adatok legalább a már meglévő tíz hűtőközeghez.
- Keverékeknél külön buborék- és harmatpont.
- Túlhevítés harmatpontból, utóhűtés buborékpontból.
- A nyomás alapja (relatív/abszolút) mindig egyértelmű.
- Nyomáspróba: relatív nyomásból abszolút nyomás, °C-ból K, majd hőmérséklet-korrekció.
- Helyi légköri nyomás opcionálisan pontosítható.
- A mért végnyomás összehasonlítható, de nincs önkényes „jó/rossz” határérték.
- Split-, légcsatornás split- és fan-coil méretezés csak teljes bemeneti adatokkal nevezhető mérnöki számításnak; egyébként jól láthatóan előméretezés/becslés.
- A hűtési és fűtési hőterhelés két külön indulási módot kínál:
  - **Összes adat ismert:** pontos geometria, szerkezeti rétegrend vagy igazolt U-értékek, nyílászárók U- és g-értéke, tájolás és árnyékolási geometria, légcsere/légzárás, belső terhelések, használati profil és tervezési külső-belső állapotok. Csak teljes bemenet és ellenőrzött módszer mellett minősül részletes mérnöki számításnak.
  - **Nem ismerek minden adatot:** közérthető szerkezettípusok és tipikus értékek alapján készülő mérnöki becslés. Az eredménykártyán nagy, kontrasztos **HOZZÁVETŐLEGES ÉRTÉK** jelölés és a feltételezések listája kötelező.
- A részletes mód nem engedi a kötelező mezők kihagyását, illetve kihagyás esetén automatikusan becslésre minősíti vissza az eredményt.
- A hűtési és a fűtési méretezés külön tervezési állapotból és külön eredményből készül; egyik nem vezethető le egyetlen általános W/m² szorzóból.
- Szerkezetek és ablakok választhatók közérthető típusnévvel, az alkalmazott U-érték feltüntetésével. Példák:
  - régi kapcsolt gerébtokos, két külön szárnyú egyszeres üvegezés;
  - egyrétegű üveg;
  - kétrétegű hőszigetelő üveg;
  - háromrétegű hőszigetelő üveg;
  - egyedi U-érték.

## 6. Villamos és kompresszorvizsgálat

- Egy- és háromfázisú teljesítményszámítás helyes képlettel és cos φ bemenettel.
- Aszimmetrikus háromfázisú terhelésnél figyelmeztetés a fázisonkénti mérésre.
- Egyfázisú kompresszor:
  - C–R, C–S és R–S mérés;
  - mérővezeték-ellenállás levonása;
  - opcionális 25 °C-os hőmérséklet-korrekció;
  - opcionális gyártói névleges érték és gyártói tűrés;
  - C/R/S–kompresszorház: OL vagy mérhető vezetés.
- Nincs önkényes ±15%-os minősítés.
- Gyártói adatok nélkül az app az összefüggést és eltérést mutatja, de nem állítja, hogy a tekercs jó vagy rossz.
- A multiméteres OL nem helyettesíti a szigetelésvizsgálatot; külön meggeres mérőmező nem szükséges.

## 7. Diagnosztika

- A tünetalapú rész mérési sorrendet és lehetséges okokat ad, nem bizonyosságot színlel.
- Minden küszöbértékhez szakmai forrás vagy jól látható „általános irányérték” jelölés kell.
- Veszélyes következtetésnél az app további mérésre vagy gyártói dokumentációra irányít.

## 8. APK kiadási kapu

Az első teszt-APK előtt kötelező:

- nincs „Átépítés alatt” vagy nem működő menüpont;
- nincs hamis gyártói hivatkozás;
- nincs jelöletlen becslés;
- minden fő képlet külön tesztelhető számítási modulban van;
- határérték-, mértékegység- és hibás bemenet tesztek;
- teljes lint és build hiba nélkül;
- telefonos ellenőrzés Samsung Galaxy S25 Ultra méreten;
- tabletes ellenőrzés Samsung Galaxy Tab S9 FE méreten;
- offline indulás és az internetet nem igénylő kalkulátorok működése;
- vissza-, kezdőlap-, kereső- és Kedvencek-logika ellenőrzése;
- verziószám, stabil Android package ID, alkalmazásnév és ikon;
- a webes PWA-ból minden megtartandó működő funkció átkerült.

Az APK először zárt tesztcsomag, nem áruházi kiadás.
