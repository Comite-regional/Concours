import { NextResponse } from "next/server";
import { getConcours } from "@/lib/ffta";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const saison = searchParams.get("saison") ?? undefined;
  try {
    const data = await getConcours(saison);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
