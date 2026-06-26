/** Affiche la liste de tous les formateurs (GET /api/formateurs).
 * Accessible à tout utilisateur connecté (formateur ou admin), 
 * conforme à la règle de droits définie côté backend (FormateursController.cs).
 * Le rôle de chaque formateur est affiché via un badge texte + couleur
 * (jamais la couleur seule), pour rester lisible en cas de daltonisme. */
 
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Formateur } from '../types/models';


// Composant interne : badge de rôle, avec texte explicite en +
// de la couleur (voir styles/accessibility.css pour les classes utilisées).

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  if (role === '1') {
    return <span className="app-badge-role app-badge-role-admin">Administrateur</span>;
  }
  return <span className="app-badge-role app-badge-role-formateur">Formateur</span>;
};

// Badge de statut actif/désactivé : texte explicite + couleur, jamais la
// couleur seule (cohérent avec RoleBadge et la palette accessible).
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (isActive) {
    return <span className="app-badge-role app-badge-role-formateur">Actif</span>;
  }
  return <span className="app-badge-role app-badge-role-admin">Désactivé</span>;
};

const FormateursList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Id. du formateur en cours de (dés)activation, pour désactiver son
  // bouton pendant l'appel réseau et éviter un double clic.
  const [togglingId, setTogglingId] = useState<number | null>(null);
  // Id. du formateur dont le rôle est en cours de changement, séparé de
  // togglingId car les deux actions (statut / rôle) sont indépendantes et
  // pourraient en théorie être déclenchées presque en même temps.
  const [togglingRoleId, setTogglingRoleId] = useState<number | null>(null);

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

  // Désactive ou réactive le compte d'un formateur (admin uniquement).
  // Appelle PUT /api/formateurs/{id}/deactivate ou /reactivate selon le
  // statut actuel (voir FormateursController.cs).
  const handleToggleActive = async (formateur: Formateur) => {
    const action = formateur.isActive ? 'deactivate' : 'reactivate';
    setTogglingId(formateur.id);
    setError(null);
    try {
      await api.put(`/formateurs/${formateur.id}/${action}`);
      // On rafraîchit la liste pour refléter le nouveau statut et le
      // displayName mis à jour (ex: "(compte désactivé)" qui apparaît
      // ou disparaît).
      await fetchFormateurs();
    } catch (err: any) {
      console.error(`Erreur lors de la ${action === 'deactivate' ? 'désactivation' : 'réactivation'}:`, err);
      setError(err.response?.data?.Error || `Impossible de ${action === 'deactivate' ? 'désactiver' : 'réactiver'} ce compte.`);
    } finally {
      setTogglingId(null);
    }
  };

  // Promeut un formateur en administrateur, ou rétrograde un administrateur
  // en formateur simple. Voir PUT /api/formateurs/{id}/role (cf.
  // FormateursController.cs, UpdateRole). Le backend refuse de rétrograder
  // le dernier adminstrateur actif restant ; dans ce cas, le message
  // d'erreur renvoyé par le backend est affiché tel quel.
  const handleToggleRole = async (formateur: Formateur) => {
    const newRole = formateur.role === '1' ? '2' : '1';
    const confirmMessage = newRole === '1'
      ? `Voulez-vous vraiment promouvoir ${formateur.name} au rang d'administrateur ?`
      : `Voulez-vous vraiment retirer le statut administrateur de ${formateur.name} ?`;
    if (!window.confirm(confirmMessage)) return;

    setTogglingRoleId(formateur.id);
    setError(null);
    try {
      await api.put(`/formateurs/${formateur.id}/role`, { role: newRole });
      // On rafraîchit la liste pour refléter le nouveau rôle (badge et
      // bouton mis à jour).
      await fetchFormateurs();
    } catch (err: any) {
      console.error('Erreur lors du changement de rôle:', err);
      // Le backend renvoie un message clair si on essaie de rétrograder le
      // dernier admin actif ("Impossible de retirer le statut
      // administrateur à ... : il s'agit du dernier administrateur
      // actif.") — on l'affiche tel quel plutôt qu'un message générique.
      setError(err.response?.data?.Error || 'Impossible de modifier le rôle de ce formateur.');
    } finally {
      setTogglingRoleId(null);
    }
  };

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
              <button onClick={fetchFormateurs} className="btn btn-sm app-btn-danger">
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
                <th scope="col" className="text-center">Statut</th>
                <th scope="col" className="text-center">Google Calendar</th>
                {isAdmin && <th scope="col" className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {formateurs.map((formateur) => (
                <tr key={formateur.id}>
                  <td className="text-center">{formateur.id}</td>
                  {/* displayName : "Nom" si actif, "Nom (compte désactivé)"
                      sinon — calculé côté backend, voir Formateur.cs. */}
                  <td>{formateur.displayName}</td>
                  <td>
                    <a href={`mailto:${formateur.email}`} className="text-decoration-none">
                      {formateur.email}
                    </a>
                  </td>
                  <td className="text-center">
                    <RoleBadge role={formateur.role} />
                  </td>
                  <td className="text-center">
                    <StatusBadge isActive={formateur.isActive} />
                  </td>
                  <td className="text-center">
                    {formateur.googleCalendarId || (
                      <span className="text-secondary">Non spécifié</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="text-center">
                      <div className="d-flex flex-column gap-1 app-table-actions">
                        <button
                          className={formateur.isActive ? 'btn btn-sm app-btn-warning' : 'btn btn-sm app-btn-success'}
                          onClick={() => handleToggleActive(formateur)}
                          disabled={togglingId === formateur.id}
                        >
                          {togglingId === formateur.id
                            ? '...'
                            : formateur.isActive ? 'Désactiver' : 'Réactiver'}
                        </button>
                        <button
                          className={formateur.role === '1' ? 'btn btn-sm app-btn-warning' : 'btn btn-sm app-btn-success'}
                          onClick={() => handleToggleRole(formateur)}
                          disabled={togglingRoleId === formateur.id}
                        >
                          {togglingRoleId === formateur.id
                            ? '...'
                            : formateur.role === '1' ? 'Rétrograder en formateur' : 'Promouvoir admin'}
                        </button>
                      </div>
                    </td>
                  )}
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
