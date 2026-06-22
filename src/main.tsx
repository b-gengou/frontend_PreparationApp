// Point d'entrée de l'application frontend.
// Enveloppe <App /> dans <BrowserRouter> (navigation par URL) et
// <AuthProvider> (contexte d'authentification, cf. context/AuthContext.tsx),
// pour que tous les composants de l'application, à n'importe quelle
// profondeur, puissent utiliser useNavigate(), <Link>, et useAuth().

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'; // CSS de Bootstrap (composants, grille)
import './index.css'
import './styles/accessibility.css' // Palette pour daltonisme + mode contraste élevé
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
