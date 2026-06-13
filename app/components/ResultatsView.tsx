"use client";

import { useEffect, useState } from "react";
import type { EpreuveResultat, ResultatEpreuve } from "@/lib/ffta";

function parseFR(s: string): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10));
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}

function fmtDate(s: string) {
  const d = parseFR(s);
  return d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : s;
}

const DISC_COLORS: Record<string, { bg: string; text: string }> = {
  "Tir à l'Arc Extérieur": { bg: "#f3d1ab", text: "#111" },
  "Tir en Salle":           { bg: "#c9d4ea", text: "#0b1b3a" },
  "Tir en Campagne":        { bg: "#1a1a1a", text: "#f2c200" },
  "Tir 3D":                 { bg: "#e3cdb7", text: "#3a2414" },
  "Tir Nature":             { bg: "#d7ddc9", text: "#2c3b22" },
  "Tir Beursault":          { bg: "#111",    text: "#fff" },
  "Jeunes":                 { bg: "#e2d5ff", text: "#3a1c6b" },
  "Loisirs":                { bg: "#f2c6ea", text: "#6b004e" },
};

export default function ResultatsView() {
  const [epreuves, setEpreuves] = useState<EpreuveResultat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saison, setSaison] = useState(String(new Date().getFullYear()));
  const [selected, setSelected] = useState<EpreuveResultat | null>(null);
  const [detail, setDetail] = useState<ResultatEpreuve | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setDetail(null);
    fetch(`/api/ffta/resultats?saison=${saison}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setEpreuves(j.data); else setError(j.error); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [saison]);

  function selectEpreuve(e: EpreuveResultat) {
    if (selected?.EprvId === e.EprvId) { setSelected(null); setDetail(null); return; }
    setSelected(e);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/ffta/resultat/${e.EprvId}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setDetail(j.data); })
      .finally(() => setDetailLoading(false));
  }

  const currentYear = new Date().getFullYear();
  const saisons = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 p-4 flex items-center gap-4 flex-wrap">
        <h2 className="font-black text-gray-800 text-lg flex-1">Résultats des épreuves</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Saison</label>
          <select
            value={saison}
            onChange={(e) => setSaison(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {saisons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {!loading && <span className="text-xs text-gray-400">{epreuves.length} épreuve{epreuves.length > 1 ? "s" : ""}</span>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement des résultats…</p>
        </div>
      )}

      {!loading && !error && epreuves.length === 0 && (
        <div className="text-center py-16 text-gray-400">Aucun résultat trouvé pour cette saison.</div>
      )}

      {/* Tableau des épreuves */}
      {!loading && epreuves.length > 0 && (
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Épreuve</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Lieu</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Discipline</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Résultats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {epreuves.map((e) => {
                const disc = DISC_COLORS[e.Discipline];
                const isSelected = selected?.EprvId === e.EprvId;
                return (
                  <tr
                    key={e.EprvId}
                    onClick={() => selectEpreuve(e)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50/80"}`}
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(e.EprvDateDebut)}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{e.EprvNom}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{e.EprvLieu || e.StructureNom}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {e.Discipline && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={disc ? { background: disc.bg, color: disc.text } : { background: "#e2e8f0", color: "#334155" }}
                        >
                          {e.Discipline}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${Number(e.NbResultats) > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {e.NbResultats || "0"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Détail de l'épreuve sélectionnée */}
      {selected && (
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-black text-gray-900 text-lg">{selected.EprvNom}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {fmtDate(selected.EprvDateDebut)}
                {selected.EprvDateFin && selected.EprvDateFin !== selected.EprvDateDebut ? ` → ${fmtDate(selected.EprvDateFin)}` : ""}
                {selected.EprvLieu ? ` · ${selected.EprvLieu}` : ""}
              </p>
            </div>
            <button onClick={() => { setSelected(null); setDetail(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold shrink-0">×</button>
          </div>

          {detailLoading && (
            <div className="flex items-center justify-center gap-2 p-8 text-gray-400 text-sm">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              Chargement des classements…
            </div>
          )}

          {!detailLoading && !detail && (
            <div className="p-8 text-center text-gray-400 text-sm">Résultats non disponibles pour cette épreuve.</div>
          )}

          {!detailLoading && detail && detail.Classements.length > 0 && (
            <div className="p-4 space-y-6">
              {detail.Classements.map((cl, i) => (
                <div key={i}>
                  <h4 className="font-black text-gray-700 text-sm mb-2 uppercase tracking-wide">{cl.libelle}</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">Pl.</th>
                          <th className="px-3 py-2 text-left">Archer</th>
                          <th className="px-3 py-2 text-left hidden sm:table-cell">Club</th>
                          <th className="px-3 py-2 text-left">Cat.</th>
                          <th className="px-3 py-2 text-right">S1</th>
                          <th className="px-3 py-2 text-right">S2</th>
                          <th className="px-3 py-2 text-right font-black">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {cl.participants.map((p, j) => {
                          const place = Number(p.PLACE_DEF) || Number(p.PLACE_QUALIF) || (j + 1);
                          const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : null;
                          return (
                            <tr key={j} className={place <= 3 ? "bg-amber-50/40" : "hover:bg-gray-50/50"}>
                              <td className="px-3 py-2.5 font-black text-gray-700">{medal ?? place}</td>
                              <td className="px-3 py-2.5 font-semibold text-gray-900">{p.Nom}</td>
                              <td className="px-3 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{p.Club}</td>
                              <td className="px-3 py-2.5 text-gray-400 text-xs">{p.Categorie}</td>
                              <td className="px-3 py-2.5 text-right text-gray-500">{p.SCORE_DIST1 !== "0" ? p.SCORE_DIST1 : "—"}</td>
                              <td className="px-3 py-2.5 text-right text-gray-500">{p.SCORE_DIST2 !== "0" ? p.SCORE_DIST2 : "—"}</td>
                              <td className="px-3 py-2.5 text-right font-black text-gray-900">{p.SCORE_TOTAL}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
