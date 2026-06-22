/* Config. de l'instance Axios pour les requêtes HTTP vers le backend.
 * a) URL de base du backend
 * b) En-têtes HTTP par défaut
 * c) Intercepteurs : ajout automatique du token JWT, et gestion centralisée
 *   des erreurs d'authentification (401) et d'autorisation (403).
 */
 
import axios from 'axios';

// Clef utilisée pour stocker les informations de connexion dans localStorage.
// Doit être - strictement - identique à celle utilisée dans AuthContext.tsx.
const STORAGE_KEY = 'preparationapp_auth';

/* Instance Axios configurée pour communiquer avec le backend.
 * - baseURL: URL de base de l'API backend
 * - headers: En-têtes HTTP par défaut pour toutes les requêtes
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL de base du backend .NET
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Intercepteur pour les requêtes sortantes.
 * Ajoute automatiquement le jeton JWT (s'il existe) dans l'en-tête
 * Authorization de chaque requête envoyée au backend, sous la forme
 * attendue par ASP.NET Core : "Bearer <token>".
 * Sans cet intercepteur, toutes les routes protégées par [Authorize]
 * côté backend renverraient systématiquement une erreur 401.
 */
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Contenu corrompu : on n'ajoute pas de token, la requête partira
        // simplement sans authentification (et échouera côté
        // backend avec un 401 si la route est protégée).
      }
    }
    return config;
  },
  (error) => {
    console.error('Erreur dans la requête:', error);
    return Promise.reject(error);
  }
);

/* Intercepteur pour les réponses entrantes.
 * Gère les erreurs globales, et en particulier les erreurs d'authentification.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Erreur dans la réponse:', error);

    // 401 = le token est absent, invalide ou a expiré : déconnexion
    // automatique de la personne, et elle est renvoyée vers la page de login.
    // Cela évite qu'elle reste bloquée dans un état "connecté" qui ne
    // fonctionne plus réellement côté backend.
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      // On utilise window.location plutôt que react-router ici, car ce
      // fichier n'est pas un composant React et n'a pas accès à useNavigate().
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Personnalisation des messages d'erreur réseau, affichés tels quels
    // dans les composants qui interceptent ces erreurs.
    if (error.code === 'ECONNABORTED') {
      error.message = 'La requête a pris trop de temps. Veuillez réessayer.';
    } else if (!error.response) {
      error.message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else if (error.response.status === 403) {
      error.message = "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
    }

    return Promise.reject(error);
  }
);

export default api;
