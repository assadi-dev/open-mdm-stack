import type { Adb } from "@yume-chan/adb";
import { startActivity } from "@/lib/adb/adb-activity";
import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { EnrollmentDto } from "../_dto/enrollment.dto";
import { ENROLLMENT_OPTIONS_MOCK, simulateLatency } from "../_mocks/enrollment.mock";
import type { ProvisioningInput, UsbEnrollmentInput } from "../_types/enrollment.types";
import { toAgentDownloadUrl, wait } from "./enrollment.utils";

// Le QR code, le code à saisir dans l'agent et les réseaux Wi-Fi passent par le proxy Next (`app/api/v1/(enrollment)` et
// `(wifi-networks)`) vers l'API. Le reste vient de `_mocks/` tant que le dashboard n'est pas branché dessus : groupes,
// politiques et agent par défaut (l'API n'en expose pas), et l'enrôlement par USB. La connexion de l'appareil USB
// (`lib/adb/adb-session.ts`) n'est pas un appel d'API : elle est partagée par tout le dashboard.
// Passer au réel : remplacer chaque mock par l'appel au proxy ou à l'ADB du navigateur, le parsing Zod reste identique.
const QR_CODE_URL = "/api/v1/enrollment/qr-code";
const CODE_URL = "/api/v1/enrollment/code";
const WIFI_NETWORKS_URL = "/api/v1/wifi-networks";
const JSON_HEADERS = { "Content-Type": "application/json" };
// Le plafond de l'API (`MAX_LIMIT`) : le formulaire propose tous les réseaux enregistrés, sans pagination.
const WIFI_NETWORKS_QUERY = "limit=100&sort=ssid";
// L'activité qui lance l'agent, `<package>/<activité>` (le package est `MDM_PACKAGE_NAME` côté API).
const AGENT_MAIN_ACTIVITY = "com.openmdm.agent/com.openmdm.agent.MainActivity";
// Le temps qu'Android prenne en compte l'agent qui vient d'être installé, avant de le lancer.
const AGENT_START_DELAY = 1000;

// Les réseaux Wi-Fi enregistrés (l'id est celui que l'API résout dans le QR code), le reste des choix est fictif.
export const fetchEnrollmentOptionsApi = async () => {
  const response = await fetch(`${WIFI_NETWORKS_URL}?${WIFI_NETWORKS_QUERY}`);
  if (!response.ok) throw createHttpError(response.status);
  const { data: wifiNetworks } = EnrollmentDto.parseWifiNetworks(await response.json());

  return EnrollmentDto.parseOptions({ ...ENROLLMENT_OPTIONS_MOCK, wifiNetworks });
};

// Chaque appel génère un nouveau QR code, avec la configuration reçue. Un Wi-Fi choisi y inscrit son nom et son mot de passe.
export const createEnrollmentQrApi = async (input: ProvisioningInput) => {
  const response = await fetch(QR_CODE_URL, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw createHttpError(response.status);
  return EnrollmentDto.parseQr(await response.json());
};

// Chaque appel génère un nouveau code (`GET /enrollment/otp-generate` côté API), à usage unique.
// `signal` annule la requête si la carte est quittée avant la réponse.
export const generateEnrollmentCodeApi = async (signal?: AbortSignal) => {
  const response = await fetch(CODE_URL, { method: "POST", signal });
  if (!response.ok) throw createHttpError(response.status);
  return EnrollmentDto.parseCode(await response.json());
};

// Étape « Installer l'agent », première moitié : l'APK est téléchargé par le proxy Next (`toAgentDownloadUrl`). Il est lu en
// entier avant l'installation : l'appareil doit en connaître la taille, et une coupure en cours de route ne laisse pas
// une installation à moitié faite.
export const downloadAgentApi = async (apkUrl?: string) => {
  const response = await fetch(toAgentDownloadUrl(apkUrl));
  if (!response.ok) throw createHttpError(response.status);
  return response.blob();
};

// Étape « Enrôler auprès du serveur » : l'agent installé est lancé avec ses réglages et s'enrôle de lui-même (`autoEnroll`).
export const enrollUsbDeviceApi = async (adb: Adb, { name, groupId, policyId, serial }: UsbEnrollmentInput) => {
  await wait(AGENT_START_DELAY);
  await startActivity(adb, AGENT_MAIN_ACTIVITY, {
    strings: { deviceName: name, groupId, policyId, serial },
    booleans: { autoEnroll: true },
  });
};

// Étape « Activer le mode Device Owner » : `dpm set-device-owner`, par ADB. Fictive pour l'instant.
export const activateUsbDeviceOwnerApi = async () => {
  await simulateLatency();
};

export const applyDeviceOwnerApi = async () => {
  await simulateLatency();
};
