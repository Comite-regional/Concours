export default function AthletesPage() {
  const athletes = [
    { id: 1, nom: "Dupont", prenom: "Marie", club: "Arc Club Nantes", categorie: "Senior F", licence: "044001" },
    { id: 2, nom: "Martin", prenom: "Lucas", club: "Arc Club Le Mans", categorie: "Junior H", licence: "072002" },
    { id: 3, nom: "Bernard", prenom: "Sophie", club: "Angers Tir Arc", categorie: "Senior F", licence: "049003" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Athlètes</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Prénom</th>
              <th className="px-6 py-3 text-left">Club</th>
              <th className="px-6 py-3 text-left">Catégorie</th>
              <th className="px-6 py-3 text-left">Licence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {athletes.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{a.nom}</td>
                <td className="px-6 py-4 text-gray-600">{a.prenom}</td>
                <td className="px-6 py-4 text-gray-600">{a.club}</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">{a.categorie}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{a.licence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
