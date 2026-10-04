import { createContext, useContext } from "react";
import type { AdbSession } from "@/lib/adb/adb-session";

type AdbContextValue = {
  // `null` tant qu'aucun appareil n'est connecté et autorisé.
  session: AdbSession | null;
  setSession: (session: AdbSession | null) => void;
};

export const AdbContext = createContext<AdbContextValue | null>(null);

// L'appareil branché en USB, partagé par tout le dashboard (`AdbProvider`).
export const useAdb = () => {
  const context = useContext(AdbContext);
  if (!context) throw new Error("useAdb must be used within <AdbProvider />");
  return context;
};
