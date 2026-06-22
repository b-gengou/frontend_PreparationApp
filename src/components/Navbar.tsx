/** Barre de navigation commune à toutes les pages de l'application.
 * Utilisation de Bootstrap pour la structure responsive (menu hamburger sur mobile,
 * menu horizontal sur tablette/PC - voir la classe "navbar-expand-lg" qui
 * bascule à partir de 992px de largeur).
 * Affiche le nom et le rôle de la personne connectée, adapte les liens
 * visibles selon son rôle (ex. : "Ajouter un formateur" réservé à l'admin),
 * et propose un bouton de déconnexion.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessibilityToggle from './AccessibilityToggle';

const Navbar: React.FC = () => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: 'var(--color-brand)' }}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          PreparationApp
        </Link>

        {/* Bouton hamburger, visible sous 992px de largeur (tablette/mobile) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Afficher ou masquer le menu de navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Accueil</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/preparations">Préparations</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/resources">Catalogue</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/formateurs">Formateurs</Link>
              </li>
            </ul>
          )}

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
            <AccessibilityToggle />

            {isAuthenticated ? (
              <>
                {/* "Ajouter un formateur" n'est utile qu'à un administrateur
                    (seul rôle autorisé par POST /api/formateurs côté backend) :
                    cela évite d'afficher un lien qui échouerait avec un 403. */}
                {isAdmin && (
                  <Link className="btn btn-light btn-sm" to="/formateurs/new">
                    + Formateur
                  </Link>
                )}
                <Link className="btn btn-light btn-sm" to="/preparations/new">
                  + Préparation
                </Link>

                <span className="navbar-text text-white ms-lg-2">
                  {user?.name}
                  {' '}
                  <span className="app-badge-role app-badge-role-formateur" style={{ marginLeft: '4px' }}>
                    {isAdmin ? 'Admin' : 'Formateur'}
                  </span>
                </span>

                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link className="btn btn-light btn-sm" to="/login">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
