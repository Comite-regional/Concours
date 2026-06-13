import { NextResponse } from "next/server";
import { getEpreuvesPassees } from "@/lib/ffta";

export const revalidate = 1800;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const saison = searchParams.get("saison") ?? undefined;
  try {
    const data = await getEpreuvesPassees(saison);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
