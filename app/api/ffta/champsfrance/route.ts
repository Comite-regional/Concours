import { NextResponse } from "next/server";
import { getChampsNationaux } from "@/lib/ffta";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getChampsNationaux();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
