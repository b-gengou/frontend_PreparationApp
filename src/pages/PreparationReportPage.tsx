/** Page du compte-rendu d'une préparation (PreparationReportsController.cs).
 * Comportement :
 * a) Si un compte-rendu existe déjà pour cette préparation, on l'affiche
 *    en lecture, avec un bouton "Modifier" si la personne en a le droit.
 * b) Sinon, affichage du formulaire de création.
 * Précision technique : le backend n'offre pas de route directe
 * "GET /api/preparationreports/by-preparation/{id}" - récupération, de fait, de la
 * liste complète des comptes-rendus (GET /api/preparationreports) et filtrage
 * côté frontend par preparationId. 
 * Cela pourrait être sujet a une amélioration pour obtenir un vrai volume de données,
 * il faudrait, alors, ajouter une route dédiée côté backend.
 * Règles/Droits : seul le formateur assigné à la préparation, ou un administrateur,
 * peut créer/modifier un compte-rendu (même règle que côté backend).
 */
 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import type { Preparation, PreparationReport, PreparationReportPayload } from '../types/models';

// Champs vides par défaut pour démarrer un nouveau compte-rendu.
const emptyForm: PreparationReportPayload = {
  subjectsCovered: '',
  dailyObjectives: '',
  referenceSupports: '',
  directoryLink: '',
  modifiedFiles: '',
  newExercises: '',
  workDirectoryLink: '',
  plannedDate: '',
  courseDurationDays: 1,
  technicalIssues: '',
  secondOpinionNeed: '',
  secondOpinionAction: '',
  timeSpent: '',
  preparationId: 0,
};

