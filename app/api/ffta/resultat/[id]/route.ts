import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const epreuve = await prisma.epreuveResultat.findUnique({
      where: { eprvId: id },
      include: {
        classements: {
          include: { participants: true },
        },
      },
    });

    if (!epreuve) {
      return NextResponse.json({ ok: false, error: "Épreuve non trouvée" }, { status: 404 });
    }

    const data = {
      EprvId: epreuve.eprvId,
      EprvNom: epreuve.eprvNom,
      EprvDateDebut: epreuve.eprvDateDebut,
      EprvLieu: epreuve.eprvLieu ?? "",
      Discipline: epreuve.discipline ?? "",
      Classements: epreuve.classements.map((cl) => ({
        libelle: cl.libelle,
        participants: cl.participants.map((p) => ({
          Nom: p.nom,
          Club: p.club ?? "",
          LicenceCode: p.licenceCode ?? "",
          Categorie: p.categorie ?? "",
          SCORE_TOTAL: p.scoreTotal ?? "0",
          PLACE_QUALIF: p.placeQualif ?? "0",
          PLACE_DEF: p.placeDef ?? "0",
          SCORE_DIST1: p.scoreDist1 ?? "0",
          SCORE_DIST2: p.scoreDist2 ?? "0",
          DIX: p.dix ?? "0",
          NEUF: p.neuf ?? "0",
        })),
      })),
    };

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
