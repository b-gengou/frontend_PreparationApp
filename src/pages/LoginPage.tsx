// Page de connexion. Demande le courriel et le mot de passe, les envoie au
// backend via le contexte d'authentification (AuthContext), et redirige
// vers la page d'accueil en cas de succès.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Soumission du formulaire de connexion.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      // Connexion réussie : redirection vers la page d'accueil.
      navigate('/');
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      // Le backend renvoie { message: "Email ou mot de passe incorrect." }
      // en cas d'échec (voir AuthController.cs, méthode Login).
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Impossible de se connecter. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        {/* col-12 sur mobile (pleine largeur), col-md-6 sur tablette/PC */}
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 text-center mb-4">Connexion</h1>

              {error && (
                // role="alert" : annonce - immédiatement - le message aux lecteurs
                // d'écran, sans attendre que la personne navigue jusqu'à lui.
                // L'icône ⚠ renforce visuellement le message sans dépendre
                // uniquement de la couleur (cf. section accessibilité).
                <div className="alert alert-danger" role="alert">
                  <strong>⚠ Erreur : </strong>{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="vous@cognitic.be"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Pas encore de compte ?{' '}
                <Link to="/register">Créer un compte</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
