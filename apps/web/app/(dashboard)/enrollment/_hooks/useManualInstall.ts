import { useState } from "react";

// L'onglet « Manuel » montre une seule carte à la fois : la connexion USB par défaut, ou l'installation avec le code
// à saisir dans l'agent. Le code n'est donc généré qu'à l'ouverture de cette dernière.
export const useManualInstall = () => {
  const [withoutUsb, setWithoutUsb] = useState(false);

  return {
    withoutUsb,
    showWithoutUsb: () => setWithoutUsb(true),
    showUsb: () => setWithoutUsb(false),
  };
};
