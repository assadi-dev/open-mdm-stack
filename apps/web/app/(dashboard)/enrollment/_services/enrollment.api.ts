import { EnrollmentDto } from "../_dto/enrollment.dto";
import {
  ENROLLMENT_OPTIONS_MOCK,
  INITIAL_ENROLLMENT_CODE_MOCK,
  USB_DEVICE_MOCK,
  USB_ENROLLMENT_MOCK,
  buildEnrollmentCodeMock,
  buildEnrollmentQrMock,
  randomEnrollmentCodeMock,
  simulateLatency,
} from "../_mocks/enrollment.mock";
import type { ProvisioningInput, UsbEnrollmentInput } from "../_types/enrollment.types";

// Les données viennent de `_mocks/` tant que le dashboard n'est pas branché sur l'enrôlement de l'API ni sur WebUSB.
// Passer au réel : remplacer chaque mock par l'appel au proxy (`/api/v1/enrollment/...`) ou à l'ADB du navigateur,
// le parsing Zod reste identique.

// Les groupes et les politiques n'existent pas encore côté API ; les réseaux Wi-Fi viendront de `GET /wifi-networks`.
export const fetchEnrollmentOptionsApi = async () => EnrollmentDto.parseOptions(ENROLLMENT_OPTIONS_MOCK);

// `POST /enrollment/display-provisioning?format=svg`. Chaque appel génère un nouveau QR code ; sans `input`, le serveur
// applique sa configuration par défaut.
export const fetchEnrollmentQrApi = async (input?: ProvisioningInput) => {
  if (input) await simulateLatency();
  return EnrollmentDto.parseQr(buildEnrollmentQrMock());
};

// `GET /enrollment/otp-generate`. Chaque appel génère un nouveau code ; `isNew` distingue la régénération du premier code.
export const fetchEnrollmentCodeApi = async ({ isNew = false } = {}) => {
  if (isNew) await simulateLatency();
  return EnrollmentDto.parseCode(buildEnrollmentCodeMock(isNew ? randomEnrollmentCodeMock() : INITIAL_ENROLLMENT_CODE_MOCK));
};

// WebUSB : le navigateur demande quel appareil utiliser, puis l'appareil doit autoriser ce poste (empreinte ADB).
export const connectUsbDeviceApi = async () => {
  await simulateLatency();
  return EnrollmentDto.parseUsbDevice(USB_DEVICE_MOCK);
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
