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
  "Tir à l'Arc Extérieur":         { bg: "#faef00", text: "#333" },
  "Tir en Salle":                   { bg: "#c9d4ea", text: "#0b1b3a" },
  "Tir en Campagne":                { bg: "#1a1a1a", text: "#f2c200" },
  "Tir 3D":                         { bg: "#e3cdb7", text: "#3a2414" },
  "Tir Nature":                     { bg: "#d7ddc9", text: "#2c3b22" },
  "Tir Beursault":                  { bg: "#111",    text: "#fff" },
  "Jeunes":                         { bg: "#e2d5ff", text: "#3a1c6b" },
  "Loisirs":                        { bg: "#f2c6ea", text: "#6b004e" },
  "Loisirs Confirmé":               { bg: "#f2c6ea", text: "#6b004e" },
  "Loisirs Débutant":               { bg: "#f2c6ea", text: "#6b004e" },
  "Loisirs Débutant et confirmé":   { bg: "#f2c6ea", text: "#6b004e" },
  "Para-tir à l'arc en extérieur":  { bg: "#fde68a", text: "#78350f" },
};

export default function ResultatsView() {
  const [epreuves, setEpreuves] = useState<EpreuveResultat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saison, setSaison] = useState(String(new Date().getFullYear()));
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ResultatEpreuve | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOpen(null);
    setDetail(null);
    fetch(`/api/ffta/resultats?saison=${saison}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setEpreuves(j.data); else setError(j.error); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [saison]);

  function toggleEpreuve(id: string) {
    if (open === id) { setOpen(null); setDetail(null); return; }
    setOpen(id);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/ffta/resultat/${id}`)
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

      {/* Cartes épreuves */}
      <div className="space-y-2">
        {epreuves.map((e) => {
          const disc = DISC_COLORS[e.Discipline];
          const isOpen = open === e.EprvId;
          return (
            <div key={e.EprvId} className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-white/60 overflow-hidden">
              {/* En-tête de la carte */}
              <button
                onClick={() => toggleEpreuve(e.EprvId)}
                className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Bande colorée gauche */}
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: disc?.bg ?? "#e2e8f0" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {e.Discipline && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={disc ? { background: disc.bg, color: disc.text } : { background: "#e2e8f0", color: "#334155" }}
                        >
                          {e.Discipline}
                        </span>
                      )}
                      {Number(e.NbResultats) > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {e.NbResultats} résultat{Number(e.NbResultats) > 1 ? "s" : ""}
                        </span>
                      )}
                      {e.EprvChampNiv && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {e.EprvChampNiv === "D" ? "Départemental" : e.EprvChampNiv === "R" ? "Régional" : e.EprvChampNiv === "N" ? "National" : e.EprvChampNiv}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-gray-900 leading-snug">{e.EprvNom}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {fmtDate(e.EprvDateDebut)}
                      {e.EprvDateFin && e.EprvDateFin !== e.EprvDateDebut ? ` → ${fmtDate(e.EprvDateFin)}` : ""}
                      {e.EprvLieu ? ` · ${e.EprvLieu}` : ""}
                      {e.StructureNom ? ` — ${e.StructureNom}` : ""}
                    </p>
                  </div>
                  <span
                    className="text-gray-400 text-xl shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                  >›</span>
                </div>
              </button>

              {/* Détail : tableau des résultats */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {detailLoading && (
                    <div className="flex items-center justify-center gap-2 p-6 text-gray-400 text-sm">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      Chargement des classements…
                    </div>
                  )}
                  {!detailLoading && !detail && (
                    <div className="p-4 text-sm text-gray-400 text-center">Résultats non disponibles.</div>
                  )}
                  {!detailLoading && detail && detail.Classements.length > 0 && (
                    <div className="p-4 space-y-6">
                      {detail.Classements.map((cl, i) => (
                        <div key={i}>
                          <h4 className="font-bold text-gray-600 text-xs uppercase tracking-wide mb-2">{cl.libelle}</h4>
                          <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                <tr>
                                  <th className="px-3 py-2 text-left w-10">Pl.</th>
                                  <th className="px-3 py-2 text-left">Archer</th>
                                  <th className="px-3 py-2 text-left">Club</th>
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
                                      <td className="px-3 py-2.5 text-gray-500 text-xs">{p.Club}</td>
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
        })}
      </div>
    </div>
  );
}
