import { NextResponse } from "next/server";
import { getResultatEpreuve } from "@/lib/ffta";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await getResultatEpreuve(id);
    if (!data) return NextResponse.json({ ok: false, error: "Résultats introuvables" }, { status: 404 });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
