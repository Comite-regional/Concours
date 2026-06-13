export default function ConcoursPage() {
  // Données d'exemple — seront remplacées par des requêtes Prisma
  const concours = [
    { id: 1, nom: "Championnat Régional Salle", date: "2026-02-15", lieu: "Nantes", discipline: "Salle", categorie: "Toutes catégories" },
    { id: 2, nom: "Tir en Campagne PDL", date: "2026-04-20", lieu: "Le Mans", discipline: "Campagne", categorie: "Senior / Junior" },
    { id: 3, nom: "Championnat Régional 3D", date: "2026-06-05", lieu: "Angers", discipline: "3D", categorie: "Toutes catégories" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Concours</h2>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Lieu</th>
              <th className="px-6 py-3 text-left">Discipline</th>
              <th className="px-6 py-3 text-left">Catégorie</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {concours.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{c.nom}</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.lieu}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">{c.discipline}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{c.categorie}</td>
                <td className="px-6 py-4">
                  <a href={`/concours/${c.id}`} className="text-blue-700 font-medium hover:underline text-xs">
                    Résultats →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
