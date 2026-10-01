import { DashboardDto } from "../_dto/dashboard.dto";
import {
  ANDROID_VERSIONS_MOCK,
  COMMANDS_FLOW_MOCK,
  COMPLIANCE_MOCK,
  DASHBOARD_KPIS_MOCK,
  buildRecentDevicesMock,
} from "../_mocks/dashboard.mock";

// Les données viennent de `_mocks/` tant que l'API n'expose ni liste d'appareils ni statistiques.
// Passer à l'API réelle : remplacer chaque mock par `await response.json()`, le parsing Zod reste identique.

export const fetchDashboardKpisApi = async () => DashboardDto.parseKpis(DASHBOARD_KPIS_MOCK);

export const fetchCommandsFlowApi = async () => DashboardDto.parseCommandsFlow(COMMANDS_FLOW_MOCK);

export const fetchComplianceApi = async () => DashboardDto.parseCompliance(COMPLIANCE_MOCK);

export const fetchAndroidVersionsApi = async () => DashboardDto.parseAndroidVersions(ANDROID_VERSIONS_MOCK);

export const fetchRecentDevicesApi = async () => DashboardDto.parseRecentDevices(buildRecentDevicesMock());
