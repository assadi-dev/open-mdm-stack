import type { Adb } from "@yume-chan/adb";
import { PackageManager } from "@yume-chan/android-bin";

// Le flux du navigateur est le même que celui de la librairie à l'exécution ; seuls leurs types divergent (`closed`).
type InstallStream = Parameters<PackageManager["installStream"]>[1];

// Installe l'APK sur l'appareil, en remplaçant l'application si elle y est déjà. `allowTest` (`pm install -t`) : l'APK de
// debug de l'agent est « testOnly », qu'Android refuse d'installer sans cet indicateur ; un APK de production n'est pas concerné.
export const installApk = async (adb: Adb, apk: Blob) => {
  const stream = apk.stream() as unknown as InstallStream;
  await new PackageManager(adb).installStream(apk.size, stream, { allowTest: true });
};
