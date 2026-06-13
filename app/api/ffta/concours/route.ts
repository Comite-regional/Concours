import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const saison = req.nextUrl.searchParams.get("saison") ?? String(new Date().getFullYear());

  try {
    const concours = await prisma.concours.findMany({
      where: { saisonAnnee: saison },
      orderBy: { eprvDateDebut: "asc" },
    });

    const data = concours.map((c) => ({
      EprvId: c.eprvId,
      EprvNom: c.eprvNom,
      EprvDateDebut: c.eprvDateDebut,
      EprvDateFin: c.eprvDateFin,
      EprvLieu: c.eprvLieu ?? "",
      EprvEtatCode: c.eprvEtatCode ?? "",
      EprvChampNiv: c.eprvChampNiv ?? "",
      EprvChampionnatType: c.eprvChampionnatType ?? null,
      DisciplineCode: c.disciplineCode ?? "",
      EprvType: c.eprvType ?? "",
      SaisonAnnee: c.saisonAnnee ?? saison,
      LigueCode: c.ligueCode ?? "",
      LigueNom: c.ligueNom ?? null,
      DepartementCode: c.departementCode ?? "",
      DepartementNom: c.departementNom ?? null,
      StructureCode: c.structureCode ?? "",
      StructureNom: c.structureNom ?? "",
      AdresseCodePostal: c.adresseCodePostal ?? "",
      AdresseCommune: c.adresseCommune ?? "",
      AdresseLatitude: c.adresseLatitude ?? "",
      AdresseLongitude: c.adresseLongitude ?? "",
      ContactsAdresseMail: c.contactsMail ?? "",
      ContactsAdrWeb: c.contactsWeb ?? "",
      Distinction: c.distinction ?? "",
      Documents: null,
      Pdf: c.pdf ?? null,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
