// Page de connexion. Demande le courriel et le mot de passe, les envoie au
// backend via le contexte d'authentification (AuthContext), et redirige
// vers la page d'accueil en cas de succès.

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Même clef que celle posée par l'intercepteur Axios dans api.ts, juste
// avant la redirection automatique vers /login suite à un 401.
const SESSION_EXPIRED_KEY = 'preparationapp_session_expired';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Distinct de `error` : ce n'est pas une erreur de saisie du formulaire,
  // juste une info neutre expliquant pourquoi on atterrit sur cette page.
  // Affiché en bleu (app-alert-info), jamais en rouge, pour ne pas donner
  // l'impression à la personne qu'elle a fait quelque chose de mal.
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  // Au chargement de la page, vérif. si l'intercepteur Axios (api.ts)
  // vient de nous rediriger ici suite à une expiration de session (401).
  // On supprime le drapeau immédiatement après lecture : sinon le message
  // réapparaîtrait à chaque rechargement manuel de la page de login, même
  // longtemps après la déconnexion réelle.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_EXPIRED_KEY)) {
      setSessionExpired(true);
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    }
  }, []);

  // Soumission du formulaire de connexion.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSessionExpired(false);

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

              {sessionExpired && (
                // role="status" (pas "alert") : c'est une info neutre, pas
                // une erreur urgente — annoncée aux lecteurs d'écran sans
                // l'intonation "alarme" réservée aux vraies erreurs.
                <div className="app-alert app-alert-info" role="status">
                  <span className="app-alert-icon" aria-hidden="true">ℹ</span>
                  <div>Votre session a expiré. Veuillez vous reconnecter.</div>
                </div>
              )}

              {error && (
                // role="alert" : annonce - immédiatement - le message aux lecteurs
                // d'écran, sans attendre que la personne navigue jusqu'à lui.
                // L'icône ⚠ renforce visuellement le message sans dépendre
                // uniquement de la couleur (cf. section accessibilité).
                <div className="app-alert app-alert-danger" role="alert">
                  <span className="app-alert-icon" aria-hidden="true">⚠</span>
                  <div><strong>Erreur : </strong>{error}</div>
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

             
			  
			  
			  
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;