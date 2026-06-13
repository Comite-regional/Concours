"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { ConcoursBrut } from "@/lib/ffta";

const DISC_COLORS: Record<string, string> = {
  T: "#f3d1ab", S: "#c9d4ea", C: "#000", "3": "#e3cdb7",
  N: "#d7ddc9", B: "#111", J: "#e2d5ff", L: "#f2c6ea",
};
const DISC_TEXT: Record<string, string> = {
  T: "#111", S: "#0b1b3a", C: "#f2c200", "3": "#3a2414",
  N: "#2c3b22", B: "#fff", J: "#3a1c6b", L: "#6b004e",
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
