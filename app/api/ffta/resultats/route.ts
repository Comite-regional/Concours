import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const saison = req.nextUrl.searchParams.get("saison") ?? String(new Date().getFullYear());

  try {
    const epreuves = await prisma.epreuveResultat.findMany({
      where: { saisonAnnee: saison },
      orderBy: { eprvDateDebut: "desc" },
    });

    const data = epreuves.map((e) => ({
      EprvId: e.eprvId,
      EprvNom: e.eprvNom,
      EprvDateDebut: e.eprvDateDebut,
      EprvDateFin: e.eprvDateFin ?? "",
      EprvLieu: e.eprvLieu ?? "",
      EprvEtat: e.eprvEtat ?? "",
      Discipline: e.discipline ?? "",
      EprvType: e.eprvType ?? "",
      SaisonAnnee: e.saisonAnnee ?? saison,
      LigueCode: e.ligueCode ?? "",
      LigueNom: e.ligueNom ?? null,
      DepartementCode: e.departementCode ?? "",
      StructureNom: e.structureNom ?? "",
      NbResultats: e.nbResultats ?? "0",
      ChampionnatLibelle: e.championnatLibelle ?? "",
      EprvChampNiv: e.eprvChampNiv ?? "",
      EprvChampionnatType: e.eprvChampionnatType ?? "",
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
