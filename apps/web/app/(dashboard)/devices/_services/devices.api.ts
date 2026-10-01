import { DeviceDto } from "../_dto/device.dto";
import { buildDevicesMock } from "../_mocks/devices.mock";

// Les données viennent de `_mocks/` tant que l'API n'expose pas la liste des appareils.
// Passer à l'API réelle : remplacer le mock par `await response.json()`, le parsing Zod reste identique.

export const fetchDeviceCollectionApi = async () => DeviceDto.parseCollection(buildDevicesMock());
