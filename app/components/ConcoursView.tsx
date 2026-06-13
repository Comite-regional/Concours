"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { ConcoursBrut } from "@/lib/ffta";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="h-72 flex items-center justify-center text-gray-400">Chargement de la carte…</div> });

// ── Discipline colors ────────────────────────────────────────────────────────
const DISC_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  "Tir à l'Arc Extérieur":       { bg: "#faef00", text: "#333",    badge: "Extérieur" },
  "Tir en Salle":                 { bg: "#c9d4ea", text: "#0b1b3a", badge: "Salle" },
  "Tir en Campagne":              { bg: "#1a1a1a", text: "#f2c200", badge: "Campagne" },
  "Tir 3D":                       { bg: "#e3cdb7", text: "#3a2414", badge: "3D" },
  "Tir Nature":                   { bg: "#d7ddc9", text: "#2c3b22", badge: "Nature" },
  "Tir Beursault":                { bg: "#111",    text: "#fff",    badge: "Beursault" },
  "Jeunes":                       { bg: "#e2d5ff", text: "#3a1c6b", badge: "Jeunes" },
  "Loisirs":                      { bg: "#f2c6ea", text: "#6b004e", badge: "Loisirs" },
  "Loisirs Confirmé":             { bg: "#f2c6ea", text: "#6b004e", badge: "Loisirs" },
  "Loisirs Débutant":             { bg: "#f2c6ea", text: "#6b004e", badge: "Loisirs" },
  "Loisirs Débutant et confirmé": { bg: "#f2c6ea", text: "#6b004e", badge: "Loisirs" },
  "Para-tir à l'arc en extérieur": { bg: "#fde68a", text: "#78350f", badge: "Para" },
};

// Disciplines regroupées pour le filtre (badge → liste de codes)
const DISC_GROUPS: Record<string, string[]> = {
  "Extérieur":  ["Tir à l'Arc Extérieur"],
  "Salle":      ["Tir en Salle"],
  "Campagne":   ["Tir en Campagne"],
  "3D":         ["Tir 3D"],
  "Nature":     ["Tir Nature"],
  "Beursault":  ["Tir Beursault"],
  "Jeunes":     ["Jeunes"],
  "Loisirs":    ["Loisirs", "Loisirs Confirmé", "Loisirs Débutant", "Loisirs Débutant et confirmé"],
  "Para":       ["Para-tir à l'arc en extérieur"],
};

function discStyle(code: string) {
  return DISC_COLORS[code] ?? { bg: "#e2e8f0", text: "#334155", badge: code };
}

function matchesDiscFilter(disciplineCode: string, filter: string): boolean {
  if (filter === "Tous") return true;
  const group = DISC_GROUPS[filter];
  if (group) return group.includes(disciplineCode);
  return disciplineCode === filter;
}

function parseDateFR(s: string): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10));
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}

