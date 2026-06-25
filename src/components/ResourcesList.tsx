/* Catalogue des supports de cours (GET /api/resources), avec recherche par
 * mot-clefs et filtres par type, formateur et date - paramètres
 * que ResourcesController.cs accepte côté backend.
 * Le catalogue de supports est une fonctionnalité MVP du cahier
 * des charges (destinée à remplacer un fichier Google Sheets partagé).
 * Consultation ouverte à tout utilisateur connecté. La modification et la
 * suppression ne sont visibles que pour le créateur de la ressource ou un
 * administrateur (même règle que côté backend).
 */
 
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Resource, Formateur } from '../types/models';

const TYPE_OPTIONS = ['PDF', 'Vidéo', 'Lien', 'Document', 'Autre'];

const ResourcesList: React.FC = () => {
  const { user, isAdmin } = useAuth();
  // useSearchParams permet de préremplir le filtre "préparation" lorsque l'on
  // arrive depuis PreparationDetails.tsx via le lien
  // "/resources?preparationId=...". Ce filtre n'existe pas côté backend
  // (qui filtre par formateurId/date/type), donc utilité seulement
  // pour le filtrage affiché côté frontend, en complément.
  const [searchParams] = useSearchParams();
  // Id. de la préparation d'origine si on arrive depuis PreparationDetails.tsx
  // via "/resources?preparationId=...". Calculé tôt car utilisé par
  // plusieurs fonctions ci-dessous (handleLink, isLinked).
  const preparationId = searchParams.get('preparationId');

  const [resources, setResources] = useState<Resource[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [formateurId, setFormateurId] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Id. de la ressource en cours de liaison (pour désactiver son bouton
  // pendant l'appel réseau et éviter un double clic).
  const [linkingId, setLinkingId] = useState<number | null>(null);
  // Message de confirmation affiché après une liaison réussie.
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Récupère la liste des formateurs pour le filtre déroulant.
  useEffect(() => {
    api.get<Formateur[]>('/formateurs').then((res) => setFormateurs(res.data)).catch(() => {});
  }, []);

  // Recherche des ressources avec les filtres actuels. useCallback pour
  // pouvoir la déclencher à la fois au chargement et au clic sur le
  // bouton "Rechercher", sans dupliquer la logique.

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (type) params.type = type;
      if (formateurId) params.formateurId = formateurId;
      if (date) params.date = date;

      const response = await api.get<Resource[]>('/resources', { params });
      setResources(response.data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des ressources:', err);
      setError(err.response?.data?.Error || 'Impossible de récupérer les ressources.');
    } finally {
      setLoading(false);
    }
  }, [search, type, formateurId, date]);

  useEffect(() => {
    fetchResources();
    // Dépendance volontairement vide ici : on ne charge qu'au montage,
    // la recherche elle-même se fait via le bouton "Rechercher" (handleSearch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette ressource ?')) return;
    try {
      await api.delete(`/resources/${id}`);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.Error || 'Impossible de supprimer cette ressource.');
    }
  };

  const canModify = (resource: Resource): boolean => {
    return isAdmin || resource.createdById === user?.id;
  };

  // Lie la ressource cliquée à la préparation d'origine (celle passée en
  // query param ?preparationId=... depuis PreparationDetails.tsx).
  // Appelle POST /api/resources/{resourceId}/link/{preparationId}
  // (voir ResourcesController.cs, LinkToPreparation).
  const handleLink = async (resourceId: number) => {
    if (!preparationId) return;
    setLinkingId(resourceId);
    setError(null);
    setLinkSuccess(null);
    try {
      await api.post(`/resources/${resourceId}/link/${preparationId}`);
      setLinkSuccess('Ressource liée à la préparation avec succès.');
      // On rafraîchit la liste pour que le bouton "Lier" devienne
      // "Déjà liée" grâce aux preparationResources mis à jour.
      await fetchResources();
    } catch (err: any) {
      console.error('Erreur lors de la liaison:', err);
      setError(err.response?.data?.Error || 'Impossible de lier cette ressource à la préparation.');
    } finally {
      setLinkingId(null);
    }
  };

  // Indique si la ressource est déjà liée à la préparation d'origine,
  // pour afficher "Déjà liée" plutôt que de permettre un doublon
  // (le backend renvoie une erreur 400 dans ce cas).
  const isLinked = (resource: Resource): boolean => {
    if (!preparationId) return false;
    return resource.preparationResources?.some(
      (pr) => pr.preparationId === Number(preparationId)
    ) ?? false;
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <h1 className="h2 mb-0">Catalogue des supports</h1>
        <Link to="/resources/new" className="btn btn-primary">
          + Ajouter une ressource
        </Link>
      </div>

      {preparationId && (
        <div className="app-alert app-alert-info mb-3" role="status">
          <span className="app-alert-icon" aria-hidden="true">ℹ</span>
          Affichage du catalogue complet. Cliquez sur « Lier à cette préparation »
          sur une ressource pour l'associer à la préparation #{preparationId}.
        </div>
      )}

      {linkSuccess && (
        <div className="app-alert app-alert-success mb-3" role="status">
          <span className="app-alert-icon" aria-hidden="true">✓</span>
          {linkSuccess}
        </div>
      )}

      {/* Formulaire de recherche et filtres */}
      <form onSubmit={handleSearch} className="card card-body mb-4">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <label htmlFor="search" className="form-label visually-hidden">Mot-clé</label>
            <input
              type="search"
              id="search"
              className="form-control"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <label htmlFor="type" className="form-label visually-hidden">Type</label>
            <select
              id="type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Tous les types</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label htmlFor="formateurId" className="form-label visually-hidden">Formateur</label>
            <select
              id="formateurId"
              className="form-select"
              value={formateurId}
              onChange={(e) => setFormateurId(e.target.value)}
            >
              <option value="">Tous les formateurs</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <button type="submit" className="btn btn-outline-primary w-100">
              Rechercher
            </button>
          </div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col-12 col-md-4">
            <label htmlFor="date" className="form-label">Date de préparation liée</label>
            <input
              type="date"
              id="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </form>

      {error && (
        <div className="app-alert app-alert-danger" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center p-4">
          <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : resources.length === 0 ? (
        <div className="app-alert app-alert-info" role="status">
          <span className="app-alert-icon" aria-hidden="true">ℹ</span>
          Aucune ressource ne correspond à ces critères.
        </div>
      ) : (
        // Affichage en grille de cartes plutôt qu'en tableau : plus lisible
        // sur mobile pour ce type de contenu (lien + type + auteur).
        <div className="row g-3">
          {resources.map((resource) => (
            <div className="col-12 col-md-6 col-lg-4" key={resource.id}>
              <div className="card h-100">
                <div className="card-body d-flex flex-column">
                  <span className="app-badge-role app-badge-role-formateur mb-2" style={{ alignSelf: 'flex-start' }}>
                    {resource.type || 'Type non précisé'}
                  </span>
                  <h2 className="h6">{resource.name}</h2>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2"
                  >
                    Ouvrir la ressource ↗
                  </a>
                  <p className="text-secondary small mb-3 mt-auto">
                    Ajoutée par {resource.createdBy?.displayName ?? `#${resource.createdById}`}
                  </p>

                  {/* Bouton de liaison : visible uniquement si on arrive depuis
                      la fiche d'une préparation (?preparationId=...). */}
                  {preparationId && (
                    isLinked(resource) ? (
                      <button className="btn btn-sm app-btn-success-solid mb-2" disabled>
                        ✓ Déjà liée à cette préparation
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm app-btn-success mb-2"
                        onClick={() => handleLink(resource.id)}
                        disabled={linkingId === resource.id}
                      >
                        {linkingId === resource.id ? 'Liaison...' : 'Lier à cette préparation'}
                      </button>
                    )
                  )}

                  {canModify(resource) && (
                    <div className="d-flex gap-2 app-table-actions">
                      <Link
                        to={`/resources/${resource.id}/edit`}
                        className="btn btn-sm btn-outline-primary flex-fill"
                      >
                        Modifier
                      </Link>
                      <button
                        className="btn btn-sm app-btn-warning flex-fill"
                        onClick={() => handleDelete(resource.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesList;
