// Composant utilitaire qui protège une route : si l'utilisateur n'est pas
// connecté, il est redirigé vers /login. Si la route exige le rôle admin
// (adminOnly=true) et que l'utilisateur connecté est un simple formateur,
// il est redirigé vers la page d'accueil.
// Ce composant complète, côté frontend, les vérifications de droits déjà
// faites côté backend (attribut [Authorize], policies "AdminOnly" /
// "FormateurOnly"). Il ne remplacera jamais la sécurité backend : il sert
// seulement à éviter d'afficher une page inutilisable, ou de laisser
// quelqu'un cliquer sur une action qui échouera avec un 403.


import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean; // Si true, seul un administrateur (rôle "1") peut accéder à cette route.
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Pendant la vérification initiale de la session (lecture de localStorage),
  // afficheage d'un indicateur de chargement plutôt que de rediriger trop tôt
  // (ce qui déconnecterait une personne déjà connectée lors d'un
  // simple rafraîchissement de page).
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Vérification de la connexion...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
