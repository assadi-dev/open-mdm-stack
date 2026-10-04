import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ENROLLMENT_METHOD_KEYS } from "../_dto/enrollment.dto";

// L'onglet actif vit dans l'URL (`?method=manual`) : un lien partagé ou un rechargement rouvre la même méthode.
// Le QR code, valeur par défaut, ne s'écrit pas dans l'URL.
const METHOD_PARSER = parseAsStringLiteral(ENROLLMENT_METHOD_KEYS).withDefault("qr");

export const useEnrollmentMethod = () => {
  const [method, setMethod] = useQueryState("method", METHOD_PARSER);
  return { method, setMethod };
};
