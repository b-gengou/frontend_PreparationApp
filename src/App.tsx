// Composant racine. Déclaration de toutes les routes disponibles
// + applique la protection nécessaire (ProtectedRoute) sur celles qui
// exigent d'être connecté, ou d'être administrateur.
//  !!! <BrowserRouter> et <AuthProvider> sont déclarés une seule fois,
// dans main.tsx, et englobent ce composant : il ne faut JAMAIS JAMAIS les
// redéclarer ici, sinon, bardaf ça cassera la navigation (deux routeurs
// imbriqués entrent en conflit).

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PreparationReportPage from './pages/PreparationReportPage';

import FormateursList from './components/FormateursList';
import FormateursForm from './components/FormateursForm';
import PreparationsList from './components/PreparationsList';
import PreparationsForm from './components/PreparationsForm';
import PreparationDetails from './components/PreparationDetails';
import ResourcesList from './components/ResourcesList';
import ResourcesForm from './components/ResourcesForm';

const App: React.FC = () => {
  return (
    <>
      {/* La Navbar sera affichée sur toutes les pages : dont login/register
          (elle s'adapte elle-même selon que l'utilisateur est connectée ou non,
          voir Navbar.tsx). */}
      <Navbar />

      <Routes>
        {/* Routes publiques : accessibles sans être connecté.e.*/}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes protégées : nécessitent d'être connecté.e. ProtectedRoute
         * redirige automatiquement vers /login si ce n'est pas le cas
         * vérifier components/ProtectedRoute.tsx).*/}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* --- Formateurs --- */}
        <Route
          path="/formateurs"
          element={
            <ProtectedRoute>
              <FormateursList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/formateurs/new"
          element={
            // adminOnly : seul un administrateur peut créer un formateur
            // directement (POST /api/formateurs, policy "AdminOnly" côté
            // backend - voir FormateursController.cs).
            <ProtectedRoute adminOnly>
              <FormateursForm />
            </ProtectedRoute>
          }
        />

        {/* --- Préparations --- */}
        <Route
          path="/preparations"
          element={
            <ProtectedRoute>
              <PreparationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preparations/new"
          element={
            <ProtectedRoute>
              <PreparationsForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preparations/:id"
          element={
            <ProtectedRoute>
              <PreparationDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preparations/:id/edit"
          element={
            <ProtectedRoute>
              <PreparationsForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preparations/:id/report"
          element={
            <ProtectedRoute>
              <PreparationReportPage />
            </ProtectedRoute>
          }
        />

        {/* --- Catalogue de ressources --- */}
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <ResourcesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/new"
          element={
            <ProtectedRoute>
              <ResourcesForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/:id/edit"
          element={
            <ProtectedRoute>
              <ResourcesForm />
            </ProtectedRoute>
          }
        />

        {/* Route de secours : toute URL non reconnue redirige vers l'accueil.*/}
        <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

export default App;
