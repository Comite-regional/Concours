const BASE = process.env.FFTA_ENV === "pprod"
  ? "https://pprod-extranet.ffta.fr"
  : "https://extranet.ffta.fr";

const SESSION_IDENTITE = process.env.FFTA_SESSION_IDENTITE ?? "";
const REGION_CODE = process.env.FFTA_REGION ?? "CR12";

const HEADERS = {
  accept: "application/json, */*;q=0.1",
  "accept-language": "fr-FR,fr;q=0.9",
  "user-agent": "Mozilla/5.0",
};

// Token cache (server-side, in-memory, 55min TTL)
let _tokenCache: { token: string; expiresAt: number } | null = null;

function getParisTsString(offsetMin = 0): string {
  const d = new Date(Date.now() + offsetMin * 60000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.year}${p.month}${p.day}${hh}${p.minute}`;
}

async function fetchToken(): Promise<string> {
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) return _tokenCache.token;

  const offsets = [0, 1, 2, -1, -2, 3, -3, 4, -4, 5, -5];
  const paths = [
    "/ws/rest/Parametres/GetToken",
    "/ws/rest/ApplicationTierce/GetToken",
  ];

  for (const delta of offsets) {
    const pw = getParisTsString(delta);
    const qs = `sessionIdentite=${encodeURIComponent(SESSION_IDENTITE)}&password=${pw}&format=json`;
    for (const path of paths) {
      try {
        const res = await fetch(`${BASE}${path}?${qs}`, { headers: HEADERS, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const resp = data?.Response ?? data;
          const token = resp?.Token ?? resp?.token ?? data?.Token ?? data?.token ?? "";
          if (token) {
            _tokenCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
            return token;
          }
        }
      } catch {
        // try next
      }
    }
  }
  throw new Error("Impossible d'obtenir un token FFTA");
}

function decodeHtml(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeItem(item: any): any {
  return Object.fromEntries(
    Object.entries(item).map(([k, v]) => [k, typeof v === "string" ? decodeHtml(v) : v])
  );
}

function buildQs(params: Record<string, string | number | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

// ── Calendrier / concours à venir ───────────────────────────────────────────

export interface ConcoursBrut {
  EprvId: string;
  EprvNom: string;
  EprvDateDebut: string;
  EprvDateFin: string;
  EprvLieu: string;
  EprvEtatCode: string;
  EprvChampNiv: string;
  EprvChampionnatType: string | null;
  DisciplineCode: string;
  EprvType: string;
  SaisonAnnee: string;
  LigueCode: string;
  LigueNom: string | null;
  DepartementCode: string;
  DepartementNom: string | null;
  StructureCode: string;
  StructureNom: string;
  AdresseCodePostal: string;
  AdresseCommune: string;
  AdresseLatitude: string;
  AdresseLongitude: string;
  ContactsAdresseMail: string;
  ContactsAdrWeb: string;
  Distinction: string;
  Documents: { DocTitre: string; DocUrl: string; DocDate: string }[] | null;
  Pdf: string | null;
}

export async function getConcours(saison?: string): Promise<ConcoursBrut[]> {
  const token = await fetchToken();
  const today = new Date();
  const year = saison ?? String(today.getFullYear());
  const dateFin = `31/12/${year}`;
  const today_fr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  const all: ConcoursBrut[] = [];
  let page = 1;

  while (true) {
    const qs = buildQs({
      token,
      format: "json",
      ChxLigue: REGION_CODE,
      ChxDateDebut: today_fr,
      ChxDateFin: dateFin,
      NbParPage: "200",
      Page: String(page),
    });
    const res = await fetch(`${BASE}/ws/rest/Calendrier/GetEpreuves?${qs}`, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const data = await res.json();
    const resp = data?.Response ?? data;
    const items: ConcoursBrut[] = resp?.tEpreuves ?? [];
    if (!items.length) break;
    all.push(...items.filter((e) => e.EprvEtatCode !== "X").map(decodeItem));
    const derniere = Number(resp?.DernierePage ?? page);
    if (page >= derniere) break;
    page++;
  }

  return all.sort((a, b) => a.EprvDateDebut.localeCompare(b.EprvDateDebut));
}

export async function getChampsNationaux(saison?: string): Promise<ConcoursBrut[]> {
  const token = await fetchToken();
  const today = new Date();
  const year = saison ?? String(today.getFullYear());
  const dateFin = `31/12/${year}`;
  const today_fr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  const all: ConcoursBrut[] = [];
  let page = 1;

  while (page <= 20) {
    const qs = buildQs({
      token,
      format: "json",
      ChxNiveauChampionnat: "N",
      ChxDateDebut: today_fr,
      ChxDateFin: dateFin,
      NbParPage: "50",
      Page: String(page),
    });
    const res = await fetch(`${BASE}/ws/rest/Calendrier/GetEpreuves?${qs}`, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const data = await res.json();
    const resp = data?.Response ?? data;
    const items: ConcoursBrut[] = resp?.tEpreuves ?? [];
    if (!items.length) break;
    all.push(...items.filter((e) => e.EprvEtatCode !== "X" && e.EprvChampNiv === "N").map(decodeItem));
    const derniere = Number(resp?.DernierePage ?? page);
    if (page >= derniere) break;
    page++;
  }

  return all.sort((a, b) => a.EprvDateDebut.localeCompare(b.EprvDateDebut));
}

// ── Résultats / épreuves passées ────────────────────────────────────────────

export interface EpreuveResultat {
  EprvId: string;
  EprvNom: string;
  EprvDateDebut: string;
  EprvDateFin: string;
  EprvLieu: string;
  EprvEtat: string;
  Discipline: string;
  EprvType: string;
  SaisonAnnee: string;
  LigueCode: string;
  LigueNom: string | null;
  DepartementCode: string;
  StructureNom: string;
  NbResultats: string;
  ChampionnatLibelle: string;
  EprvChampNiv: string;
  EprvChampionnatType: string;
}

export async function getEpreuvesPassees(saison?: string): Promise<EpreuveResultat[]> {
  const token = await fetchToken();
  const year = saison ?? String(new Date().getFullYear());
  const dateDebut = `01/09/${Number(year) - 1}`;
  const dateFin = `31/08/${year}`;

  const qs = buildQs({
    token,
    format: "json",
    TypeStructure: "LIG",
    NumAffiliation: REGION_CODE,
    Saison: year,
    DateDebut: dateDebut,
    DateFin: dateFin,
  });

  const res = await fetch(`${BASE}/ws/rest/Resultats/ChercherEpreuves?${qs}`, {
    headers: HEADERS,
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const resp = data?.Response ?? data;
  return (resp?.EpreuvesArray ?? []).map(decodeItem);
}

// ── Résultats détaillés d'une épreuve ───────────────────────────────────────

export interface ClassementResultat {
  libelle: string;
  participants: ParticipantResultat[];
}

export interface ParticipantResultat {
  Nom: string;
  Club: string;
  LicenceCode: string;
  Categorie: string;
  SCORE_TOTAL: string;
  PLACE_QUALIF: string;
  PLACE_DEF: string;
  SCORE_DIST1: string;
  SCORE_DIST2: string;
  DIX: string;
  NEUF: string;
}

export interface ResultatEpreuve {
  EprvId: string;
  EprvNom: string;
  EprvDateDebut: string;
  EprvLieu: string;
  Discipline: string;
  Classements: ClassementResultat[];
}

export async function getResultatEpreuve(
  eprvId: string,
  numAffiliation = REGION_CODE
): Promise<ResultatEpreuve | null> {
  const token = await fetchToken();
  const qs = buildQs({
    token,
    format: "json",
    EprvId: eprvId,
    TypeStructure: "LIG",
    NumAffiliation: numAffiliation,
  });

  const res = await fetch(`${BASE}/ws/rest/Resultats/ResultatsParEpreuve?${qs}`, {
    headers: HEADERS,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const resp = data?.Response ?? data;
  const items = (resp?.ResultatsArray ?? []).map(decodeItem);
  return items[0] ?? null;
}
