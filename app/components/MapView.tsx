"use client";

import { useEffect, useRef, useState } from "react";
import type { ConcoursBrut } from "@/lib/ffta";

const DISC_COLORS: Record<string, string> = {
  "Tir à l'Arc Extérieur": "#f3d1ab",
  "Tir en Salle":           "#c9d4ea",
  "Tir en Campagne":        "#1a1a1a",
  "Tir 3D":                 "#e3cdb7",
  "Tir Nature":             "#d7ddc9",
  "Tir Beursault":          "#222",
  "Jeunes":                 "#e2d5ff",
  "Loisirs":                "#f2c6ea",
};

function parseDateFR(s: string) {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10));
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return null;
}

function fmtDate(s: string) {
  const d = parseDateFR(s);
  return d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : s;
}

interface Props { items: ConcoursBrut[]; onOpen: (c: ConcoursBrut) => void; }

export default function MapView({ items, onOpen }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<import("leaflet").Map | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(50);

  const withGps = items.filter((c) => {
    const lat = parseFloat(c.AdresseLatitude);
    const lon = parseFloat(c.AdresseLongitude);
    return isFinite(lat) && isFinite(lon) && lat !== 0 && lon !== 0;
  });

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    import("leaflet").then((L) => {
      // Fix default icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

      const map = L.map(mapRef.current!);
      leafletRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);

      if (withGps.length) {
        const lats = withGps.map((c) => parseFloat(c.AdresseLatitude));
        const lons = withGps.map((c) => parseFloat(c.AdresseLongitude));
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
        map.setView([avgLat, avgLon], 8);
      } else {
        map.setView([47.4, -0.5], 7);
      }

      withGps.forEach((c) => {
        const lat = parseFloat(c.AdresseLatitude);
        const lon = parseFloat(c.AdresseLongitude);
        const color = DISC_COLORS[c.DisciplineCode] ?? "#64748b";
        const marker = L.circleMarker([lat, lon], { radius: 8, fillColor: color, color: "#1e3a5f", weight: 2, fillOpacity: 0.9 }).addTo(map);
        const dateStr = c.EprvDateDebut === c.EprvDateFin ? fmtDate(c.EprvDateDebut) : `${fmtDate(c.EprvDateDebut)} → ${fmtDate(c.EprvDateFin)}`;
        marker.bindPopup(`<b>${c.EprvNom}</b><br/>${c.EprvLieu ?? c.AdresseCommune ?? ""}<br/><small>${dateStr}</small>`);
        marker.on("click", () => onOpen(c));
      });
    });
    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserPos([pos.coords.latitude, pos.coords.longitude]);
    });
  }

  const nearby = userPos
    ? withGps.filter((c) => {
        const lat = parseFloat(c.AdresseLatitude);
        const lon = parseFloat(c.AdresseLongitude);
        const R = 6371;
        const dLat = ((lat - userPos[0]) * Math.PI) / 180;
        const dLon = ((lon - userPos[1]) * Math.PI) / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
        return 2*R*Math.asin(Math.sqrt(a)) <= radius;
      }).sort((a, b) => {
        const dist = (c: ConcoursBrut) => {
          const lat = parseFloat(c.AdresseLatitude), lon = parseFloat(c.AdresseLongitude);
          const R = 6371, dLat = ((lat - userPos![0]) * Math.PI) / 180, dLon = ((lon - userPos![1]) * Math.PI) / 180;
          const aa = Math.sin(dLat/2)**2 + Math.cos(userPos![0]*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
          return 2*R*Math.asin(Math.sqrt(aa));
        };
        return dist(a) - dist(b);
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 p-4">
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <button
            onClick={locate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            📍 Me localiser
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-semibold">Rayon :</span>
            <input type="range" min={10} max={300} step={10} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-32" />
            <span className="font-bold text-gray-700 w-14">{radius} km</span>
          </div>
          {userPos && <span className="text-xs text-gray-400">{nearby.length} concours dans ce rayon</span>}
        </div>

        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 380 }} />
      </div>

      {userPos && nearby.length > 0 && (
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 p-4">
          <h3 className="font-black text-gray-700 mb-3 text-sm uppercase tracking-wide">Concours proches</h3>
          <div className="space-y-2">
            {nearby.slice(0, 10).map((c) => {
              const lat = parseFloat(c.AdresseLatitude), lon = parseFloat(c.AdresseLongitude);
              const R = 6371, dLat = ((lat - userPos[0]) * Math.PI) / 180, dLon = ((lon - userPos[1]) * Math.PI) / 180;
              const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2;
              const km = Math.round(2*R*Math.asin(Math.sqrt(a)));
              return (
                <div key={c.EprvId} onClick={() => onOpen(c)} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{c.EprvNom}</div>
                    <div className="text-xs text-gray-400">{fmtDate(c.EprvDateDebut)} · {c.EprvLieu ?? c.AdresseCommune}</div>
                  </div>
                  <span className="text-xs font-black text-blue-600 shrink-0">{km} km</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
