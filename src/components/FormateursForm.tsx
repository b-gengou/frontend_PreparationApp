/** Formulaire de création directe d'un formateur par un administrateur
 * (POST /api/formateurs, réservé à la policy "AdminOnly" côté backend -
 * voir FormateursController.cs).
 * !!! Ce formulaire est différent de la page d'inscription publique
 * (RegisterPage.tsx, POST /api/auth/register). Il sert à un administrateur
 * qui veut créer un compte pour un collègue directement, en choisissant
 * son rôle dès la création - alors que l'inscription publique attribue
 * toujours le rôle "2" (formateur) par défaut.
 * Petit détail technique  : le backend ne propose pas de route de mofication
 * générale d'un formateur (seulement PUT /api/formateurs/{id}/role pour
 * changer son rôle - voir RoleManagementPage.tsx). Ce formulaire ne gère
 * donc que la création, pas l'édition.*/
 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { FormateurCreatePayload } from '../types/models';

const FormateursForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [formateur, setFormateur] = useState<FormateurCreatePayload>({
    name: '',
    email: '',
    password: '',
    role: '2',
    googleCalendarId: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Garde-folle frontend : si un formateur simple arrive ici malgré tout
  // (ex.: lien direct tapé dans l'URL), il est informé
  // que remplir le formulaire, provoquera une erreur, il échouera de toute façon
  // avec un 403 côté backend.
  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="app-alert app-alert-warning" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          Seul un administrateur peut créer un formateur directement.
          Si vous souhaitez créer votre propre compte, utilisez la page d'inscription.
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormateur((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/formateurs', formateur);
      navigate('/formateurs');
    } catch (err: any) {
      console.error('Erreur lors de la création du formateur:', err);
      let errorMessage = 'Impossible de créer le formateur.';
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
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}>
              <h1 className="h4 mb-0">Ajouter un formateur</h1>
            </div>
            <div className="card-body">
              {error && (
                <div className="app-alert app-alert-danger" role="alert">
                  <span className="app-alert-icon" aria-hidden="true">⚠</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="name" className="form-label">Nom *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formateur.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex : Jean Dupont"
                    />
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formateur.email}
                      onChange={handleChange}
                      required
                      placeholder="Ex : jean.dupont@cognitic.be"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="password" className="form-label">Mot de passe provisoire *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formateur.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <div className="form-text">
                      Le formateur pourra se connecter avec ce mot de passe (au moins 6 caractères).
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="role" className="form-label">Rôle *</label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={formateur.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="2">Formateur</option>
                      <option value="1">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="googleCalendarId" className="form-label">
                    Identifiant Google Calendar
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="googleCalendarId"
                    name="googleCalendarId"
                    value={formateur.googleCalendarId}
                    onChange={handleChange}
                    placeholder="Ex : jean@group.calendar.google.com"
                  />
                  <div className="form-text">Optionnel.</div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary me-md-2"
                    onClick={() => navigate('/formateurs')}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Création en cours...
                      </>
                    ) : (
                      'Créer le formateur'
                    )}
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

export default FormateursForm;
