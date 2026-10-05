import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { AdbDaemonWebUsbDevice, AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";

// Le nom de la clé ADB de ce poste, générée au premier branchement et gardée par le navigateur : l'appareil la retient
// quand l'utilisateur coche « Toujours autoriser cet ordinateur ».
const CREDENTIAL_APP_NAME = "Open MDM";

// Un appareil branché en USB, connecté et autorisé : `adb` sert à lui parler, `usbDevice` à retrouver son descripteur USB
// et à révoquer l'accès du navigateur.
export type AdbSession = {
  adb: Adb;
  usbDevice: AdbDaemonWebUsbDevice;
};

// WebUSB n'existe que dans les navigateurs Chromium, sur une page sécurisée (HTTPS ou localhost) : sinon `navigator.usb`
// est absent et le gestionnaire de la librairie aussi. À lire au clic, jamais au rendu (le serveur n'a pas de navigateur).
export const isAdbSupported = () => AdbDaemonWebUsbDeviceManager.BROWSER !== undefined;

// Un autre programme tient l'appareil, le plus souvent le serveur ADB local (« adb kill-server » le libère).
export const isDeviceBusyError = (error: unknown) => error instanceof AdbDaemonWebUsbDevice.DeviceBusyError;

// Le navigateur demande l'accès USB et fait choisir l'appareil (seuls ceux qui exposent ADB figurent dans sa fenêtre),
// puis l'appareil doit autoriser ce poste : il affiche sa boîte de dialogue et la connexion attend la réponse.
// Fenêtre refermée sans choix : `null`, ce n'est pas une erreur.
export const openAdbSession = async (): Promise<AdbSession | null> => {
  const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  if (!manager) throw new Error("WebUSB unavailable");

  const usbDevice = await manager.requestDevice();
  if (!usbDevice) return null;

  const connection = await usbDevice.connect();
  try {
    const transport = await AdbDaemonTransport.authenticate({
      serial: usbDevice.serial,
      connection,
      credentialStore: new AdbWebCredentialStore(CREDENTIAL_APP_NAME),
    });
    return { adb: new Adb(transport), usbDevice };
  } catch (error) {
    // `authenticate` laisse la connexion ouverte quand elle échoue (refus sur l'appareil, par exemple) : sans la fermer,
    // l'interface USB resterait réservée et la tentative suivante échouerait.
    await Promise.allSettled([connection.readable.cancel(), connection.writable.close()]);
    throw error;
  }
};

// Ferme la connexion ADB, puis révoque l'accès du navigateur à l'appareil : la prochaine connexion repasse par la fenêtre
// de sélection. La révocation a lieu même si la fermeture échoue (câble déjà débranché).
export const closeAdbSession = async ({ adb, usbDevice }: AdbSession) => {
  try {
    await adb.close();
  } finally {
    await usbDevice.raw.forget();
  }
};
