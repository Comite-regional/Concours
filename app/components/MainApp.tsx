"use client";

import { useState } from "react";
import ConcoursView from "./ConcoursView";
import ResultatsView from "./ResultatsView";

type Tab = "concours" | "resultats";

export default function MainApp() {
  const [tab, setTab] = useState<Tab>("concours");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(1000px 600px at 20% 0%, rgba(14,116,144,.08), transparent 55%), radial-gradient(1200px 700px at 80% 10%, rgba(59,130,246,.08), transparent 60%), #eef3fb" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0b3b63, #0f4b7f)", boxShadow: "0 18px 45px rgba(2,8,23,.25)" }} className="sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">🏹</div>
            <div>
              <div className="text-white font-black text-sm leading-tight">Comité Régional</div>
              <div className="text-blue-200 text-xs font-semibold">Pays de la Loire</div>
            </div>
          </div>

          <nav className="flex gap-3 flex-1 justify-center">
            {([
              { id: "concours", label: "Concours à venir", icon: "📅" },
              { id: "resultats", label: "Résultats", icon: "🏆" },
            ] as { id: Tab; label: string; icon: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  tab === t.id
                    ? "bg-white/20 border-white/40 text-white shadow-lg"
                    : "bg-white/8 border-white/15 text-white/75 hover:bg-white/12 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === "concours" && <ConcoursView />}
        {tab === "resultats" && <ResultatsView />}
      </div>
    </div>
  );
}
