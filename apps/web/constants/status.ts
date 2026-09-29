import type { StatusTone } from "@/types/status";

type StatusDefinition = {
  label: string;
  tone: StatusTone;
};

export const STATUS = {
  online: { label: "En ligne", tone: "success" },
  offline: { label: "Hors ligne", tone: "danger" },
  compliant: { label: "Conforme", tone: "success" },
  nonCompliant: { label: "Non conforme", tone: "danger" },
  pending: { label: "En attente", tone: "warning" },
  enrolling: { label: "Enrôlement", tone: "warning" },
  failed: { label: "Échec", tone: "danger" },
  commandRunning: { label: "Commande en cours", tone: "info" },
  running: { label: "En cours", tone: "info" },
} as const satisfies Record<string, StatusDefinition>;
