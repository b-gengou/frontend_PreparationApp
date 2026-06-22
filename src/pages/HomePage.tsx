// Page d'accueil affichée après connexion. Sert de point de repère 
// et de raccourcis vers les sections principales de l'application.

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1 className="display-6">Bienvenue, {user?.name} !</h1>
        <p className="lead text-secondary">
          {isAdmin
            ? 'Vous êtes connecté en tant qu\u2019administrateur.'
            : 'Vous êtes connecté en tant que formateur.'}
        </p>
      </div>

      {/* Grille de raccourcis : col-12 en mobile (empilé), col-md-4 sur
          tablette/PC (3 colonnes) - responsive via les classes Bootstrap. */}
      <div className="row g-4">
        <div className="col-12 col-md-4">
          <Link to="/preparations" className="card text-decoration-none h-100" style={{ color: 'var(--color-text-primary, inherit)' }}>
            <div className="card-body text-center">
              <h2 className="h5">Préparations</h2>
              <p className="text-secondary mb-0">
                Consulter, créer et synchroniser vos préparations de formation.
              </p>
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-4">
          <Link to="/resources" className="card text-decoration-none h-100" style={{ color: 'var(--color-text-primary, inherit)' }}>
            <div className="card-body text-center">
              <h2 className="h5">Catalogue des supports</h2>
              <p className="text-secondary mb-0">
                Rechercher et partager les ressources pédagogiques.
              </p>
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-4">
          <Link to="/formateurs" className="card text-decoration-none h-100" style={{ color: 'var(--color-text-primary, inherit)' }}>
            <div className="card-body text-center">
              <h2 className="h5">Formateurs</h2>
              <p className="text-secondary mb-0">
                Voir la liste des formateurs de l'équipe.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
