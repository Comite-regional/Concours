"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { ConcoursBrut } from "@/lib/ffta";

const DISC_COLORS: Record<string, string> = {
  "Tir à l'Arc Extérieur":         "#f3d1ab",
  "Tir en Salle":                   "#c9d4ea",
  "Tir en Campagne":                "#1a1a1a",
  "Tir 3D":                         "#e3cdb7",
  "Tir Nature":                     "#d7ddc9",
  "Tir Beursault":                  "#111",
  "Jeunes":                         "#e2d5ff",
  "Loisirs":                        "#f2c6ea",
  "Loisirs Confirmé":               "#f2c6ea",
  "Loisirs Débutant":               "#f2c6ea",
  "Loisirs Débutant et confirmé":   "#f2c6ea",
  "Para-tir à l'arc en extérieur":  "#fde68a",
};
const DISC_TEXT: Record<string, string> = {
  "Tir à l'Arc Extérieur":         "#111",
  "Tir en Salle":                   "#0b1b3a",
  "Tir en Campagne":                "#f2c200",
  "Tir 3D":                         "#3a2414",
  "Tir Nature":                     "#2c3b22",
  "Tir Beursault":                  "#fff",
  "Jeunes":                         "#3a1c6b",
  "Loisirs":                        "#6b004e",
  "Loisirs Confirmé":               "#6b004e",
  "Loisirs Débutant":               "#6b004e",
  "Loisirs Débutant et confirmé":   "#6b004e",
  "Para-tir à l'arc en extérieur":  "#78350f",
};

function parseDateFR(s: string): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function addDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface Props {
  items: ConcoursBrut[];
  onOpen: (c: ConcoursBrut) => void;
}

export default function CalendarView({ items, onOpen }: Props) {
  const byId = Object.fromEntries(items.map((c) => [c.EprvId, c]));

  const events = items.map((c) => {
    const start = parseDateFR(c.EprvDateDebut);
    const endIso = parseDateFR(c.EprvDateFin);
    const end = endIso && endIso !== start ? addDay(endIso) : undefined;
    const bg = DISC_COLORS[c.DisciplineCode] ?? "#64748b";
    const color = DISC_TEXT[c.DisciplineCode] ?? "#fff";
    return {
      id: c.EprvId,
      title: c.EprvNom,
      start: start ?? undefined,
      end,
      allDay: true,
      backgroundColor: bg,
      borderColor: bg,
      textColor: color,
    };
  });

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-white/60 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        locale="fr"
        firstDay={1}
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,listMonth" }}
        buttonText={{ dayGridMonth: "Mois", listMonth: "Liste", today: "Aujourd'hui" }}
        height="auto"
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          const c = byId[info.event.id];
          if (c) onOpen(c);
        }}
      />
    </div>
  );
}
