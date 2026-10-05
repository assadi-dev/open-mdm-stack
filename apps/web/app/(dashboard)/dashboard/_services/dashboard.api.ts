import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { DashboardDto } from "../_dto/dashboard.dto";
import {
  ANDROID_VERSIONS_MOCK,
  COMMANDS_FLOW_MOCK,
  COMPLIANCE_MOCK,
  buildRecentDevicesMock,
} from "../_mocks/dashboard.mock";
import { toKpis } from "./dashboard.utils";

// Les indicateurs lisent le résumé du parc par le proxy Next (`app/api/v1/(devices)/devices/summary`). Le reste vient de
// `_mocks/` tant que l'API n'expose ni liste d'appareils récents, ni commandes, ni conformité, ni versions d'Android.
// Passer à l'API réelle : remplacer chaque mock par `await response.json()`, le parsing Zod reste identique.
const DEVICE_SUMMARY_URL = "/api/v1/devices/summary";

export const fetchDashboardKpisApi = async () => {
  const response = await fetch(DEVICE_SUMMARY_URL);
  if (!response.ok) throw createHttpError(response.status);
  return toKpis(DashboardDto.parseDeviceSummary(await response.json()));
};

export const fetchCommandsFlowApi = async () => DashboardDto.parseCommandsFlow(COMMANDS_FLOW_MOCK);

export const fetchComplianceApi = async () => DashboardDto.parseCompliance(COMPLIANCE_MOCK);

export const fetchAndroidVersionsApi = async () => DashboardDto.parseAndroidVersions(ANDROID_VERSIONS_MOCK);

export const fetchRecentDevicesApi = async () => DashboardDto.parseRecentDevices(buildRecentDevicesMock());
