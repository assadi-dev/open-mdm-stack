"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdbContext } from "@/hooks/useAdb";
import type { AdbSession } from "@/lib/adb/adb-session";

type AdbProviderProps = {
  children: ReactNode;
};

// L'appareil branché en USB pour tout le dashboard : connecté depuis une page, il le reste quand on en change.
export const AdbProvider = ({ children }: AdbProviderProps) => {
  const [session, setSession] = useState<AdbSession | null>(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
    if (!session) return;

    // Câble débranché ou connexion tombée : l'état ne doit pas garder une session morte.
    const clear = () => setSession((current) => (current === session ? null : current));
    session.adb.disconnected.then(clear, clear);
  }, [session]);

  // Quitter le dashboard (déconnexion de l'utilisateur) ferme la connexion : sinon l'interface USB resterait réservée à
  // cette page, et la connexion suivante échouerait.
  useEffect(
    () => () => {
      sessionRef.current?.adb.close().catch(() => undefined);
    },
    [],
  );

  return <AdbContext value={{ session, setSession }}>{children}</AdbContext>;
};
