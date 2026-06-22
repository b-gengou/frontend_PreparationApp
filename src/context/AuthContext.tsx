// AuthContext centralise tout ce qui concerne l'utilisateur connecté :
// son identifiant, son nom, son rôle, et le token JWT qui prouve son identité
// auprès du backend.
// "Contexte" React = une boîte d'informations partagée, accessible depuis
// n'importe quel composant de l'application sans avoir à la repasser
// manuellement de composant en composant (c'est du "prop drilling",
// et le Context permet justement de l'éviter).

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/api';

// Forme des informations sur l'utilisateur connecté, telles que renvoyées par
// le backend après un login ou un register réussi (voir AuthController.cs).

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: '1' | '2'; // "1" = administrateur, "2" = formateur (voir Formateur.cs côté backend)
}

// Forme de tout ce que le contexte d'authentification expose aux composants
// qui l'utilisent (via useAuth(), cf. plus bas).

interface AuthContextType {
  user: AuthUser | null;          // null = personne n'est connecté
  token: string | null;           // le jeton JWT brut, utile pour cas particuliers
  isAuthenticated: boolean;       // pratique pour écrire "if (isAuthenticated)" sans relire "user !== null"
  isAdmin: boolean;                // pratique pour écrire "if (isAdmin)" dans les composants
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;               // true pendant la vérif. d'une session déjà active
}

// Création du contexte avec une valeur par défaut "undefined" : cela permet
// de détecter, via useAuth(), un possible mauvais usage (utiliser useAuth()
// hors d'un <AuthProvider>), et de lever une erreur claire plutôt qu'un bug
// énigmatique/silencieux.

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clef utilisée pour stocker les informations dans localStorage du navigateur.
const STORAGE_KEY = 'preparationapp_auth';

// AuthProvider : composant qui "fournit" le contexte à toute l'application.
// Enroulé autour de <App /> dans main.tsx, pour que tous les composants
// enfants puissent accéder aux informations de connexion via useAuth().

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Au 1er chargement de l'application (ex. : rafraîchissement de page),
  // vérifie si une session existait déjà dans localStorage, pour éviter
  // de déconnecter l'utilisateur à chaque rechargement de page.

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        // Si le contenu stocké est corrompu ou illisible, il est ignoré
        // "proprement" plutôt que de planter l'application.
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Connexion : envoie le courriel et le mot de passe au backend, récupère
  // le token JWT et les infos de l'utilisateur, et les stocke
  // à la fois en mémoire (state React) et dans localStorage (persistance).

	const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, id, name, email: userEmail, role } = response.data;

    const authUser: AuthUser = { id, name, email: userEmail, role };

    setUser(authUser);
    setToken(newToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: authUser, token: newToken }));
  };

  // Inscription : crée un nouveau formateur (rôle "2" par défaut, attribué
  // automatiquement par le backend), puis connecte immédiatement la personne
  // avec le token renvoyé par register.

	const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token: newToken, id, name: userName, email: userEmail, role } = response.data;

    const authUser: AuthUser = { id, name: userName, email: userEmail, role };

    setUser(authUser);
    setToken(newToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: authUser, token: newToken }));
  };

  // Déconnexion : efface les informations en mémoire et dans localStorage.
  // Le backend n'a pas besoin d'être notifié, car le token expirera de
  // lui-même après 12h (cf. AuthController.cs) ; ici, on oublie le token côté navigateur.

	const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: user !== null,
    isAdmin: user?.role === '1',
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour consommer le contexte facilement depuis n'importe
// quel composant : const { user, isAdmin, logout } = useAuth();

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un <AuthProvider>.');
  }
  return context;
};
