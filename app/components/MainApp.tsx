"use client";

import { useState } from "react";
import ConcoursView from "./ConcoursView";
import ResultatsView from "./ResultatsView";

type Tab = "concours" | "resultats";

export default function MainApp() {
  const [tab, setTab] = useState<Tab>("concours");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(1000px 600px at 20% 0%, rgba(14,116,144,.08), transparent 55%), radial-gradient(1200px 700px at 80% 10%, rgba(59,130,246,.08), transparent 60%), #eef3fb" }}>
      {/* Onglets */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 py-2">
          {([
            { id: "concours", label: "Concours à venir", icon: "📅" },
            { id: "resultats", label: "Résultats", icon: "🏆" },
          ] as { id: Tab; label: string; icon: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                tab === t.id
                  ? "bg-blue-600 border-blue-600 text-white shadow"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === "concours" && <ConcoursView />}
        {tab === "resultats" && <ResultatsView />}
      </div>
    </div>
  );
}
