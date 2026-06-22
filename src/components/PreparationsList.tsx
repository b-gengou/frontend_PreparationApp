/** Affiche la liste des préparations (GET /api/preparations), avec un badge
 * de statut, le formateur assigné, et des actions de modification/suppression
 * visibles uniquement pour le créateur de la préparation ou un administrateur
 * Il s'agit très exactement de la même règle que celle appliquée côté backend
 * (PreparationsController.cs). Cacher le bouton ici n'est prévu que pour le confort
 * visuel : la vraie sécurité reste vérifiée par le backend à chaque requête.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Preparation } from '../types/models';

// Badge de statut. Le statut est toujours accompagné d'un mot explicite
// (jamais une simple pastille de couleur), pour rester compréhensible
// en cas de daltonisme ou en noir et blanc.

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string }> = {
    Upcoming: { label: 'À venir', className: 'app-alert-info' },
    InProgress: { label: 'En cours', className: 'app-alert-warning' },
    Completed: { label: 'Terminée', className: 'app-alert-success' },
  };
  const entry = map[status] ?? { label: status, className: 'app-alert-info' };

  return (
    <span
      className={`app-badge-role ${entry.className}`}
      style={{ borderRadius: '6px', padding: '0.25rem 0.6rem' }}
    >
      {entry.label}
    </span>
  );
};

// Formate une date ISO en format lisible français (ex: "22/06/2026 09:00").
const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PreparationsList: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  const fetchPreparations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Preparation[]>('/preparations');
      setPreparations(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des préparations:', err);
      setError(
        err.response?.data?.Error || err.message || 'Impossible de récupérer les préparations.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreparations();
  }, [fetchPreparations]);


  // Synchronisation avec Google Calendar (GET /api/preparations/sync).
  // Réservée aux utilisateurs connectés (voir PreparationsController.cs) :
  // le formateur et le créateur des préparations importées sont désormais
  // l'utilisateur réellement connecté, plus une valeur fixe.

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.get('/preparations/sync');
      await fetchPreparations();
    } catch (err: any) {
      console.error('Erreur lors de la synchronisation Calendar:', err);
      setError(
        err.response?.data?.Error || 'Impossible de synchroniser avec Google Calendar.'
      );
    } finally {
      setSyncing(false);
    }
  };


  // Suppression d'une préparation. Le bouton n'est affiché que si la
  // personne a les droits (voir canModify ci-dessous), mais le backend
  // revérifie systématiquement ce droit.

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette préparation ?')) {
      return;
    }
    try {
      await api.delete(`/preparations/${id}`);
      setPreparations((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.Error || 'Impossible de supprimer cette préparation.');
    }
  };

  // Détermine si l'utilisateur connecté peut modifier/supprimer cette
  // préparation : il en est le créateur, ou il est administrateur.
  // Reproduit la condition du backend (PreparationsController.cs).
  const canModify = (preparation: Preparation): boolean => {
    return isAdmin || preparation.createdById === user?.id;
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2 fs-5">Chargement des préparations...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <h1 className="h2 mb-0">Préparations</h1>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Synchronisation...' : '↻ Synchroniser avec Google Calendar'}
          </button>
          <Link to="/preparations/new" className="btn btn-primary">
            + Nouvelle préparation
          </Link>
        </div>
      </div>

      {error && (
        <div className="app-alert app-alert-danger" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          {error}
        </div>
      )}

      {preparations.length === 0 ? (
        <div className="app-alert app-alert-info" role="status">
          <span className="app-alert-icon" aria-hidden="true">ℹ</span>
          Aucune préparation trouvée.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Sujet</th>
                <th scope="col">Formateur</th>
                <th scope="col">Début</th>
                <th scope="col">Fin</th>
                <th scope="col" className="text-center">Statut</th>
                <th scope="col" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {preparations.map((preparation) => (
                <tr key={preparation.id}>
                  <td>
                    <Link to={`/preparations/${preparation.id}`} className="text-decoration-none">
                      {preparation.subject}
                    </Link>
                  </td>
                  <td>{preparation.formateur?.name ?? `#${preparation.formateurId}`}</td>
                  <td>{formatDate(preparation.startDate)}</td>
                  <td>{formatDate(preparation.endDate)}</td>
                  <td className="text-center">
                    <StatusBadge status={preparation.status} />
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2 app-table-actions">
                      <Link
                        to={`/preparations/${preparation.id}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Voir
                      </Link>
                      {canModify(preparation) && (
                        <>
                          <Link
                            to={`/preparations/${preparation.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Modifier
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(preparation.id)}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
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

export default PreparationsList;
