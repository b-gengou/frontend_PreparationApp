/** Affiche la liste de tous les formateurs (GET /api/formateurs).
 * Accessible à tout utilisateur connecté (formateur ou admin), cela se conforme
 * à la règle de droits définie côté backend (FormateursController.cs).
 * Le rôle de chaque formateur est affiché via un badge texte + couleur
 * (jamais la couleur seule), pour rester lisible en cas de daltonisme.
 */
 
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import type { Formateur } from '../types/models';


// Composant interne : badge de rôle, avec texte explicite en +
// de la couleur (voir styles/accessibility.css pour les classes utilisées).

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  if (role === '1') {
    return <span className="app-badge-role app-badge-role-admin">Administrateur</span>;
  }
  return <span className="app-badge-role app-badge-role-formateur">Formateur</span>;
};

const FormateursList: React.FC = () => {
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback : isole la fonction de récupération pour pouvoir la
  // rappeler depuis le bouton "Réessayer" sans recharger toute la page
  // (rechargement complet = mauvaise pratique UX et perdrait
  // l'état de connexion stocké en mémoire React, même s'il resterait
  // dans localStorage).
  const fetchFormateurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Formateur[]>('/formateurs');
      if (!Array.isArray(response.data)) {
        throw new Error('Les données reçues ne sont pas un tableau de formateurs.');
      }
      setFormateurs(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des formateurs:', err);
      let errorMessage = 'Impossible de récupérer les formateurs.';
      if (err.response) {
        errorMessage += ` Code HTTP : ${err.response.status}`;
        if (err.response.data?.Error) {
          errorMessage += ` - ${err.response.data.Error}`;
        }
      } else if (err.request) {
        errorMessage += ' Aucune réponse du serveur.';
      } else {
        errorMessage += ` ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormateurs();
  }, [fetchFormateurs]);

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2 fs-5">Chargement des formateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        {/* app-alert-danger : rouge à fort contraste + icône, jamais la
            couleur seule (voir styles/accessibility.css). */}
        <div className="app-alert app-alert-danger" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          <div>
            {error}
            <div className="mt-2">
              <button onClick={fetchFormateurs} className="btn btn-sm btn-outline-danger">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="h2 text-center mb-4">Liste des formateurs</h1>

      {formateurs.length === 0 ? (
        <div className="app-alert app-alert-info" role="status">
          <span className="app-alert-icon" aria-hidden="true">ℹ</span>
          Aucun formateur trouvé dans la base de données.
        </div>
      ) : (
        // table-responsive : sur mobile, le tableau devient défilable
        // horizontalement plutôt que de casser la mise en page.
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col" className="text-center">ID</th>
                <th scope="col">Nom</th>
                <th scope="col">Email</th>
                <th scope="col" className="text-center">Rôle</th>
                <th scope="col" className="text-center">Google Calendar</th>
              </tr>
            </thead>
            <tbody>
              {formateurs.map((formateur) => (
                <tr key={formateur.id}>
                  <td className="text-center">{formateur.id}</td>
                  <td>{formateur.name}</td>
                  <td>
                    <a href={`mailto:${formateur.email}`} className="text-decoration-none">
                      {formateur.email}
                    </a>
                  </td>
                  <td className="text-center">
                    <RoleBadge role={formateur.role} />
                  </td>
                  <td className="text-center">
                    {formateur.googleCalendarId || (
                      <span className="text-secondary">Non spécifié</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FormateursList;
