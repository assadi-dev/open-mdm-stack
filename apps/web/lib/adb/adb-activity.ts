import { AdbFeature, escapeArg, type Adb } from "@yume-chan/adb";
import { CmdNoneProtocolService } from "@yume-chan/android-bin";

type ActivityExtras = {
  // `--es` : un texte.
  strings?: Record<string, string>;
  // `--ez` : un booléen.
  booleans?: Record<string, boolean>;
};

// Démarre une activité de l'appareil (`am start-activity -W`, qui attend son démarrage) avec ses paramètres. `-S` arrête
// d'abord l'application si elle tourne : l'activité repart de zéro et lit ses paramètres.
// Pas de `ActivityManager` de la librairie : il ne voit jamais les lignes « Error: » de la sortie et n'envoie pas de booléen.
export const startActivity = async (adb: Adb, component: string, { strings = {}, booleans = {} }: ActivityExtras = {}) => {
  // Avec `abb_exec`, chaque argument arrive tel quel à l'appareil. Sans lui (appareils plus anciens), la commande est
  // jointe en une ligne que le shell de l'appareil redécoupe : un nom avec une espace ou une apostrophe doit y être protégé.
  const quote = adb.canUseFeature(AdbFeature.AbbExec) ? (value: string) => value : escapeArg;
  const args = [
    "activity",
    "start-activity",
    "-W",
    "-S",
    "-n",
    component,
    ...Object.entries(strings).flatMap(([key, value]) => ["--es", key, quote(value)]),
    ...Object.entries(booleans).flatMap(([key, value]) => ["--ez", key, String(value)]),
  ];

  const output = await new CmdNoneProtocolService(adb, "am").spawnWaitText(args);
  const error = output.split(/\r?\n/).find((line) => line.startsWith("Error:"));
  if (error) throw new Error(error.slice("Error:".length).trim());
};