function fmtDate(s: string) {
  const d = parseDateFR(s);
  if (!d) return s;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getMandat(c: ConcoursBrut): string {
  const docs = c.Documents ?? [];
  if (docs.length) {
    const u = docs[0].DocUrl ?? "";
    return u.startsWith("http") ? u : `https://www.ffta.fr${u}`;
  }
  return c.Pdf ?? "";
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ConcoursView() {
  const [concours, setConcours] = useState<ConcoursBrut[]>([]);
  const [champsNationaux, setChampsNationaux] = useState<ConcoursBrut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Filters
  const [query, setQuery] = useState("");
  const [discFilter, setDiscFilter] = useState("Tous");
  const [deptFilter, setDeptFilter] = useState("Tous");

  // Modal
  const [modal, setModal] = useState<ConcoursBrut | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ffta/concours").then((r) => r.json()),
      fetch("/api/ffta/champsfrance").then((r) => r.json()),
    ]).then(([jc, jn]) => {
      if (jc.ok) setConcours(jc.data);
      else setError(jc.error);
      if (jn.ok) setChampsNationaux(jn.data);
    }).catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Groupes de disciplines présents dans les données
  const disciplines = useMemo(() => {
    const presentCodes = new Set(concours.map((c) => c.DisciplineCode).filter(Boolean));
    const presentGroups = Object.keys(DISC_GROUPS).filter((badge) =>
      DISC_GROUPS[badge].some((code) => presentCodes.has(code))
    );
    return ["Tous", ...presentGroups];
  }, [concours]);

  const depts = useMemo(() => {
    const s = new Set(concours.map((c) => c.DepartementCode?.slice(0, 2)).filter(Boolean));
    return ["Tous", ...Array.from(s).sort()];
  }, [concours]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return concours.filter((c) => {
      if (!matchesDiscFilter(c.DisciplineCode, discFilter)) return false;
      if (deptFilter !== "Tous" && !c.DepartementCode?.startsWith(deptFilter)) return false;
      if (q) {
        const hay = [c.EprvNom, c.EprvLieu, c.AdresseCommune, c.StructureNom, c.DisciplineCode].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [concours, query, discFilter, deptFilter]);

  const downloadICS = useCallback((c: ConcoursBrut) => {
    const start = parseDateFR(c.EprvDateDebut);
    const end = parseDateFR(c.EprvDateFin);
    if (!start) return;
    const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    const dtStart = fmt(start);
    const dtEnd = end ? fmt(new Date(end.getTime() + 86400000)) : fmt(new Date(start.getTime() + 86400000));
    const loc = [c.EprvLieu, c.AdresseCommune, c.AdresseCodePostal].filter(Boolean).join(" ");
    const esc = (s: string) => s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CR PDL//Concours//FR","CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${c.EprvId}@cr-pdl`,
      `DTSTAMP:${fmt(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${esc(c.EprvNom)}`,
      loc ? `LOCATION:${esc(loc)}` : "",
      "END:VEVENT","END:VCALENDAR"
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${c.EprvNom.replace(/[^\w]/g,"_").slice(0,50)}.ics`;
    a.click();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement des concours FFTA…</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
      <p className="font-semibold">Erreur de chargement</p>
      <p className="text-sm mt-1 opacity-75">{error}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Recherche</label>
            <input
              type="search"
              placeholder="Épreuve, ville, club…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Discipline</label>
            <select
              value={discFilter}
              onChange={(e) => setDiscFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {disciplines.map((d) => (
                <option key={d} value={d}>{d === "Tous" ? "Toutes" : d}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[110px]">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Département</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {(query || discFilter !== "Tous" || deptFilter !== "Tous") && (
            <button
              onClick={() => { setQuery(""); setDiscFilter("Tous"); setDeptFilter("Tous"); }}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <div className="ml-auto flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["list","map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === v ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                {v === "list" ? "Liste" : "Carte"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">{filtered.length} concours{filtered.length !== concours.length ? ` sur ${concours.length}` : ""}</p>
      </div>

      {/* Views */}
      {viewMode === "list" && <ListView items={filtered} nationaux={champsNationaux} onOpen={setModal} onICS={downloadICS} />}
      {viewMode === "map" && <MapView items={filtered} onOpen={setModal} />}

      {/* Modal */}
      {modal && <Modal concours={modal} onClose={() => setModal(null)} onICS={downloadICS} />}
    </div>
  );
}

function ChampsRegionauxCard({ c, onOpen, onICS }: { c: ConcoursBrut; onOpen: (c: ConcoursBrut) => void; onICS: (c: ConcoursBrut) => void }) {
  const ds = discStyle(c.DisciplineCode);
  const mandat = getMandat(c);
  const sameDay = c.EprvDateDebut === c.EprvDateFin || !c.EprvDateFin;
  const dateStr = sameDay ? fmtDate(c.EprvDateDebut) : `${fmtDate(c.EprvDateDebut)} → ${fmtDate(c.EprvDateFin)}`;

  return (
    <div
      onClick={() => onOpen(c)}
      className="regional-card regional-shimmer relative rounded-2xl cursor-pointer overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e1a5e 0%, #353089 50%, #1e1a5e 100%)", border: "2px solid #db2922" }}
    >
      {/* Red/blue top accent */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #db2922, #353089, #db2922, #353089, #db2922)" }} />
      <div className="p-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: ds.bg, color: ds.text }}>{ds.badge}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#db2922", color: "#fff" }}>🏹 Championnat Régional</span>
          </div>
          <h4 className="font-black leading-snug" style={{ color: "#ffffff" }}>{c.EprvNom}</h4>
          <p className="text-sm mt-0.5" style={{ color: "#a8b4e8" }}>
            {dateStr}{c.EprvLieu ? ` · ${c.EprvLieu}` : ""}
            {c.StructureNom ? ` — ${c.StructureNom}` : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onICS(c)}
            title="Ajouter au calendrier"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
            style={{ background: "rgba(219,41,34,0.2)", border: "1px solid rgba(219,41,34,0.4)" }}
          >📅</button>
          {mandat && (
            <a href={mandat} target="_blank" rel="noopener" title="Mandat"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
              style={{ background: "rgba(219,41,34,0.2)", border: "1px solid rgba(219,41,34,0.4)" }}
            >📄</a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

function ListView({ items, nationaux, onOpen, onICS }: { items: ConcoursBrut[]; nationaux: ConcoursBrut[]; onOpen: (c: ConcoursBrut) => void; onICS: (c: ConcoursBrut) => void }) {
  const natIds = new Set(nationaux.map((c) => c.EprvId));

  // Merge and sort by date
  const merged = [...items, ...nationaux.filter((c) => !items.some((r) => r.EprvId === c.EprvId))]
    .sort((a, b) => a.EprvDateDebut.localeCompare(b.EprvDateDebut));

  if (!merged.length) return <div className="text-center py-16 text-gray-400">Aucun concours pour ces filtres.</div>;

  // Group by month
  const groups = new Map<string, ConcoursBrut[]>();
  for (const c of merged) {
    const d = parseDateFR(c.EprvDateDebut);
    const key = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "?";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes glow-gold {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(250,215,0,0.4), 0 2px 12px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 0 18px 5px rgba(250,215,0,0.7), 0 4px 20px rgba(0,0,0,0.2); }
        }
        @keyframes glow-regional {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(219,41,34,0.4), 0 2px 12px rgba(53,48,137,0.3); }
          50% { box-shadow: 0 0 18px 5px rgba(219,41,34,0.65), 0 4px 20px rgba(53,48,137,0.5); }
        }
        .champ-card { animation: glow-gold 2.5s ease-in-out infinite; }
        .regional-card { animation: glow-regional 2.5s ease-in-out infinite; }
        .champ-shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,220,0.45) 50%, transparent 65%);
          background-size: 400px 100%;
          animation: shimmer 2.8s linear infinite;
          border-radius: inherit;
          pointer-events: none;
        }
        .regional-shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,200,200,0.25) 50%, transparent 65%);
          background-size: 400px 100%;
          animation: shimmer 3s linear infinite;
          border-radius: inherit;
          pointer-events: none;
        }
      `}</style>
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([key, list]) => {
          const d = parseDateFR(list[0].EprvDateDebut);
          return (
            <div key={key}>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 capitalize">
                {d ? monthFmt.format(d) : key}
              </h3>
              <div className="space-y-2">
                {list.map((c) =>
                  natIds.has(c.EprvId)
                    ? <ChampsNationauxCard key={c.EprvId} c={c} onOpen={onOpen} onICS={onICS} />
                    : (c.EprvChampNiv === "R" || /r[eé]gion/i.test(c.EprvNom))
                      ? <ChampsRegionauxCard key={c.EprvId} c={c} onOpen={onOpen} onICS={onICS} />
                      : <ConcoursCard key={c.EprvId} c={c} onOpen={onOpen} onICS={onICS} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChampsNationauxCard({ c, onOpen, onICS }: { c: ConcoursBrut; onOpen: (c: ConcoursBrut) => void; onICS: (c: ConcoursBrut) => void }) {
  const ds = discStyle(c.DisciplineCode);
  const mandat = getMandat(c);
  const sameDay = c.EprvDateDebut === c.EprvDateFin || !c.EprvDateFin;
  const dateStr = sameDay ? fmtDate(c.EprvDateDebut) : `${fmtDate(c.EprvDateDebut)} → ${fmtDate(c.EprvDateFin)}`;

  return (
    <div
      onClick={() => onOpen(c)}
      className="champ-card champ-shimmer relative rounded-2xl cursor-pointer overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1200 0%, #3d2e00 50%, #1a1200 100%)", border: "2px solid #f5d600" }}
    >
      <div style={{ height: 3, background: "linear-gradient(90deg, #b8860b, #fad700, #fff8c0, #fad700, #b8860b)" }} />
      <div className="p-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: ds.bg, color: ds.text }}>{ds.badge}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fad700", color: "#1a1200" }}>🇫🇷 Championnat de France</span>
          </div>
          <h4 className="font-black text-amber-100 leading-snug">{c.EprvNom}</h4>
          <p className="text-sm text-amber-300 mt-0.5">
            {dateStr}{c.EprvLieu ? ` · ${c.EprvLieu}` : ""}
            {c.StructureNom ? ` — ${c.StructureNom}` : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onICS(c)}
            title="Ajouter au calendrier"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
            style={{ background: "rgba(250,215,0,0.15)", border: "1px solid rgba(250,215,0,0.3)" }}
          >📅</button>
          {mandat && (
            <a href={mandat} target="_blank" rel="noopener" title="Mandat"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
              style={{ background: "rgba(250,215,0,0.15)", border: "1px solid rgba(250,215,0,0.3)" }}
            >📄</a>
          )}
        </div>
      </div>
    </div>
  );
}

function ConcoursCard({ c, onOpen, onICS }: { c: ConcoursBrut; onOpen: (c: ConcoursBrut) => void; onICS: (c: ConcoursBrut) => void }) {
  const ds = discStyle(c.DisciplineCode);
  const mandat = getMandat(c);
  const sameDay = c.EprvDateDebut === c.EprvDateFin || !c.EprvDateFin;
  const dateStr = sameDay
    ? fmtDate(c.EprvDateDebut)
    : `${fmtDate(c.EprvDateDebut)} → ${fmtDate(c.EprvDateFin)}`;

  return (
    <div
      onClick={() => onOpen(c)}
      className="bg-white/90 backdrop-blur rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      style={{ borderLeft: `5px solid ${ds.bg === "#000" || ds.bg === "#111" ? ds.text : ds.bg}` }}
    >
      <div className="p-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: ds.bg, color: ds.text }}
            >
              {ds.badge}
            </span>
            {c.DepartementCode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Dpt {c.DepartementCode.replace(/0+$/, "").slice(0, 2)}
              </span>
            )}
          </div>
          <h4 className="font-black text-gray-900 mt-1.5 leading-snug group-hover:text-blue-700 transition-colors">
            {c.EprvNom}
          </h4>
          <p className="text-sm text-gray-500 mt-0.5">
            {dateStr}{c.EprvLieu ? ` · ${c.EprvLieu}` : ""}
            {c.StructureNom ? ` — ${c.StructureNom}` : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onICS(c)}
            title="Ajouter au calendrier"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-blue-100 transition-colors text-sm"
          >📅</button>
          {mandat && (
            <a
              href={mandat}
              target="_blank"
              rel="noopener"
              title="Mandat"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-orange-100 transition-colors text-sm"
            >📄</a>
          )}
          {c.ContactsAdresseMail && c.EprvChampNiv !== "R" && (
            <a
              href={`mailto:${c.ContactsAdresseMail}?subject=Inscription - ${c.EprvNom}`}
              title="S'inscrire"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-green-100 transition-colors text-sm"
            >✉️</a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({ concours: c, onClose, onICS }: { concours: ConcoursBrut; onClose: () => void; onICS: (c: ConcoursBrut) => void }) {
  const ds = discStyle(c.DisciplineCode);
  const mandat = getMandat(c);
  const sameDay = c.EprvDateDebut === c.EprvDateFin || !c.EprvDateFin;
  const dateStr = sameDay ? fmtDate(c.EprvDateDebut) : `${fmtDate(c.EprvDateDebut)} → ${fmtDate(c.EprvDateFin)}`;
  const mapsQuery = [c.EprvLieu, c.AdresseCommune, c.AdresseCodePostal].filter(Boolean).join(" ");
  const lat = parseFloat(c.AdresseLatitude);
  const lon = parseFloat(c.AdresseLongitude);
  const mapsUrl = (isFinite(lat) && isFinite(lon) && lat !== 0)
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    : mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 font-bold">✕</button>
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: ds.bg, color: ds.text }}>{ds.badge}</span>
            {c.DepartementCode && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Dpt {c.DepartementCode.replace(/0+$/, "").slice(0,2)}</span>}
            {c.EprvChampNiv && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{c.EprvChampNiv}</span>}
          </div>
          <h2 className="text-xl font-black text-gray-900 leading-tight pr-10">{c.EprvNom}</h2>
          <p className="text-gray-500 text-sm mt-1">{dateStr}{c.EprvLieu ? ` · ${c.EprvLieu}` : ""}</p>
        </div>

        {/* Details */}
        <div className="px-6 pb-2 space-y-2 text-sm text-gray-600">
          {c.StructureNom && <div><span className="font-semibold text-gray-800">Club organisateur :</span> {c.StructureNom}</div>}
          {c.AdresseCommune && <div><span className="font-semibold text-gray-800">Lieu :</span> {[c.AdresseCommune, c.AdresseCodePostal].filter(Boolean).join(" ")}</div>}
          {c.ContactsAdresseMail && <div><span className="font-semibold text-gray-800">Contact :</span> <a href={`mailto:${c.ContactsAdresseMail}`} className="text-blue-600 hover:underline">{c.ContactsAdresseMail}</a></div>}
          {c.ContactsAdrWeb && <div><span className="font-semibold text-gray-800">Site :</span> <a href={c.ContactsAdrWeb} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate">{c.ContactsAdrWeb}</a></div>}
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 flex flex-wrap gap-2">
          <button onClick={() => onICS(c)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
            📅 Ajouter au calendrier
          </button>
          {mandat && (
            <a href={mandat} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              📄 Mandat
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              🧭 Itinéraire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
