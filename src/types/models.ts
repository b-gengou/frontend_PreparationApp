// Types TypeScript centralisés, qui doivent rester rigoureusement alignés
// avec les modèles C# du backend (cf. dossier PreparationApp.Backend/ModelsBD/).
// Si un champ change côté backend, ce fichier doit être mis à jour en
// 1er, et tous les composants qui l'utilisent suivront grâce au
// typage strict de TypeScript (toute incohérence sera détectée à la
// compilation, avant même de tester dans le navigateur).

// Correspond à Formateur.cs (backend).
export interface Formateur {
  id: number;
  name: string;
  email: string;
  // Le mot de passe n'est jamais renvoyé par le backend dans les réponses
  // (il ne doit jms apparaître dans le frontend après la création).
  role: '1' | '2'; // "1" = administrateur, "2" = formateur
  googleCalendarId: string;
}

// Donnée envoyée lors de la création d'un formateur par un admin
// (POST /api/formateurs, réservé à l'administrateur - cf. FormateursController.cs).
export interface FormateurCreatePayload {
  name: string;
  email: string;
  password: string;
  role: '1' | '2';
  googleCalendarId: string;
}

// Correspond à Preparation.cs (backend).
export interface Preparation {
  id: number;
  subject: string;
  startDate: string;   // Format ISO 8601 (ex: "2026-06-22T09:00:00")
  endDate: string;
  status: string;      // "Upcoming", "InProgress", "Completed"...
  googleEventId: string | null;
  formateurId: number;
  formateur?: Formateur;     // Présent si c'est inclus dans le code dans le backend (.Include())
  createdById: number;
  createdBy?: Formateur;
  createdAt: string;
  updatedAt: string | null;
}

// Donnée envoyée lors de la création/modification d'une préparation.
export interface PreparationPayload {
  id?: number; // Présent  - uniquement - lors d'une modification (PUT).
  subject: string;
  startDate: string;
  endDate: string;
  status: string;
  formateurId: number;
}

// Correspond à PreparationReport.cs (backend), restructuré pour suivre
// le dictionnaire de données du cahier des charges.
export interface PreparationReport {
  id: number;
  subjectsCovered: string;
  dailyObjectives: string;
  referenceSupports: string;
  directoryLink: string;
  modifiedFiles: string;
  newExercises: string;
  workDirectoryLink: string;
  plannedDate: string;
  courseDurationDays: number;
  technicalIssues: string;
  secondOpinionNeed: string;
  secondOpinionAction: string;
  timeSpent: string;
  email: string;
  createdAt: string;
  preparationId: number;
  preparation?: Preparation;
}

// Donnée envoyée lors de la création/modification d'un compte-rendu.
export interface PreparationReportPayload {
  id?: number;
  subjectsCovered: string;
  dailyObjectives: string;
  referenceSupports: string;
  directoryLink: string;
  modifiedFiles: string;
  newExercises: string;
  workDirectoryLink: string;
  plannedDate: string;
  courseDurationDays: number;
  technicalIssues: string;
  secondOpinionNeed: string;
  secondOpinionAction: string;
  timeSpent: string;
  preparationId: number;
}

// Correspond à Resource.cs (backend).
export interface Resource {
  id: number;
  name: string;
  url: string;
  type: string; // "PDF", "Vidéo", "Lien"...
  createdById: number;
  createdBy?: Formateur;
  createdAt: string;
}

// Donnée envoyée lors de la création/modification d'une ressource.
export interface ResourcePayload {
  id?: number;
  name: string;
  url: string;
  type: string;
}

// Filtres optionnels (recherche de ressources).
// (GET /api/resources?search=...&type=...&formateurId=...&date=...).
export interface ResourceFilters {
  search?: string;
  type?: string;
  formateurId?: number;
  date?: string;
}
