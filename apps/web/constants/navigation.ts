import {
  Layers,
  LayoutDashboard,
  Package,
  QrCode,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react";
import type { NavigationItem } from "@/types/navigation";

const MAIN_ITEMS: NavigationItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Appareils", href: "/devices", icon: Smartphone, enabled: true, badge: "alerts" },
  { label: "Politiques", href: "/policies", icon: ShieldCheck, enabled: false },
  { label: "Enrôlement", href: "/enrollment", icon: QrCode, enabled: false },
  { label: "Applications", href: "/applications", icon: Package, enabled: false },
  { label: "Commandes", href: "/commands", icon: Send, enabled: false },
];

const ADMIN_ITEMS: NavigationItem[] = [
  { label: "Groupes", href: "/groups", icon: Layers, enabled: false },
  { label: "Réseaux Wi-Fi", href: "/wifi-networks", icon: Wifi, enabled: false },
  { label: "Journal d'audit", href: "/audit", icon: ScrollText, enabled: false },
  { label: "Paramètres", href: "/settings", icon: Settings, enabled: false },
];

export const NAVIGATION = {
  brand: "Open MDM",
  group: {
    main: "Parc",
    admin: "Administration",
  },
  main: MAIN_ITEMS,
  admin: ADMIN_ITEMS,
  alertsLabel: "alertes",
  broker: {
    title: "Broker MQTT",
    connected: "appareils connectés",
  },
} as const;
