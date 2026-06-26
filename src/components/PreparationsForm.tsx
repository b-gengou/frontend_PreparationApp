/** Formulaire de création ou modification d'une préparation
 * (POST /api/preparations ou PUT /api/preparations/{id}).
 * Champs alignés sur Preparation.cs (backend) : Subject, StartDate, EndDate,
 * Status, FormateurId. Le champ CreatedById n'apparaît jamais dans ce
 * formulaire : il est tjrs déterminé par le backend à partir de
 * l'utilisateur connecté (voir PreparationsController.cs, PostPreparation),
 * jamais saisi manuellement, pour éviter qu'une personne ne puisse créer
 * une préparation au nom de quelqu'un d'autre. */
 
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Formateur, PreparationPayload } from '../types/models';

// Les statuts possibles, alignés sur ce que le backend attend dans le
// champ Status (chaîne de caractères libre côté base de données, mais 
// restreint les valeurs proposées ici pour garder une cohérence à l'usage).
const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'À venir' },
  { value: 'InProgress', label: 'En cours' },
  { value: 'Completed', label: 'Terminée' },
];

// Convertit une date ISO complète (avec heure/fuseau) en valeur compatible
// avec un <input type="datetime-local">, qui attend le format
// "AAAA-MM-JJTHH:mm" sans information de fuseau.
const toDatetimeLocal = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const PreparationsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<PreparationPayload>({
    subject: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    // En mode création, on pré-sélectionne automatiquement l'utilisateur
    // connecté comme formateur assigné : c'est le cas le plus fréquent
    // (un formateur crée sa propre préparation), et ça évite l'erreur 400
    // En mode édition, formateurId est de toute façon réécrasé juste après
    // par les données réelles de la préparation (voir le useEffect plus bas).
    formateurId: user?.id ?? 0,
  });

  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Récupère la liste des formateurs, pour remplir le menu déroulant
  // de sélection du formateur assigné.
  useEffect(() => {
    api.get<Formateur[]>('/formateurs').then((res) => setFormateurs(res.data)).catch(() => {
      // Si cette requête échoue, le formulaire reste utilisable mais
      // le menu déroulant sera vide ; l'erreur principale du formulaire
      // (si elle survient à la soumission) restera visible séparément.
    });
  }, []);

  // En mode édition, charge les données actuelles de la préparation.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/preparations/${id}`)
      .then((res) => {
        const p = res.data;
        setFormData({
          id: p.id,
          subject: p.subject,
          startDate: toDatetimeLocal(p.startDate),
          endDate: toDatetimeLocal(p.endDate),
          status: p.status,
          formateurId: p.formateurId,
        });
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération de la préparation:', err);
        setError('Impossible de récupérer cette préparation.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'formateurId' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Filet de sécurité : si formateurId est resté à 0 (ex. : l'utilisateur
    // connecté n'était pas encore chargé au moment du pré-remplissage),
    // blocage ici avec un message clair
	
    if (!formData.formateurId) {
      setError('Veuillez sélectionner un formateur.');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/preparations/${id}`, { ...formData, id: Number(id) });
      } else {
        await api.post('/preparations', formData);
      }
      navigate('/preparations');
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde de la préparation:', err);
      let errorMessage = 'Impossible de sauvegarder la préparation.';
      if (err.response) {
        errorMessage += ` Code HTTP : ${err.response.status}`;
        if (err.response.data?.Error) {
          errorMessage += ` - ${err.response.data.Error}`;
        }
        if (err.response.status === 403) {
          errorMessage = "Vous n'avez pas le droit de modifier cette préparation (seul son créateur ou un administrateur le peut).";
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

  if (loading && isEditMode) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement de la préparation...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}>
              <h1 className="h4 mb-0">
                {isEditMode ? 'Modifier la préparation' : 'Nouvelle préparation'}
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
                  <label htmlFor="subject" className="form-label">Sujet *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Ex : Formation SQL Avancé"
                  />
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="startDate" className="form-label">Date et heure de début *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="endDate" className="form-label">Date et heure de fin *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                    <div className="form-text">Doit être après la date de début.</div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="formateurId" className="form-label">Formateur assigné *</label>
                    <select
                      className="form-select"
                      id="formateurId"
                      name="formateurId"
                      value={formData.formateurId}
                      onChange={handleChange}
                      required
                    >
                      <option value={0} disabled>Sélectionner un formateur</option>
                      {formateurs.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="status" className="form-label">Statut *</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary me-md-2"
                    onClick={() => navigate('/preparations')}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Enregistrement...
                      </>
                    ) : isEditMode ? 'Modifier' : 'Créer'}
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

export default PreparationsForm;
