import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { countries } from '../src/data/countries.js';

// Base de connaissances complète pour les 195 pays
const enrichedData = {
  // --- LIMITROPHES FRANCE (Tier 1) ---
  es: { capital: 'Madrid', pop: 48000000, area: 505990, gdp: 1600, currency: 'Euro', tier: 1, cities: ['Barcelone', 'Séville', 'Valence'], borders: ['fr', 'ad', 'pt', 'ma'] },
  it: { capital: 'Rome', pop: 59000000, area: 301340, gdp: 2200, currency: 'Euro', tier: 1, cities: ['Milan', 'Naples', 'Turin'], borders: ['fr', 'ch', 'at', 'si', 'sm', 'va'] },
  ch: { capital: 'Berne', pop: 8900000, area: 41285, gdp: 900, currency: 'Franc suisse', tier: 1, borders: ['fr', 'de', 'it', 'at', 'li'] },
  de: { capital: 'Berlin', pop: 84000000, area: 357022, gdp: 4400, currency: 'Euro', tier: 1, cities: ['Munich', 'Francfort', 'Hambourg'], borders: ['dk', 'pl', 'cz', 'at', 'ch', 'fr', 'lu', 'be', 'nl'] },
  be: { capital: 'Bruxelles', pop: 11800000, area: 30528, gdp: 630, currency: 'Euro', tier: 1, cities: ['Anvers', 'Gand', 'Liège'], borders: ['fr', 'lu', 'de', 'nl'] },
  lu: { capital: 'Luxembourg', pop: 660000, area: 2586, gdp: 85, currency: 'Euro', tier: 1, borders: ['be', 'fr', 'de'] },
  mc: { capital: 'Monaco', pop: 39000, area: 2, gdp: 8, currency: 'Euro', tier: 1, borders: ['fr'] },
  ad: { capital: 'Andorre-la-Vieille', pop: 80000, area: 468, gdp: 3, currency: 'Euro', tier: 1, borders: ['fr', 'es'] },
  fr: { capital: 'Paris', pop: 68000000, area: 551695, gdp: 3000, currency: 'Euro', tier: 1, cities: ['Lyon', 'Marseille', 'Bordeaux'], borders: ['es', 'ad', 'mc', 'it', 'ch', 'de', 'lu', 'be'] },

  // --- EUROPE (Tier 2) ---
  gb: { capital: 'Londres', pop: 67000000, area: 242495, gdp: 3300, currency: 'Livre sterling', tier: 2, cities: ['Manchester', 'Birmingham', 'Édimbourg'], borders: ['ie'] },
  pt: { capital: 'Lisbonne', pop: 10400000, area: 92212, gdp: 280, currency: 'Euro', tier: 2, cities: ['Porto', 'Braga'], borders: ['es'] },
  nl: { capital: 'Amsterdam', pop: 17900000, area: 41543, gdp: 1100, currency: 'Euro', tier: 2, cities: ['Rotterdam', 'La Haye', 'Utrecht'], borders: ['be', 'de'] },
  se: { capital: 'Stockholm', pop: 10500000, area: 450295, gdp: 600, currency: 'Couronne suédoise', tier: 2, cities: ['Göteborg', 'Malmö'], borders: ['no', 'fi'] },
  no: { capital: 'Oslo', pop: 5500000, area: 385207, gdp: 500, currency: 'Couronne norvégienne', tier: 2, borders: ['se', 'fi', 'ru'] },
  dk: { capital: 'Copenhague', pop: 5900000, area: 42933, gdp: 400, currency: 'Couronne danoise', tier: 2, borders: ['de'] },
  fi: { capital: 'Helsinki', pop: 5600000, area: 338424, gdp: 300, currency: 'Euro', tier: 2, borders: ['se', 'no', 'ru'] },
  ie: { capital: 'Dublin', pop: 5200000, area: 70273, gdp: 540, currency: 'Euro', tier: 2, borders: ['gb'] },
  pl: { capital: 'Varsovie', pop: 38000000, area: 312696, gdp: 840, currency: 'Złoty', tier: 2, cities: ['Cracovie', 'Wrocław', 'Gdańsk'], borders: ['de', 'cz', 'sk', 'ua', 'by', 'lt', 'ru'] },
  gr: { capital: 'Athènes', pop: 10400000, area: 131957, gdp: 240, currency: 'Euro', tier: 2, cities: ['Thessalonique', 'Patras'], borders: ['al', 'mk', 'bg', 'tr'] },
  at: { capital: 'Vienne', pop: 9100000, area: 83871, gdp: 520, currency: 'Euro', tier: 2, borders: ['de', 'cz', 'sk', 'hu', 'si', 'it', 'ch', 'li'] },
  cz: { capital: 'Prague', pop: 10900000, area: 78866, gdp: 330, currency: 'Couronne tchèque', tier: 2, cities: ['Brno', 'Ostrava'], borders: ['de', 'pl', 'sk', 'at'] },
  ro: { capital: 'Bucarest', pop: 19000000, area: 238391, gdp: 350, currency: 'Leu roumain', tier: 2, cities: ['Cluj-Napoca', 'Timișoara'], borders: ['ua', 'md', 'bg', 'rs', 'hu'] },
  hu: { capital: 'Budapest', pop: 9600000, area: 93028, gdp: 210, currency: 'Forint', tier: 2, borders: ['at', 'sk', 'ua', 'ro', 'rs', 'hr', 'si'] },
  hr: { capital: 'Zagreb', pop: 4000000, area: 56594, gdp: 80, currency: 'Euro', tier: 2, borders: ['si', 'hu', 'rs', 'ba', 'me'] },
  sk: { capital: 'Bratislava', pop: 5400000, area: 49035, gdp: 130, currency: 'Euro', tier: 2, borders: ['cz', 'pl', 'ua', 'hu', 'at'] },
  si: { capital: 'Ljubljana', pop: 2100000, area: 20273, gdp: 68, currency: 'Euro', tier: 2, borders: ['it', 'at', 'hu', 'hr'] },
  bg: { capital: 'Sofia', pop: 6400000, area: 110879, gdp: 100, currency: 'Lev bulgare', tier: 2, borders: ['ro', 'rs', 'mk', 'gr', 'tr'] },
  rs: { capital: 'Belgrade', pop: 6600000, area: 77474, gdp: 75, currency: 'Dinar serbe', tier: 2, borders: ['hu', 'ro', 'bg', 'mk', 'me', 'ba', 'hr'] },
  ba: { capital: 'Sarajevo', pop: 3200000, area: 51209, gdp: 26, currency: 'Mark convertible', tier: 2, borders: ['hr', 'rs', 'me'] },
  al: { capital: 'Tirana', pop: 2800000, area: 28748, gdp: 23, currency: 'Lek', tier: 2, borders: ['me', 'rs', 'mk', 'gr'] },
  mk: { capital: 'Skopje', pop: 1800000, area: 25713, gdp: 15, currency: 'Denar', tier: 2, borders: ['rs', 'bg', 'gr', 'al'] },
  me: { capital: 'Podgorica', pop: 620000, area: 13812, gdp: 7, currency: 'Euro', tier: 2, borders: ['ba', 'rs', 'al', 'hr'] },
  md: { capital: 'Chișinău', pop: 2500000, area: 33846, gdp: 16, currency: 'Leu moldave', tier: 2, borders: ['ro', 'ua'] },
  ua: { capital: 'Kiev', pop: 38000000, area: 603550, gdp: 180, currency: 'Hryvnia', tier: 2, cities: ['Kharkiv', 'Odessa', 'Lviv'], borders: ['ru', 'by', 'pl', 'sk', 'hu', 'ro', 'md'] },
  by: { capital: 'Minsk', pop: 9200000, area: 207600, gdp: 70, currency: 'Rouble biélorusse', tier: 2, borders: ['pl', 'lt', 'lv', 'ru', 'ua'] },
  lt: { capital: 'Vilnius', pop: 2800000, area: 65300, gdp: 78, currency: 'Euro', tier: 2, borders: ['lv', 'by', 'pl', 'ru'] },
  lv: { capital: 'Riga', pop: 1900000, area: 64589, gdp: 44, currency: 'Euro', tier: 2, borders: ['ee', 'ru', 'by', 'lt'] },
  ee: { capital: 'Tallinn', pop: 1300000, area: 45228, gdp: 41, currency: 'Euro', tier: 2, borders: ['ru', 'lv'] },
  li: { capital: 'Vaduz', pop: 40000, area: 160, gdp: 7, currency: 'Franc suisse', tier: 2, borders: ['ch', 'at'] },
  sm: { capital: 'Saint-Marin', pop: 34000, area: 61, gdp: 2, currency: 'Euro', tier: 2, borders: ['it'] },
  va: { capital: 'Vatican', pop: 800, area: 0.49, gdp: 0.1, currency: 'Euro', tier: 2, borders: ['it'] },

  // --- OCCIDENTAUX + GRANDS PAYS (Tier 3) ---
  us: { capital: 'Washington D.C.', pop: 335000000, area: 9833517, gdp: 27000, currency: 'Dollar américain', tier: 3, cities: ['New York', 'Los Angeles', 'Chicago'], borders: ['ca', 'mx'] },
  ca: { capital: 'Ottawa', pop: 40000000, area: 9984670, gdp: 2100, currency: 'Dollar canadien', tier: 3, cities: ['Toronto', 'Montréal', 'Vancouver'], borders: ['us'] },
  jp: { capital: 'Tokyo', pop: 124000000, area: 377975, gdp: 4200, currency: 'Yen', tier: 3, cities: ['Osaka', 'Kyoto', 'Yokohama'], borders: [] }, // Île
  au: { capital: 'Canberra', pop: 26000000, area: 7692024, gdp: 1700, currency: 'Dollar australien', tier: 3, cities: ['Sydney', 'Melbourne', 'Brisbane'], borders: [] }, // Île
  nz: { capital: 'Wellington', pop: 5200000, area: 270467, gdp: 250, currency: 'Dollar néo-zélandais', tier: 3, cities: ['Auckland', 'Christchurch'], borders: [] }, // Île
  kr: { capital: 'Séoul', pop: 51700000, area: 100210, gdp: 1700, currency: 'Won', tier: 3, cities: ['Busan', 'Incheon', 'Daegu'], borders: ['kp'] },
  cn: { capital: 'Pékin', pop: 1410000000, area: 9596961, gdp: 17700, currency: 'Yuan', tier: 3, cities: ['Shanghai', 'Canton', 'Shenzhen'], borders: ['ru', 'mn', 'kp', 'vn', 'la', 'mm', 'in', 'bt', 'np', 'pk', 'af', 'tj', 'kg', 'kz'] },
  in: { capital: 'New Delhi', pop: 1430000000, area: 3287263, gdp: 3700, currency: 'Roupie indienne', tier: 3, cities: ['Bombay', 'Bangalore', 'Calcutta'], borders: ['pk', 'cn', 'np', 'bt', 'bd', 'mm'] },
  ru: { capital: 'Moscou', pop: 144000000, area: 17098242, gdp: 2000, currency: 'Rouble', tier: 3, cities: ['Saint-Pétersbourg', 'Novossibirsk', 'Kazan'], borders: ['no', 'fi', 'ee', 'lv', 'by', 'ua', 'ge', 'az', 'kz', 'cn', 'mn', 'kp'] },
  br: { capital: 'Brasília', pop: 215000000, area: 8515767, gdp: 2100, currency: 'Real', tier: 3, cities: ['São Paulo', 'Rio de Janeiro', 'Salvador'], borders: ['uy', 'ar', 'py', 'bo', 'pe', 'co', 've', 'gy', 'sr'] },
  mx: { capital: 'Mexico', pop: 128000000, area: 1964375, gdp: 1800, currency: 'Peso mexicain', tier: 3, cities: ['Guadalajara', 'Monterrey', 'Cancún'], borders: ['us', 'gt', 'bz'] },
  ar: { capital: 'Buenos Aires', pop: 46000000, area: 2780400, gdp: 640, currency: 'Peso argentin', tier: 3, cities: ['Córdoba', 'Rosario', 'Mendoza'], borders: ['cl', 'bo', 'py', 'br', 'uy'] },

  // --- ÎLES (Tier 5) ---
  is: { capital: 'Reykjavik', pop: 380000, area: 103000, gdp: 30, currency: 'Couronne islandaise', tier: 5, borders: [] },
  mt: { capital: 'La Valette', pop: 530000, area: 316, gdp: 20, currency: 'Euro', tier: 5, borders: [] },
  cy: { capital: 'Nicosie', pop: 1250000, area: 9251, gdp: 32, currency: 'Euro', tier: 5, borders: [] },
  mg: { capital: 'Antananarivo', pop: 29000000, area: 587041, gdp: 16, currency: 'Ariary', tier: 5, cities: ['Toamasina', 'Antsirabe'], borders: [] },
  mu: { capital: 'Port-Louis', pop: 1260000, area: 2040, gdp: 14, currency: 'Roupie mauricienne', tier: 5, borders: [] },
  sc: { capital: 'Victoria', pop: 100000, area: 452, gdp: 2, currency: 'Roupie seychelloise', tier: 5, borders: [] },
  km: { capital: 'Moroni', pop: 850000, area: 2235, gdp: 1.3, currency: 'Franc comorien', tier: 5, borders: [] },
  cv: { capital: 'Praia', pop: 590000, area: 4033, gdp: 2.5, currency: 'Escudo cap-verdien', tier: 5, borders: [] },
  st: { capital: 'Sao Tomé', pop: 230000, area: 964, gdp: 0.6, currency: 'Dobra', tier: 5, borders: [] },
  cu: { capital: 'La Havane', pop: 11000000, area: 109884, gdp: 107, currency: 'Peso cubain', tier: 5, cities: ['Santiago de Cuba', 'Camagüey'], borders: [] },
  ht: { capital: 'Port-au-Prince', pop: 11500000, area: 27750, gdp: 21, currency: 'Gourde', tier: 5, cities: ['Cap-Haïtien', 'Gonaïves'], borders: ['do'] },
  do: { capital: 'Saint-Domingue', pop: 11200000, area: 48670, gdp: 113, currency: 'Peso dominicain', tier: 5, cities: ['Santiago de los Caballeros'], borders: ['ht'] },
  jm: { capital: 'Kingston', pop: 2800000, area: 10991, gdp: 17, currency: 'Dollar jamaïcain', tier: 5, borders: [] },
  bs: { capital: 'Nassau', pop: 410000, area: 13943, gdp: 13, currency: 'Dollar bahaméen', tier: 5, borders: [] },
  bb: { capital: 'Bridgetown', pop: 280000, area: 430, gdp: 6, currency: 'Dollar barbadien', tier: 5, borders: [] },
  lc: { capital: 'Castries', pop: 180000, area: 616, gdp: 2.3, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  vc: { capital: 'Kingstown', pop: 104000, area: 389, gdp: 1, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  gd: { capital: 'Saint-Georges', pop: 125000, area: 344, gdp: 1.3, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  ag: { capital: 'Saint John\'s', pop: 94000, area: 442, gdp: 1.8, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  dm: { capital: 'Roseau', pop: 72000, area: 751, gdp: 0.6, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  kn: { capital: 'Basseterre', pop: 48000, area: 261, gdp: 1, currency: 'Dollar des Caraïbes orientales', tier: 5, borders: [] },
  tt: { capital: 'Port-d\'Espagne', pop: 1500000, area: 5130, gdp: 28, currency: 'Dollar de Trinité-et-Tobago', tier: 5, borders: [] },
  fj: { capital: 'Suva', pop: 930000, area: 18274, gdp: 5, currency: 'Dollar fidjien', tier: 5, borders: [] },
  vu: { capital: 'Port-Vila', pop: 330000, area: 12189, gdp: 1, currency: 'Vatu', tier: 5, borders: [] },
  sb: { capital: 'Honiara', pop: 720000, area: 28896, gdp: 1.6, currency: 'Dollar des Îles Salomon', tier: 5, borders: [] },
  ws: { capital: 'Apia', pop: 220000, area: 2842, gdp: 0.8, currency: 'Tala', tier: 5, borders: [] },
  to: { capital: 'Nuku\'alofa', pop: 100000, area: 747, gdp: 0.5, currency: 'Paʻanga', tier: 5, borders: [] },
  ki: { capital: 'Tarawa-Sud', pop: 130000, area: 811, gdp: 0.3, currency: 'Dollar australien', tier: 5, borders: [] },
  fm: { capital: 'Palikir', pop: 115000, area: 702, gdp: 0.4, currency: 'Dollar américain', tier: 5, borders: [] },
  mh: { capital: 'Majuro', pop: 42000, area: 181, gdp: 0.3, currency: 'Dollar américain', tier: 5, borders: [] },
  pw: { capital: 'Ngerulmud', pop: 18000, area: 459, gdp: 0.3, currency: 'Dollar américain', tier: 5, borders: [] },
  nr: { capital: 'Yaren', pop: 11000, area: 21, gdp: 0.15, currency: 'Dollar australien', tier: 5, borders: [] },
  tv: { capital: 'Funafuti', pop: 11000, area: 26, gdp: 0.06, currency: 'Dollar australien', tier: 5, borders: [] },
  mv: { capital: 'Malé', pop: 520000, area: 298, gdp: 6, currency: 'Rufiyaa', tier: 5, borders: [] },
  ph: { capital: 'Manille', pop: 115000000, area: 300000, gdp: 440, currency: 'Peso philippin', tier: 5, cities: ['Cebu', 'Davao', 'Quezon City'], borders: [] },
  id: { capital: 'Jakarta', pop: 278000000, area: 1904569, gdp: 1370, currency: 'Roupie indonésienne', tier: 5, cities: ['Surabaya', 'Bandung', 'Medan'], borders: ['my', 'tl', 'pg'] },
  sg: { capital: 'Singapour', pop: 5900000, area: 728, gdp: 500, currency: 'Dollar de Singapour', tier: 5, borders: [] },
  bn: { capital: 'Bandar Seri Begawan', pop: 450000, area: 5765, gdp: 16, currency: 'Dollar de Brunei', tier: 5, borders: ['my'] },
  tl: { capital: 'Dili', pop: 1340000, area: 14874, gdp: 3, currency: 'Dollar américain', tier: 5, borders: ['id'] },
  pg: { capital: 'Port Moresby', pop: 10000000, area: 462840, gdp: 31, currency: 'Kina', tier: 5, borders: ['id'] },
};

// Données continentales avec frontières
const defaultTier4 = {
  // Amériques
  cl: { capital: 'Santiago', pop: 19500000, area: 756102, gdp: 340, currency: 'Peso chilien', cities: ['Valparaíso', 'Concepción'], borders: ['pe', 'bo', 'ar'] },
  co: { capital: 'Bogota', pop: 52000000, area: 1141748, gdp: 360, currency: 'Peso colombien', cities: ['Medellín', 'Cali', 'Barranquilla'], borders: ['pa', 've', 'br', 'pe', 'ec'] },
  pe: { capital: 'Lima', pop: 34000000, area: 1285216, gdp: 260, currency: 'Sol', cities: ['Arequipa', 'Trujillo', 'Cusco'], borders: ['ec', 'co', 'br', 'bo', 'cl'] },
  ve: { capital: 'Caracas', pop: 29000000, area: 916445, gdp: 100, currency: 'Bolívar', cities: ['Maracaibo', 'Valencia'], borders: ['co', 'br', 'gy'] },
  ec: { capital: 'Quito', pop: 18000000, area: 283561, gdp: 120, currency: 'Dollar américain', cities: ['Guayaquil', 'Cuenca'], borders: ['co', 'pe'] },
  bo: { capital: 'Sucre', pop: 12000000, area: 1098581, gdp: 45, currency: 'Boliviano', cities: ['La Paz', 'Santa Cruz'], borders: ['pe', 'br', 'py', 'ar', 'cl'] },
  py: { capital: 'Asuncion', pop: 7400000, area: 406752, gdp: 44, currency: 'Guaraní', borders: ['bo', 'br', 'ar'] },
  uy: { capital: 'Montevideo', pop: 3400000, area: 176215, gdp: 77, currency: 'Peso uruguayen', borders: ['br', 'ar'] },
  gy: { capital: 'Georgetown', pop: 800000, area: 214969, gdp: 16, currency: 'Dollar guyanien', borders: ['ve', 'br', 'sr'] },
  sr: { capital: 'Paramaribo', pop: 620000, area: 163820, gdp: 3.6, currency: 'Dollar surinamais', borders: ['gy', 'br'] },
  cr: { capital: 'San José', pop: 5200000, area: 51100, gdp: 85, currency: 'Colón', borders: ['ni', 'pa'] },
  pa: { capital: 'Panama', pop: 4400000, area: 75417, gdp: 83, currency: 'Balboa', borders: ['cr', 'co'] },
  gt: { capital: 'Guatemala', pop: 18000000, area: 108889, gdp: 100, currency: 'Quetzal', cities: ['Antigua', 'Quetzaltenango'], borders: ['mx', 'bz', 'hn', 'sv'] },
  hn: { capital: 'Tegucigalpa', pop: 10400000, area: 112492, gdp: 34, currency: 'Lempira', cities: ['San Pedro Sula'], borders: ['gt', 'sv', 'ni'] },
  sv: { capital: 'San Salvador', pop: 6300000, area: 21041, gdp: 35, currency: 'Dollar américain', borders: ['gt', 'hn'] },
  ni: { capital: 'Managua', pop: 7000000, area: 130373, gdp: 17, currency: 'Córdoba', borders: ['hn', 'cr'] },
  bz: { capital: 'Belmopan', pop: 400000, area: 22966, gdp: 3, currency: 'Dollar bélizien', borders: ['mx', 'gt'] },

  // Asie & Moyen-Orient
  tr: { capital: 'Ankara', pop: 85000000, area: 783562, gdp: 1100, currency: 'Livre turque', cities: ['Istanbul', 'Izmir', 'Antalya'], borders: ['gr', 'bg', 'ge', 'am', 'az', 'ir', 'iq', 'sy'] },
  sa: { capital: 'Riyad', pop: 36000000, area: 2149690, gdp: 1100, currency: 'Riyal saoudien', cities: ['Djeddah', 'La Mecque', 'Médine'], borders: ['jo', 'iq', 'kw', 'ae', 'om', 'ye', 'qa'] },
  ae: { capital: 'Abou Dabi', pop: 9500000, area: 83600, gdp: 500, currency: 'Dirham des EAU', cities: ['Dubaï', 'Sharjah'], borders: ['sa', 'om'] },
  il: { capital: 'Jérusalem', pop: 9800000, area: 20770, gdp: 530, currency: 'Shekel', cities: ['Tel Aviv', 'Haïfa'], borders: ['lb', 'sy', 'jo', 'eg', 'ps'] },
  ps: { capital: 'Ramallah', pop: 5300000, area: 6020, gdp: 19, currency: 'Shekel', borders: ['il', 'eg', 'jo'] },
  ir: { capital: 'Téhéran', pop: 89000000, area: 1648195, gdp: 400, currency: 'Rial iranien', cities: ['Ispahan', 'Mashhad', 'Chiraz'], borders: ['am', 'az', 'tm', 'af', 'pk', 'iq', 'tr'] },
  iq: { capital: 'Bagdad', pop: 44000000, area: 438317, gdp: 260, currency: 'Dinar irakien', cities: ['Bassora', 'Erbil', 'Mossoul'], borders: ['tr', 'ir', 'kw', 'sa', 'jo', 'sy'] },
  sy: { capital: 'Damas', pop: 22000000, area: 185180, gdp: 20, currency: 'Livre syrienne', cities: ['Alep', 'Homs'], borders: ['tr', 'iq', 'jo', 'il', 'lb'] },
  lb: { capital: 'Beyrouth', pop: 5400000, area: 10452, gdp: 23, currency: 'Livre libanaise', borders: ['sy', 'il'] },
  jo: { capital: 'Amman', pop: 11300000, area: 89342, gdp: 50, currency: 'Dinar jordanien', cities: ['Zarqa', 'Irbid'], borders: ['sy', 'iq', 'sa', 'il', 'ps'] },
  ye: { capital: 'Sanaa', pop: 34000000, area: 527968, gdp: 21, currency: 'Rial yéménite', cities: ['Aden', 'Taëz'], borders: ['sa', 'om'] },
  om: { capital: 'Mascate', pop: 4600000, area: 309500, gdp: 110, currency: 'Rial omanais', borders: ['ae', 'sa', 'ye'] },
  qa: { capital: 'Doha', pop: 2700000, area: 11586, gdp: 230, currency: 'Riyal qatari', borders: ['sa'] },
  kw: { capital: 'Koweït', pop: 4300000, area: 17818, gdp: 160, currency: 'Dinar koweïtien', borders: ['iq', 'sa'] },
  bh: { capital: 'Manama', pop: 1500000, area: 765, gdp: 45, currency: 'Dinar bahreïni', borders: [] }, // Île
  af: { capital: 'Kaboul', pop: 41000000, area: 652230, gdp: 14, currency: 'Afghani', cities: ['Kandahar', 'Hérat'], borders: ['ir', 'tm', 'uz', 'tj', 'cn', 'pk'] },
  pk: { capital: 'Islamabad', pop: 240000000, area: 881912, gdp: 340, currency: 'Roupie pakistanaise', cities: ['Karachi', 'Lahore', 'Faisalabad'], borders: ['ir', 'af', 'cn', 'in'] },
  bd: { capital: 'Dacca', pop: 170000000, area: 147570, gdp: 460, currency: 'Taka', cities: ['Chittagong', 'Khulna'], borders: ['in', 'mm'] },
  lk: { capital: 'Sri Jayawardenepura Kotte', pop: 22000000, area: 65610, gdp: 84, currency: 'Roupie srilankaise', cities: ['Colombo', 'Kandy'], borders: [] }, // Île
  np: { capital: 'Katmandou', pop: 30000000, area: 147181, gdp: 41, currency: 'Roupie népalaise', cities: ['Pokhara', 'Lalitpur'], borders: ['cn', 'in'] },
  bt: { capital: 'Thimphou', pop: 780000, area: 38394, gdp: 3, currency: 'Ngultrum', borders: ['cn', 'in'] },
  mm: { capital: 'Naypyidaw', pop: 54000000, area: 676578, gdp: 65, currency: 'Kyat', cities: ['Rangoun', 'Mandalay'], borders: ['bd', 'in', 'cn', 'la', 'th'] },
  th: { capital: 'Bangkok', pop: 71000000, area: 513120, gdp: 510, currency: 'Baht', cities: ['Chiang Mai', 'Phuket', 'Pattaya'], borders: ['mm', 'la', 'kh', 'my'] },
  vn: { capital: 'Hanoï', pop: 98000000, area: 331212, gdp: 430, currency: 'Đồng', cities: ['Hô Chi Minh-Ville', 'Da Nang', 'Haïphong'], borders: ['cn', 'la', 'kh'] },
  la: { capital: 'Vientiane', pop: 7500000, area: 236800, gdp: 15, currency: 'Kip', borders: ['cn', 'vn', 'kh', 'th', 'mm'] },
  kh: { capital: 'Phnom Penh', pop: 17000000, area: 181035, gdp: 30, currency: 'Riel', cities: ['Siem Reap', 'Battambang'], borders: ['th', 'la', 'vn'] },
  my: { capital: 'Kuala Lumpur', pop: 34000000, area: 329847, gdp: 430, currency: 'Ringgit', cities: ['George Town', 'Johor Bahru'], borders: ['th', 'bn', 'id'] },
  mn: { capital: 'Oulan-Bator', pop: 3400000, area: 1564116, gdp: 20, currency: 'Tugrik', borders: ['ru', 'cn'] },
  kp: { capital: 'Pyongyang', pop: 26000000, area: 120538, gdp: 18, currency: 'Won nord-coréen', cities: ['Hamhung', 'Chongjin'], borders: ['cn', 'ru', 'kr'] },
  kz: { capital: 'Astana', pop: 20000000, area: 2724900, gdp: 260, currency: 'Tenge', cities: ['Almaty', 'Chymkent'], borders: ['ru', 'cn', 'kg', 'uz', 'tm'] },
  uz: { capital: 'Tachkent', pop: 36000000, area: 447400, gdp: 90, currency: 'Sum', cities: ['Samarcande', 'Boukhara'], borders: ['kz', 'kg', 'tj', 'af', 'tm'] },
  tm: { capital: 'Achgabat', pop: 6500000, area: 488100, gdp: 60, currency: 'Manat turkmène', borders: ['kz', 'uz', 'af', 'ir'] },
  kg: { capital: 'Bichkek', pop: 7000000, area: 199951, gdp: 12, currency: 'Som', borders: ['kz', 'cn', 'tj', 'uz'] },
  tj: { capital: 'Douchanbé', pop: 10000000, area: 143100, gdp: 12, currency: 'Somoni', borders: ['kg', 'cn', 'af', 'uz'] },
  ge: { capital: 'Tbilissi', pop: 3700000, area: 69700, gdp: 30, currency: 'Lari', borders: ['ru', 'az', 'am', 'tr'] },
  am: { capital: 'Erevan', pop: 2800000, area: 29743, gdp: 24, currency: 'Dram', borders: ['ge', 'az', 'ir', 'tr'] },
  az: { capital: 'Bakou', pop: 10300000, area: 86600, gdp: 72, currency: 'Manat azerbaïdjanais', cities: ['Gandja', 'Sumqayit'], borders: ['ru', 'ge', 'am', 'ir'] },

  // Afrique (Nord et Continentale)
  ma: { capital: 'Rabat', pop: 37000000, area: 446550, gdp: 140, currency: 'Dirham marocain', cities: ['Casablanca', 'Marrakech', 'Fès'], borders: ['dz', 'mr', 'es'] },
  dz: { capital: 'Alger', pop: 45000000, area: 2381741, gdp: 240, currency: 'Dinar algérien', cities: ['Oran', 'Constantine', 'Annaba'], borders: ['ma', 'tn', 'ly', 'ne', 'ml', 'mr'] },
  tn: { capital: 'Tunis', pop: 12400000, area: 163610, gdp: 50, currency: 'Dinar tunisien', cities: ['Sousse', 'Sfax'], borders: ['dz', 'ly'] },
  eg: { capital: 'Le Caire', pop: 110000000, area: 1002450, gdp: 400, currency: 'Livre égyptienne', cities: ['Alexandrie', 'Gizeh', 'Louxor'], borders: ['ly', 'sd', 'il', 'ps'] },
  ly: { capital: 'Tripoli', pop: 7000000, area: 1759540, gdp: 45, currency: 'Dinar libyen', borders: ['tn', 'dz', 'ne', 'td', 'sd', 'eg'] },
  sd: { capital: 'Khartoum', pop: 48000000, area: 1861484, gdp: 30, currency: 'Livre soudanaise', cities: ['Omdourman', 'Port-Soudan'], borders: ['eg', 'ly', 'td', 'cf', 'ss', 'et', 'er'] },
  ss: { capital: 'Djouba', pop: 11000000, area: 644329, gdp: 7, currency: 'Livre sud-soudanaise', borders: ['sd', 'et', 'ke', 'ug', 'cd', 'cf'] },
  sn: { capital: 'Dakar', pop: 18000000, area: 196722, gdp: 31, currency: 'Franc CFA', cities: ['Touba', 'Thiès', 'Saint-Louis'], borders: ['mr', 'ml', 'gn', 'gw', 'gm'] },
  ci: { capital: 'Yamoussoukro', pop: 29000000, area: 322463, gdp: 78, currency: 'Franc CFA', cities: ['Abidjan', 'Bouaké', 'San-Pédro'], borders: ['lr', 'gn', 'ml', 'bf', 'gh'] },
  cm: { capital: 'Yaoundé', pop: 28000000, area: 475442, gdp: 48, currency: 'Franc CFA', cities: ['Douala', 'Garoua', 'Bafoussam'], borders: ['ng', 'td', 'cf', 'cg', 'ga', 'gq'] },
  za: { capital: 'Pretoria', pop: 60000000, area: 1221037, gdp: 380, currency: 'Rand', cities: ['Johannesbourg', 'Le Cap', 'Durban'], borders: ['na', 'bw', 'zw', 'mz', 'sz', 'ls'] },
  ng: { capital: 'Abuja', pop: 220000000, area: 923768, gdp: 470, currency: 'Naira', cities: ['Lagos', 'Kano', 'Ibadan'], borders: ['bj', 'ne', 'td', 'cm'] },
  ke: { capital: 'Nairobi', pop: 54000000, area: 580367, gdp: 115, currency: 'Shilling kényan', cities: ['Mombasa', 'Kisumu'], borders: ['et', 'so', 'tz', 'ug', 'ss'] },
  et: { capital: 'Addis-Abeba', pop: 126000000, area: 1104300, gdp: 155, currency: 'Birr', cities: ['Dire Dawa', 'Gondar'], borders: ['er', 'dj', 'so', 'ke', 'ss', 'sd'] },
  gh: { capital: 'Accra', pop: 33000000, area: 238533, gdp: 76, currency: 'Cedi', cities: ['Kumasi', 'Tamale'], borders: ['ci', 'bf', 'tg'] },
  cd: { capital: 'Kinshasa', pop: 100000000, area: 2344858, gdp: 67, currency: 'Franc congolais', cities: ['Lubumbashi', 'Goma', 'Mbuji-Mayi'], borders: ['cf', 'ss', 'ug', 'rw', 'bi', 'tz', 'zm', 'ao', 'cg'] },
  cg: { capital: 'Brazzaville', pop: 6000000, area: 342000, gdp: 15, currency: 'Franc CFA', cities: ['Pointe-Noire'], borders: ['cm', 'cf', 'cd', 'ao', 'ga'] },
  ga: { capital: 'Libreville', pop: 2400000, area: 267667, gdp: 21, currency: 'Franc CFA', cities: ['Port-Gentil'], borders: ['cm', 'gq', 'cg'] },
  ml: { capital: 'Bamako', pop: 23000000, area: 1240192, gdp: 20, currency: 'Franc CFA', cities: ['Sikasso', 'Mopti'], borders: ['dz', 'ne', 'bf', 'ci', 'gn', 'sn', 'mr'] },
  bf: { capital: 'Ouagadougou', pop: 23000000, area: 274200, gdp: 20, currency: 'Franc CFA', cities: ['Bobo-Dioulasso'], borders: ['ml', 'ne', 'bj', 'tg', 'gh', 'ci'] },
  ne: { capital: 'Niamey', pop: 26000000, area: 1267000, gdp: 16, currency: 'Franc CFA', cities: ['Zinder', 'Maradi'], borders: ['dz', 'ly', 'td', 'ng', 'bj', 'bf', 'ml'] },
  td: { capital: 'N\'Djaména', pop: 18000000, area: 1284000, gdp: 13, currency: 'Franc CFA', cities: ['Moundou'], borders: ['ly', 'sd', 'cf', 'cm', 'ng', 'ne'] },
  gn: { capital: 'Conakry', pop: 14000000, area: 245857, gdp: 23, currency: 'Franc guinéen', cities: ['Nzérékoré'], borders: ['gw', 'sn', 'ml', 'ci', 'lr', 'sl'] },
  bj: { capital: 'Porto-Novo', pop: 13000000, area: 112622, gdp: 19, currency: 'Franc CFA', cities: ['Cotonou', 'Parakou'], borders: ['tg', 'bf', 'ne', 'ng'] },
  tg: { capital: 'Lomé', pop: 9000000, area: 56785, gdp: 9, currency: 'Franc CFA', cities: ['Sokodé'], borders: ['gh', 'bf', 'bj'] },
  ao: { capital: 'Luanda', pop: 36000000, area: 1246700, gdp: 93, currency: 'Kwanza', cities: ['Huambo', 'Lobito'], borders: ['cg', 'cd', 'zm', 'na'] },
  mz: { capital: 'Maputo', pop: 33000000, area: 801590, gdp: 20, currency: 'Metical', cities: ['Matola', 'Beira'], borders: ['tz', 'mw', 'zm', 'zw', 'za', 'sz'] },
  tz: { capital: 'Dodoma', pop: 67000000, area: 945087, gdp: 85, currency: 'Shilling tanzanien', cities: ['Dar es Salaam', 'Mwanza', 'Arusha'], borders: ['ke', 'ug', 'rw', 'bi', 'cd', 'zm', 'mw', 'mz'] },
  ug: { capital: 'Kampala', pop: 48000000, area: 241038, gdp: 50, currency: 'Shilling ougandais', cities: ['Gulu', 'Lira'], borders: ['ss', 'ke', 'tz', 'rw', 'cd'] },
  rw: { capital: 'Kigali', pop: 14000000, area: 26338, gdp: 14, currency: 'Franc rwandais', cities: ['Butare', 'Gisenyi'], borders: ['ug', 'tz', 'bi', 'cd'] },
  bi: { capital: 'Gitega', pop: 13000000, area: 27830, gdp: 3.5, currency: 'Franc burundais', cities: ['Bujumbura'], borders: ['rw', 'tz', 'cd'] },
  zm: { capital: 'Lusaka', pop: 20000000, area: 752618, gdp: 28, currency: 'Kwacha zambien', cities: ['Kitwe', 'Ndola'], borders: ['cd', 'tz', 'mw', 'mz', 'zw', 'bw', 'na', 'ao'] },
  zw: { capital: 'Harare', pop: 16000000, area: 390757, gdp: 32, currency: 'Dollar zimbabwéen', cities: ['Bulawayo'], borders: ['zm', 'mz', 'za', 'bw'] },
  mw: { capital: 'Lilongwe', pop: 20000000, area: 118484, gdp: 13, currency: 'Kwacha malawite', cities: ['Blantyre'], borders: ['tz', 'mz', 'zm'] },
  na: { capital: 'Windhoek', pop: 2600000, area: 825615, gdp: 13, currency: 'Dollar namibien', borders: ['ao', 'zm', 'bw', 'za'] },
  bw: { capital: 'Gaborone', pop: 2600000, area: 581730, gdp: 20, currency: 'Pula', borders: ['na', 'zm', 'zw', 'za'] },
  so: { capital: 'Mogadiscio', pop: 18000000, area: 637657, gdp: 11, currency: 'Shilling somalien', cities: ['Hargeisa', 'Kismaayo'], borders: ['dj', 'et', 'ke'] },
  dj: { capital: 'Djibouti', pop: 1100000, area: 23200, gdp: 4, currency: 'Franc Djibouti', borders: ['er', 'et', 'so'] },
  er: { capital: 'Asmara', pop: 3700000, area: 117600, gdp: 2.5, currency: 'Nakfa', borders: ['sd', 'et', 'dj'] },
  mr: { capital: 'Nouakchott', pop: 4900000, area: 1030700, gdp: 10, currency: 'Ouguiya', borders: ['dz', 'ml', 'sn', 'ma'] },
  gm: { capital: 'Banjul', pop: 2700000, area: 10689, gdp: 2.3, currency: 'Dalasi', cities: ['Serekunda'], borders: ['sn'] },
  gw: { capital: 'Bissau', pop: 2100000, area: 36125, gdp: 2, currency: 'Franc CFA', borders: ['sn', 'gn'] },
  gq: { capital: 'Malabo', pop: 1600000, area: 28051, gdp: 12, currency: 'Franc CFA', cities: ['Bata'], borders: ['cm', 'ga'] },
  cf: { capital: 'Bangui', pop: 5500000, area: 622984, gdp: 2.7, currency: 'Franc CFA', borders: ['td', 'sd', 'ss', 'cd', 'cg', 'cm'] },
  sz: { capital: 'Mbabane', pop: 1200000, area: 17364, gdp: 5, currency: 'Lilangeni', borders: ['za', 'mz'] },
  ls: { capital: 'Maseru', pop: 2300000, area: 30355, gdp: 2.5, currency: 'Loti', borders: ['za'] },
  lr: { capital: 'Monrovia', pop: 5300000, area: 111369, gdp: 4.3, currency: 'Dollar libérien', borders: ['sl', 'gn', 'ci'] },
  sl: { capital: 'Freetown', pop: 8600000, area: 71740, gdp: 4, currency: 'Leone', borders: ['gn', 'lr'] },
};

const continentMap = {
  // Europe
  al: 'Europe', de: 'Europe', ad: 'Europe', at: 'Europe', be: 'Europe', by: 'Europe', ba: 'Europe', bg: 'Europe', cy: 'Europe', hr: 'Europe', dk: 'Europe', es: 'Europe', ee: 'Europe', fi: 'Europe', fr: 'Europe', gr: 'Europe', hu: 'Europe', ie: 'Europe', is: 'Europe', it: 'Europe', li: 'Europe', lt: 'Europe', lu: 'Europe', lv: 'Europe', mk: 'Europe', mt: 'Europe', md: 'Europe', mc: 'Europe', me: 'Europe', no: 'Europe', nl: 'Europe', pl: 'Europe', pt: 'Europe', cz: 'Europe', ro: 'Europe', gb: 'Europe', ru: 'Europe', sm: 'Europe', rs: 'Europe', sk: 'Europe', si: 'Europe', se: 'Europe', ch: 'Europe', ua: 'Europe', va: 'Europe',
  // Amériques
  ag: 'Amériques', ar: 'Amériques', bs: 'Amériques', bb: 'Amériques', bz: 'Amériques', bo: 'Amériques', br: 'Amériques', ca: 'Amériques', cl: 'Amériques', co: 'Amériques', cr: 'Amériques', cu: 'Amériques', dm: 'Amériques', ec: 'Amériques', us: 'Amériques', gd: 'Amériques', gt: 'Amériques', gy: 'Amériques', ht: 'Amériques', hn: 'Amériques', jm: 'Amériques', mx: 'Amériques', ni: 'Amériques', pa: 'Amériques', py: 'Amériques', pe: 'Amériques', do: 'Amériques', kn: 'Amériques', lc: 'Amériques', vc: 'Amériques', sv: 'Amériques', sr: 'Amériques', tt: 'Amériques', uy: 'Amériques', ve: 'Amériques',
  // Asie
  af: 'Asie', sa: 'Asie', am: 'Asie', az: 'Asie', bh: 'Asie', bd: 'Asie', bt: 'Asie', mm: 'Asie', bn: 'Asie', kh: 'Asie', cn: 'Asie', kp: 'Asie', kr: 'Asie', ae: 'Asie', ge: 'Asie', in: 'Asie', id: 'Asie', iq: 'Asie', ir: 'Asie', il: 'Asie', jp: 'Asie', jo: 'Asie', kz: 'Asie', kg: 'Asie', kw: 'Asie', la: 'Asie', lb: 'Asie', my: 'Asie', mv: 'Asie', mn: 'Asie', np: 'Asie', om: 'Asie', uz: 'Asie', pk: 'Asie', ps: 'Asie', ph: 'Asie', qa: 'Asie', sg: 'Asie', lk: 'Asie', sy: 'Asie', tj: 'Asie', th: 'Asie', tl: 'Asie', tm: 'Asie', tr: 'Asie', vn: 'Asie', ye: 'Asie',
  // Afrique
  za: 'Afrique', dz: 'Afrique', ao: 'Afrique', bj: 'Afrique', bw: 'Afrique', bf: 'Afrique', bi: 'Afrique', cm: 'Afrique', cv: 'Afrique', cf: 'Afrique', km: 'Afrique', cg: 'Afrique', cd: 'Afrique', ci: 'Afrique', dj: 'Afrique', eg: 'Afrique', er: 'Afrique', sz: 'Afrique', et: 'Afrique', ga: 'Afrique', gm: 'Afrique', gh: 'Afrique', gn: 'Afrique', gw: 'Afrique', gq: 'Afrique', ke: 'Afrique', ls: 'Afrique', lr: 'Afrique', ly: 'Afrique', mg: 'Afrique', mw: 'Afrique', ml: 'Afrique', ma: 'Afrique', mu: 'Afrique', mr: 'Afrique', mz: 'Afrique', na: 'Afrique', ne: 'Afrique', ng: 'Afrique', ug: 'Afrique', rw: 'Afrique', st: 'Afrique', sn: 'Afrique', sc: 'Afrique', sl: 'Afrique', so: 'Afrique', sd: 'Afrique', ss: 'Afrique', tz: 'Afrique', td: 'Afrique', tg: 'Afrique', tn: 'Afrique', zm: 'Afrique', zw: 'Afrique',
  // Océanie
  au: 'Océanie', fj: 'Océanie', ki: 'Océanie', mh: 'Océanie', fm: 'Océanie', nr: 'Océanie', nz: 'Océanie', pw: 'Océanie', pg: 'Océanie', sb: 'Océanie', ws: 'Océanie', to: 'Océanie', tv: 'Océanie', vu: 'Océanie',
};

// Fusion de toutes les données pour les 195 pays
const result = countries.map((c) => {
  const custom = enrichedData[c.code] || defaultTier4[c.code] || {
    capital: c.name,
    pop: 5000000,
    area: 100000,
    gdp: 20,
    currency: 'Monnaie locale',
    tier: 4,
    borders: [],
  };

  const tier = custom.tier || 4;
  const cities = custom.cities || [];
  const borders = custom.borders || [];
  const continent = continentMap[c.code] || 'Monde';
  // Calcul du PIB par habitant en dollars ($)
  const gdpPerCapita = Math.round((custom.gdp * 1000000000) / custom.pop);

  return {
    code: c.code,
    name: c.name,
    capital: custom.capital,
    population: custom.pop,
    area: custom.area,
    gdp: custom.gdp,
    gdpPerCapita,
    currency: custom.currency,
    tier,
    continent,
    cities,
    borders,
    isIsland: tier === 5 || borders.length === 0,
  };
});

// Écriture du fichier final
const fileContent = `/**
 * Données enrichies des 195 pays pour le Mode Avancé (Survie & Culture).
 * tier : 1 (Frontaliers), 2 (Europe), 3 (Occidentaux/Grands), 4 (Autres continentaux), 5 (Îles)
 */
export const advancedCountries = ${JSON.stringify(result, null, 2)};

export const FRANCE_REFERENCE = {
  code: 'fr',
  name: 'France',
  area: 551695,
  gdp: 3000,
  population: 68000000,
  gdpPerCapita: 44100, // ~44 100 $ / habitant
};

export default advancedCountries;
`;

const outputPath = path.join(__dirname, '../src/data/advancedCountries.js');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Fichier advancedCountries.js généré avec succès (${result.length} pays).`);
