/** Affiche le détail d'une préparation : sujet, dates, formateur assigné,
 * statut, et les comptes-rendus / ressources liées 
 * Les boutons Modifier/Supprimer ne s'affichent que pour le créateur de la
 * préparation ou un administrateur, conformément à la règle de droits du
 * backend (PreparationsController.cs).
 */
 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Preparation } from '../types/models';

const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const STATUS_LABELS: Record<string, string> = {
  Upcoming: 'À venir',
  InProgress: 'En cours',
  Completed: 'Terminée',
};

const PreparationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreparation = async () => {
      try {
        setLoading(true);
        const response = await api.get<Preparation>(`/preparations/${id}`);
        setPreparation(response.data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération de la préparation:', err);
        setError(err.response?.data?.Error || 'Impossible de récupérer cette préparation.');
      } finally {
        setLoading(false);
      }
    };
    fetchPreparation();
  }, [id]);

  const handleDelete = async () => {
    if (!preparation) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette préparation ?')) return;
    try {
      await api.delete(`/preparations/${preparation.id}`);
      navigate('/preparations');
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.Error || 'Impossible de supprimer cette préparation.');
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement des détails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="app-alert app-alert-danger" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          {error}
          <div className="mt-2">
            <button onClick={() => navigate('/preparations')} className="btn btn-sm btn-outline-danger">
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!preparation) {
    return (
      <div className="container mt-4">
        <div className="app-alert app-alert-info" role="status">
          <span className="app-alert-icon" aria-hidden="true">ℹ</span>
          Préparation non trouvée.
        </div>
      </div>
    );
  }

  // Même règle de droits que côté backend : créateur ou administrateur.
  const canModify = isAdmin || preparation.createdById === user?.id;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}>
              <h1 className="h4 mb-0">{preparation.subject}</h1>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-4">Formateur assigné</dt>
                <dd className="col-sm-8">
                  {preparation.formateur ? (
                    <>
                      {preparation.formateur.name}
                      <br />
                      <small className="text-secondary">{preparation.formateur.email}</small>
                    </>
                  ) : (
                    `Formateur #${preparation.formateurId}`
                  )}
                </dd>

                <dt className="col-sm-4">Date de début</dt>
                <dd className="col-sm-8">{formatDateTime(preparation.startDate)}</dd>

                <dt className="col-sm-4">Date de fin</dt>
                <dd className="col-sm-8">{formatDateTime(preparation.endDate)}</dd>

                <dt className="col-sm-4">Statut</dt>
                <dd className="col-sm-8">{STATUS_LABELS[preparation.status] ?? preparation.status}</dd>

                {preparation.createdBy && (
                  <>
                    <dt className="col-sm-4">Créée par</dt>
                    <dd className="col-sm-8">{preparation.createdBy.name}</dd>
                  </>
                )}
              </dl>

              {/* Section comptes-rendus : couvre PreparationReportsController,
                  absent du frontend initial. */}
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0">Compte-rendu</h2>
                <Link
                  to={`/preparations/${preparation.id}/report`}
                  className="btn btn-sm btn-outline-primary"
                >
                  Voir / créer le compte-rendu
                </Link>
              </div>

              {/* Section ressources : couvre ResourcesController, absent du
                  frontend initial. */}
              <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                <h2 className="h5 mb-0">Ressources liées</h2>
                <Link
                  to={`/resources?preparationId=${preparation.id}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  Voir le catalogue
                </Link>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                {canModify && (
                  <>
                    <Link
                      to={`/preparations/${preparation.id}/edit`}
                      className="btn btn-outline-primary me-md-2"
                    >
                      Modifier
                    </Link>
                    <button className="btn btn-outline-danger me-md-2" onClick={handleDelete}>
                      Supprimer
                    </button>
                  </>
                )}
                <Link to="/preparations" className="btn btn-secondary">
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationDetails;
