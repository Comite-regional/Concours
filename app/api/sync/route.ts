import { NextRequest, NextResponse } from "next/server";
import { getConcours, getEpreuvesPassees, getResultatEpreuve } from "@/lib/ffta";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Sécurité : seul Vercel Cron (ou un appel avec le bon secret) peut déclencher
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saison = String(new Date().getFullYear());
  const errors: string[] = [];

  // ── 1. Sync concours à venir ──────────────────────────────────────────────
  try {
    const concours = await getConcours(saison);
    for (const c of concours) {
      await prisma.concours.upsert({
        where: { eprvId: c.EprvId },
        update: {
          eprvNom: c.EprvNom,
          eprvDateDebut: c.EprvDateDebut,
          eprvDateFin: c.EprvDateFin,
          eprvLieu: c.EprvLieu ?? null,
          eprvEtatCode: c.EprvEtatCode ?? null,
          eprvChampNiv: c.EprvChampNiv ?? null,
          eprvChampionnatType: c.EprvChampionnatType ?? null,
          disciplineCode: c.DisciplineCode ?? null,
          eprvType: c.EprvType ?? null,
          saisonAnnee: c.SaisonAnnee ?? saison,
          ligueCode: c.LigueCode ?? null,
          ligueNom: c.LigueNom ?? null,
          departementCode: c.DepartementCode ?? null,
          departementNom: c.DepartementNom ?? null,
          structureCode: c.StructureCode ?? null,
          structureNom: c.StructureNom ?? null,
          adresseCodePostal: c.AdresseCodePostal ?? null,
          adresseCommune: c.AdresseCommune ?? null,
          adresseLatitude: c.AdresseLatitude ?? null,
          adresseLongitude: c.AdresseLongitude ?? null,
          contactsMail: c.ContactsAdresseMail ?? null,
          contactsWeb: c.ContactsAdrWeb ?? null,
          distinction: c.Distinction ?? null,
          pdf: c.Pdf ?? null,
          syncedAt: new Date(),
        },
        create: {
          eprvId: c.EprvId,
          eprvNom: c.EprvNom,
          eprvDateDebut: c.EprvDateDebut,
          eprvDateFin: c.EprvDateFin,
          eprvLieu: c.EprvLieu ?? null,
          eprvEtatCode: c.EprvEtatCode ?? null,
          eprvChampNiv: c.EprvChampNiv ?? null,
          eprvChampionnatType: c.EprvChampionnatType ?? null,
          disciplineCode: c.DisciplineCode ?? null,
          eprvType: c.EprvType ?? null,
          saisonAnnee: c.SaisonAnnee ?? saison,
          ligueCode: c.LigueCode ?? null,
          ligueNom: c.LigueNom ?? null,
          departementCode: c.DepartementCode ?? null,
          departementNom: c.DepartementNom ?? null,
          structureCode: c.StructureCode ?? null,
          structureNom: c.StructureNom ?? null,
          adresseCodePostal: c.AdresseCodePostal ?? null,
          adresseCommune: c.AdresseCommune ?? null,
          adresseLatitude: c.AdresseLatitude ?? null,
          adresseLongitude: c.AdresseLongitude ?? null,
          contactsMail: c.ContactsAdresseMail ?? null,
          contactsWeb: c.ContactsAdrWeb ?? null,
          distinction: c.Distinction ?? null,
          pdf: c.Pdf ?? null,
        },
      });
    }
    await prisma.syncLog.create({ data: { type: "concours", saison, status: "ok", message: `${concours.length} concours` } });
  } catch (e) {
    const msg = String(e);
    errors.push(`concours: ${msg}`);
    await prisma.syncLog.create({ data: { type: "concours", saison, status: "error", message: msg } });
  }

  // ── 2. Sync épreuves passées + résultats détaillés ───────────────────────
  try {
    const epreuves = await getEpreuvesPassees(saison);
    for (const e of epreuves) {
      await prisma.epreuveResultat.upsert({
        where: { eprvId: e.EprvId },
        update: {
          eprvNom: e.EprvNom,
          eprvDateDebut: e.EprvDateDebut,
          eprvDateFin: e.EprvDateFin ?? null,
          eprvLieu: e.EprvLieu ?? null,
          eprvEtat: e.EprvEtat ?? null,
          discipline: e.Discipline ?? null,
          eprvType: e.EprvType ?? null,
          saisonAnnee: e.SaisonAnnee ?? saison,
          ligueCode: e.LigueCode ?? null,
          ligueNom: e.LigueNom ?? null,
          departementCode: e.DepartementCode ?? null,
          structureNom: e.StructureNom ?? null,
          nbResultats: e.NbResultats ?? null,
          championnatLibelle: e.ChampionnatLibelle ?? null,
          eprvChampNiv: e.EprvChampNiv ?? null,
          eprvChampionnatType: e.EprvChampionnatType ?? null,
          syncedAt: new Date(),
        },
        create: {
          eprvId: e.EprvId,
          eprvNom: e.EprvNom,
          eprvDateDebut: e.EprvDateDebut,
          eprvDateFin: e.EprvDateFin ?? null,
          eprvLieu: e.EprvLieu ?? null,
          eprvEtat: e.EprvEtat ?? null,
          discipline: e.Discipline ?? null,
          eprvType: e.EprvType ?? null,
          saisonAnnee: e.SaisonAnnee ?? saison,
          ligueCode: e.LigueCode ?? null,
          ligueNom: e.LigueNom ?? null,
          departementCode: e.DepartementCode ?? null,
          structureNom: e.StructureNom ?? null,
          nbResultats: e.NbResultats ?? null,
          championnatLibelle: e.ChampionnatLibelle ?? null,
          eprvChampNiv: e.EprvChampNiv ?? null,
          eprvChampionnatType: e.EprvChampionnatType ?? null,
        },
      });

      // Charger les résultats détaillés si disponibles
      if (Number(e.NbResultats) > 0) {
        try {
          const detail = await getResultatEpreuve(e.EprvId);
          if (detail?.Classements?.length) {
            // Supprimer les anciens classements avant de réinsérer
            const existing = await prisma.classement.findMany({ where: { eprvId: e.EprvId }, select: { id: true } });
            for (const cl of existing) {
              await prisma.participant.deleteMany({ where: { classementId: cl.id } });
            }
            await prisma.classement.deleteMany({ where: { eprvId: e.EprvId } });

            for (const cl of detail.Classements) {
              const classement = await prisma.classement.create({
                data: { eprvId: e.EprvId, libelle: cl.libelle },
              });
              for (const p of cl.participants) {
                await prisma.participant.create({
                  data: {
                    classementId: classement.id,
                    nom: p.Nom,
                    club: p.Club ?? null,
                    licenceCode: p.LicenceCode ?? null,
                    categorie: p.Categorie ?? null,
                    scoreTotal: p.SCORE_TOTAL ?? null,
                    placeQualif: p.PLACE_QUALIF ?? null,
                    placeDef: p.PLACE_DEF ?? null,
                    scoreDist1: p.SCORE_DIST1 ?? null,
                    scoreDist2: p.SCORE_DIST2 ?? null,
                    dix: p.DIX ?? null,
                    neuf: p.NEUF ?? null,
                  },
                });
              }
            }
          }
        } catch {
          // Résultats détaillés non critiques
        }
      }
    }
    await prisma.syncLog.create({ data: { type: "resultats", saison, status: "ok", message: `${epreuves.length} épreuves` } });
  } catch (e) {
    const msg = String(e);
    errors.push(`resultats: ${msg}`);
    await prisma.syncLog.create({ data: { type: "resultats", saison, status: "error", message: msg } });
  }

  return NextResponse.json({
    ok: errors.length === 0,
    errors: errors.length ? errors : undefined,
    syncedAt: new Date().toISOString(),
  });
}
