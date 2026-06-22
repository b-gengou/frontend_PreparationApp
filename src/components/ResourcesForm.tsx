/** Formulaire de création ou modification d'une ressource du catalogue
 * (POST /api/resources ou PUT /api/resources/{id}).
 * Le champ CreatedById n'apparaît pas ici : il est déterminé
 * par le backend à partir de l'utilisateur connecté (voir ResourcesController.cs,
 * CreateResource), il ne sera jamais saisi manuellement.
 * En mode modif., le backend vérifie que la personne connectée est
 * bien le créateur de la ressource ou un administrateur (sinon 403) ;
 * ce formulaire affiche dès lors un message clair plutôt qu'une erreur brute.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import type { ResourcePayload } from '../types/models';

const TYPE_OPTIONS = ['PDF', 'Vidéo', 'Lien', 'Document', 'Autre'];

const ResourcesForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<ResourcePayload>({
    name: '',
    url: '',
    type: 'PDF',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/resources/${id}`)
      .then((res) => {
        setFormData({
          id: res.data.id,
          name: res.data.name,
          url: res.data.url,
          type: res.data.type,
        });
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération de la ressource:', err);
        setError('Impossible de récupérer cette ressource.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        await api.put(`/resources/${id}`, { ...formData, id: Number(id) });
      } else {
        await api.post('/resources', formData);
      }
      navigate('/resources');
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde de la ressource:', err);
      let errorMessage = 'Impossible de sauvegarder la ressource.';
      if (err.response?.status === 403) {
        errorMessage = "Vous n'avez pas le droit de modifier cette ressource (seul son créateur ou un administrateur le peut).";
      } else if (err.response?.data?.Error) {
        errorMessage = err.response.data.Error;
      } else if (!err.response) {
        errorMessage = 'Aucune réponse du serveur.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}>
              <h1 className="h4 mb-0">
                {isEditMode ? 'Modifier la ressource' : 'Ajouter une ressource'}
              </h1>
            </div>
            <div className="card-body">
              {error && (
                <div className="app-alert app-alert-danger" role="alert">
                  <span className="app-alert-icon" aria-hidden="true">⚠</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Nom de la ressource *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex : Support PDF - Introduction SQL"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="url" className="form-label">Lien (URL) *</label>
                  <input
                    type="url"
                    className="form-control"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    required
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="type" className="form-label">Type *</label>
                  <select
                    className="form-select"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary me-md-2"
                    onClick={() => navigate('/resources')}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Enregistrement...
                      </>
                    ) : isEditMode ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesForm;
