import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { EnrollmentDto } from "../_dto/enrollment.dto";
import { ENROLLMENT_OPTIONS_MOCK, USB_ENROLLMENT_MOCK, simulateLatency } from "../_mocks/enrollment.mock";
import type { ProvisioningInput, UsbEnrollmentInput } from "../_types/enrollment.types";
import { toUsbDeviceInput } from "./enrollment.utils";

// Le QR code, le code à saisir dans l'agent et les réseaux Wi-Fi passent par le proxy Next (`app/api/v1/(enrollment)` et
// `(wifi-networks)`) vers l'API ; la sélection de l'appareil USB passe par l'ADB du navigateur (Tango, WebUSB). Le reste
// vient de `_mocks/` tant que le dashboard n'est pas branché dessus : groupes, politiques et agent par défaut (l'API n'en
// expose pas), et l'enrôlement par USB.
// Passer au réel : remplacer chaque mock par l'appel au proxy ou à l'ADB du navigateur, le parsing Zod reste identique.
const QR_CODE_URL = "/api/v1/enrollment/qr-code";
const CODE_URL = "/api/v1/enrollment/code";
const WIFI_NETWORKS_URL = "/api/v1/wifi-networks";
const JSON_HEADERS = { "Content-Type": "application/json" };
// Le plafond de l'API (`MAX_LIMIT`) : le formulaire propose tous les réseaux enregistrés, sans pagination.
const WIFI_NETWORKS_QUERY = "limit=100&sort=ssid";

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

// WebUSB : le navigateur demande l'accès USB et fait choisir l'appareil dans sa fenêtre de sélection (seuls les appareils
// qui exposent ADB y figurent). Fenêtre refermée sans choix : `null`, ce n'est pas une erreur.
// L'autorisation de ce poste par l'appareil (empreinte ADB) viendra avec la connexion ADB, à l'étape suivante.
export const connectUsbDeviceApi = async () => {
  const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  if (!manager) throw new Error("WebUSB unavailable");

  const device = await manager.requestDevice();
  return device ? EnrollmentDto.parseUsbDevice(toUsbDeviceInput(device)) : null;
};

// Par ADB : installe l'agent, l'enrôle auprès du serveur (sans code), puis `dpm set-device-owner`.
export const enrollUsbDeviceApi = async (input: UsbEnrollmentInput) => {
  void input;
  await simulateLatency(1500);
  return EnrollmentDto.parseUsbEnrollment(USB_ENROLLMENT_MOCK);
};

export const applyDeviceOwnerApi = async () => {
  await simulateLatency();
};
