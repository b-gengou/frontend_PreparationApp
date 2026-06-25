// Page d'inscription. Crée un nouveau formateur (rôle "2" par défaut,
// attribué automatiquement par le backend - cf. AuthController.cs).
// Il n'est jms possible de s'inscrire directement en tant qu'administrateur
// depuis ce formulaire : c'est une règle de sécurité imposée par le backend.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Vérif. côté frontend avant d'appeler le backend :
    // évite un aller-retour réseau inutile pour une erreur classique.
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      // Le backend renvoie { message: "Un formateur avec cet email existe déjà." }
      // si le courriel est déjà pris (voir AuthController.cs, méthode Register).
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || "Impossible de créer le compte. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 text-center mb-4">Créer un compte</h1>

              {error && (
                <div className="app-alert app-alert-danger" role="alert">
                  <span className="app-alert-icon" aria-hidden="true">⚠</span>
                  <div><strong>Erreur : </strong>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <div className="form-text">Au moins 6 caractères.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                      Création en cours...
                    </>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;