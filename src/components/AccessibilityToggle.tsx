// Bouton, affiché dans la Navbar, qui permet à l'utilisateur d'activer
// un mode "contraste élevé" (bordures plus marquées, texte plus foncé).
// Utile en complément de la palette daltonisme appliquée par défaut
// (cf. styles/accessibility.css), pour les personnes qui ont besoin
// d'un contraste renforcé (daltonisme sévère, basse vision, ou simplement
// une préférence personnelle).
// Le choix de la personne est mémorisé dans localStorage, pour rester actif
// d'une visite à l'autre.


import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'preparationapp_high_contrast';

const AccessibilityToggle: React.FC = () => {
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Au premier affichage, on relit la préférence déjà enregistrée (s'il y
  // en a une), pour que le mode contraste élevé reste actif après un
  // rechargement de page.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isEnabled = stored === 'true';
    setHighContrast(isEnabled);
    document.body.classList.toggle('high-contrast', isEnabled);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    document.body.classList.toggle('high-contrast', newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-light"
      onClick={toggleHighContrast}
      // aria-pressed indique aux lecteurs d'écran si le bouton est
      // actuellement "activé" ou non, comme une case à cocher.
      aria-pressed={highContrast}
      title="Activer ou désactiver le mode contraste élevé"
    >
      {/* Le symbole ainsi que le texte changent ensemble : l'état n'est
          jamais signalé par la couleur seule. */}
      {highContrast ? '◐ Contraste élevé : activé' : '◑ Contraste élevé'}
    </button>
  );
};

export default AccessibilityToggle;