const PreparationReportPage: React.FC = () => {
  const { id: preparationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [report, setReport] = useState<PreparationReport | null>(null);
  const [formData, setFormData] = useState<PreparationReportPayload>(emptyForm);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preparationId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const prepRes = await api.get<Preparation>(`/preparations/${preparationId}`);
        setPreparation(prepRes.data);

        const reportsRes = await api.get<PreparationReport[]>('/preparationreports');
        const existing = reportsRes.data.find(
          (r) => r.preparationId === Number(preparationId)
        );

        if (existing) {
          setReport(existing);
          setFormData({
            id: existing.id,
            subjectsCovered: existing.subjectsCovered,
            dailyObjectives: existing.dailyObjectives,
            referenceSupports: existing.referenceSupports,
            directoryLink: existing.directoryLink,
            modifiedFiles: existing.modifiedFiles,
            newExercises: existing.newExercises,
            workDirectoryLink: existing.workDirectoryLink,
            plannedDate: existing.plannedDate?.substring(0, 10) ?? '',
            courseDurationDays: existing.courseDurationDays,
            technicalIssues: existing.technicalIssues,
            secondOpinionNeed: existing.secondOpinionNeed,
            secondOpinionAction: existing.secondOpinionAction,
            timeSpent: existing.timeSpent,
            preparationId: existing.preparationId,
          });
        } else {
          // Pas encore de compte-rendu : on prépare un formulaire vide,
          // déjà rattaché à cette préparation, puis l'on passe directement
          // en mode édition.
          setFormData({ ...emptyForm, preparationId: Number(preparationId) });
          setIsEditing(true);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement du compte-rendu:', err);
        setError(err.response?.data?.Error || 'Impossible de charger les informations.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [preparationId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'courseDurationDays' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (report) {
        await api.put(`/preparationreports/${report.id}`, { ...formData, id: report.id });
      } else {
        await api.post('/preparationreports', formData);
      }
      navigate(`/preparations/${preparationId}`);
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde du compte-rendu:', err);
      let message = 'Impossible de sauvegarder le compte-rendu.';
      if (err.response?.status === 403) {
        message = "Vous n'avez pas le droit de modifier ce compte-rendu (seul le formateur assigné ou un administrateur le peut).";
      } else if (err.response?.data?.Error) {
        message = err.response.data.Error;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" style={{ color: 'var(--color-brand)' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error && !preparation) {
    return (
      <div className="container mt-4">
        <div className="app-alert app-alert-danger" role="alert">
          <span className="app-alert-icon" aria-hidden="true">⚠</span>
          {error}
        </div>
      </div>
    );
  }

  const canEdit = isAdmin || preparation?.formateurId === user?.id;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h3 mb-0">
              Compte-rendu : {preparation?.subject}
            </h1>
            <Link to={`/preparations/${preparationId}`} className="btn btn-sm btn-outline-secondary">
              ← Retour à la préparation
            </Link>
          </div>

          {error && (
            <div className="app-alert app-alert-danger mb-3" role="alert">
              <span className="app-alert-icon" aria-hidden="true">⚠</span>
              {error}
            </div>
          )}

          {!canEdit && !report && (
            <div className="app-alert app-alert-info" role="status">
              <span className="app-alert-icon" aria-hidden="true">ℹ</span>
              Aucun compte-rendu n'a encore été rédigé pour cette préparation.
              Seul le formateur assigné ou un administrateur peut en créer un.
            </div>
          )}

          {/* Mode lecture : un compte-rendu existe et on n'est pas en édition */}
          {report && !isEditing && (
            <div className="card">
              <div className="card-body">
                <dl className="row mb-0">
                  <dt className="col-sm-4">Sujet(s) abordé(s)</dt>
                  <dd className="col-sm-8">{report.subjectsCovered}</dd>

                  <dt className="col-sm-4">Objectif(s) de la journée</dt>
                  <dd className="col-sm-8">{report.dailyObjectives}</dd>

                  <dt className="col-sm-4">Supports de référence</dt>
                  <dd className="col-sm-8">{report.referenceSupports || '—'}</dd>

                  <dt className="col-sm-4">Lien du répertoire</dt>
                  <dd className="col-sm-8">
                    {report.directoryLink ? (
                      <a href={report.directoryLink} target="_blank" rel="noopener noreferrer">
                        {report.directoryLink}
                      </a>
                    ) : '—'}
                  </dd>

                  <dt className="col-sm-4">Fichiers modifiés</dt>
                  <dd className="col-sm-8">{report.modifiedFiles || '—'}</dd>

                  <dt className="col-sm-4">Nouveaux exercices</dt>
                  <dd className="col-sm-8">{report.newExercises || '—'}</dd>

                  <dt className="col-sm-4">Durée du cours</dt>
                  <dd className="col-sm-8">{report.courseDurationDays} jour(s)</dd>

                  <dt className="col-sm-4">Points d'achoppement</dt>
                  <dd className="col-sm-8">{report.technicalIssues || 'Aucun'}</dd>

                  <dt className="col-sm-4">Besoin d'un second avis</dt>
                  <dd className="col-sm-8">{report.secondOpinionNeed || 'Non précisé'}</dd>

                  <dt className="col-sm-4">Temps consacré</dt>
                  <dd className="col-sm-8">{report.timeSpent || 'Non précisé'}</dd>
                </dl>

                {canEdit && (
                  <button className="btn btn-outline-primary mt-2" onClick={() => setIsEditing(true)}>
                    Modifier le compte-rendu
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mode édition : création ou modification */}
          {isEditing && canEdit && (
            <form onSubmit={handleSubmit} className="card card-body">
              <div className="mb-3">
                <label htmlFor="subjectsCovered" className="form-label">Sujet(s) abordé(s) *</label>
                <textarea
                  className="form-control"
                  id="subjectsCovered"
                  name="subjectsCovered"
                  rows={2}
                  value={formData.subjectsCovered}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="dailyObjectives" className="form-label">Objectif(s) de la journée *</label>
                <textarea
                  className="form-control"
                  id="dailyObjectives"
                  name="dailyObjectives"
                  rows={2}
                  value={formData.dailyObjectives}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="referenceSupports" className="form-label">Supports de référence</label>
                <textarea
                  className="form-control"
                  id="referenceSupports"
                  name="referenceSupports"
                  rows={2}
                  value={formData.referenceSupports}
                  onChange={handleChange}
                />
              </div>

              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="directoryLink" className="form-label">Lien du répertoire</label>
                  <input
                    type="url"
                    className="form-control"
                    id="directoryLink"
                    name="directoryLink"
                    value={formData.directoryLink}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="workDirectoryLink" className="form-label">Lien du répertoire de travail</label>
                  <input
                    type="url"
                    className="form-control"
                    id="workDirectoryLink"
                    name="workDirectoryLink"
                    value={formData.workDirectoryLink}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="modifiedFiles" className="form-label">Fichiers modifiés</label>
                <input
                  type="text"
                  className="form-control"
                  id="modifiedFiles"
                  name="modifiedFiles"
                  value={formData.modifiedFiles}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="newExercises" className="form-label">Nouveaux exercices</label>
                <input
                  type="text"
                  className="form-control"
                  id="newExercises"
                  name="newExercises"
                  value={formData.newExercises}
                  onChange={handleChange}
                />
              </div>

              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="plannedDate" className="form-label">Date planifiée de la matière *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="plannedDate"
                    name="plannedDate"
                    value={formData.plannedDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="courseDurationDays" className="form-label">Durée du cours (jours) *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="courseDurationDays"
                    name="courseDurationDays"
                    min={1}
                    value={formData.courseDurationDays}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="technicalIssues" className="form-label">Points d'achoppement</label>
                <textarea
                  className="form-control"
                  id="technicalIssues"
                  name="technicalIssues"
                  rows={2}
                  value={formData.technicalIssues}
                  onChange={handleChange}
                />
              </div>

              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="secondOpinionNeed" className="form-label">Besoin d'un second avis</label>
                  <input
                    type="text"
                    className="form-control"
                    id="secondOpinionNeed"
                    name="secondOpinionNeed"
                    value={formData.secondOpinionNeed}
                    onChange={handleChange}
                    placeholder="Ex : Oui / Non"
                  />
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label htmlFor="timeSpent" className="form-label">Temps consacré</label>
                  <input
                    type="text"
                    className="form-control"
                    id="timeSpent"
                    name="timeSpent"
                    value={formData.timeSpent}
                    onChange={handleChange}
                    placeholder="Ex : 3h30"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="secondOpinionAction" className="form-label">Action si second avis nécessaire</label>
                <textarea
                  className="form-control"
                  id="secondOpinionAction"
                  name="secondOpinionAction"
                  rows={2}
                  value={formData.secondOpinionAction}
                  onChange={handleChange}
                />
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                {report && (
                  <button
                    type="button"
                    className="btn btn-secondary me-md-2"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : report ? 'Modifier' : 'Créer le compte-rendu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparationReportPage;
