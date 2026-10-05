#!/usr/bin/env bash
#
# Reproduit, en ligne de commande, l'enrôlement « Connexion USB » du dashboard (/enrollment, onglet Manuel) :
#
#   1. Installer l'agent      (facultatif, --apk)      ≙ downloadAgentApi + installApk
#   2. Enrôler auprès du      am start-activity         ≙ enrollUsbDeviceApi
#      serveur                avec les mêmes extras
#   3. Device Owner           (facultatif, --device-owner) ≙ activateUsbDeviceOwnerApi (encore fictif côté web)
#
# Les extras envoyés par le web (apps/web/app/(dashboard)/enrollment/_services/enrollment.api.ts) :
#
#   --es deviceName <nom>       le nom saisi dans « Configuration »
#   --es groupId    <id>        le groupe choisi (ids fictifs côté web : lyon, nord, liv, siege)
#   --es policyId   <id>        la politique choisie (ids fictifs côté web : std, kio)
#   --es serial     <n° série>  le n° de série de l'appareil branché (celui que voit ADB)
#   --ez autoEnroll true        l'agent s'enrôle de lui-même au démarrage
#
# Comme le web, l'activité est lancée avec `-W` (attend son démarrage) et `-S` (arrête l'agent s'il tourne déjà, pour
# qu'il relise ses extras).
#
# Exemples :
#   ./usb-enroll.sh
#   ./usb-enroll.sh --name "Tablette entrepôt 3" --group nord --policy kio
#   ./usb-enroll.sh --apk ../app/build/outputs/apk/release/app-release.apk --name "Pixel test"
#   ./usb-enroll.sh --apk http://10.192.2.9:5573/download/apk/app-debug.apk
#   ./usb-enroll.sh -s 3A1B7K2P --device-owner
#   ./usb-enroll.sh --dry-run          # affiche les commandes sans rien envoyer

set -euo pipefail

# --- Valeurs par défaut (celles du formulaire web) -------------------------------------------------------------------
PACKAGE="com.openmdm.agent"
COMPONENT="${PACKAGE}/${PACKAGE}.MainActivity"
ADMIN_RECEIVER="${PACKAGE}/${PACKAGE}.device.MdmDeviceAdminReceiver"
DEVICE_NAME="Appareil de test"
GROUP_ID="lyon"
POLICY_ID="std"
AUTO_ENROLL="true"
SERIAL=""            # vide : le n° de série de l'appareil branché (adb get-serialno)
APK=""               # vide : l'agent est supposé déjà installé
DEVICE_OWNER="false"
DRY_RUN="false"
# Le temps qu'Android prenne en compte l'agent qui vient d'être installé, avant de le lancer (AGENT_START_DELAY).
START_DELAY_SECONDS=1

usage() {
  cat <<EOF
Usage : $(basename "$0") [options]

  -n, --name <nom>          deviceName              (défaut : "${DEVICE_NAME}")
  -g, --group <id>          groupId                 (défaut : ${GROUP_ID})
  -p, --policy <id>         policyId                (défaut : ${POLICY_ID})
  -s, --serial <n°>         appareil ADB visé, et extra serial (défaut : l'appareil branché)
      --no-auto-enroll      autoEnroll=false        (défaut : true)
      --apk <fichier|url>   installe l'agent avant de le lancer (adb install -r)
      --device-owner        lance ensuite dpm set-device-owner ${ADMIN_RECEIVER}
      --dry-run             affiche les commandes sans les exécuter
  -h, --help                cette aide
EOF
}

die() {
  echo "✖ $*" >&2
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    -n | --name) DEVICE_NAME="${2:?--name attend une valeur}"; shift 2 ;;
    -g | --group) GROUP_ID="${2:?--group attend une valeur}"; shift 2 ;;
    -p | --policy) POLICY_ID="${2:?--policy attend une valeur}"; shift 2 ;;
    -s | --serial) SERIAL="${2:?--serial attend une valeur}"; shift 2 ;;
    --no-auto-enroll) AUTO_ENROLL="false"; shift ;;
    --apk) APK="${2:?--apk attend un fichier ou une URL}"; shift 2 ;;
    --device-owner) DEVICE_OWNER="true"; shift ;;
    --dry-run) DRY_RUN="true"; shift ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; die "option inconnue : $1" ;;
  esac
done

ADB_BIN="adb"
if ! command -v adb >/dev/null 2>&1; then
  # Le SDK installé par Android Studio, quand platform-tools n'est pas dans le PATH.
  for candidate in "${ANDROID_HOME:-}/platform-tools/adb" "${ANDROID_SDK_ROOT:-}/platform-tools/adb" "$HOME/Library/Android/sdk/platform-tools/adb"; do
    if [ -x "$candidate" ]; then ADB_BIN="$candidate"; break; fi
  done
fi
if [ "$DRY_RUN" = "false" ] && ! command -v "$ADB_BIN" >/dev/null 2>&1; then
  die "adb introuvable : ajoutez Android platform-tools au PATH (ou définissez ANDROID_HOME)."
fi

# Une valeur entre apostrophes pour le shell de l'appareil : `adb shell` joint les arguments en une ligne qu'il redécoupe,
# un nom avec une espace ou une apostrophe doit donc y être protégé (comme `escapeArg` côté web).
quote() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

# Affiche la commande, puis l'exécute (sauf --dry-run).
run() {
  echo "\$ $*"
  [ "$DRY_RUN" = "true" ] || "$@"
}

# --- Appareil visé -------------------------------------------------------------------------------------------------
if [ "$DRY_RUN" = "true" ]; then
  SERIAL="${SERIAL:-<serial>}"
else
  if [ -z "$SERIAL" ]; then
    count=$("$ADB_BIN" devices | awk 'NR > 1 && $2 == "device"' | wc -l | tr -d ' ')
    [ "$count" -ge 1 ] || die "aucun appareil autorisé (adb devices). Branchez l'appareil et acceptez le débogage USB."
    [ "$count" -eq 1 ] || die "${count} appareils branchés : précisez lequel avec --serial."
    SERIAL=$("$ADB_BIN" get-serialno)
  fi
  "$ADB_BIN" -s "$SERIAL" get-state >/dev/null 2>&1 || die "appareil ${SERIAL} injoignable."
fi
ADB=("$ADB_BIN" -s "$SERIAL")

echo "→ Appareil   : ${SERIAL}"
echo "→ Paramètres : deviceName=\"${DEVICE_NAME}\" groupId=${GROUP_ID} policyId=${POLICY_ID} serial=${SERIAL} autoEnroll=${AUTO_ENROLL}"
echo

# --- 1. Installer l'agent ------------------------------------------------------------------------------------------
if [ -n "$APK" ]; then
  echo "[1/3] Installer l'agent"
  apk_file="$APK"
  case "$APK" in
    http://* | https://*)
      apk_dir="$(mktemp -d -t openmdm-agent)"
      trap 'rm -rf "$apk_dir"' EXIT
      apk_file="$apk_dir/agent.apk"
      run curl -fL --progress-bar -o "$apk_file" "$APK"
      ;;
    *) [ "$DRY_RUN" = "true" ] || [ -f "$APK" ] || die "APK introuvable : ${APK}" ;;
  esac
  run "${ADB[@]}" install -r "$apk_file"
  [ "$DRY_RUN" = "true" ] || sleep "$START_DELAY_SECONDS"
else
  echo "[1/3] Installer l'agent : ignoré (pas de --apk)"
  if [ "$DRY_RUN" = "false" ] && ! "${ADB[@]}" shell pm path "$PACKAGE" >/dev/null 2>&1; then
    die "${PACKAGE} n'est pas installé : relancez avec --apk <fichier|url>."
  fi
fi
echo

# --- 2. Enrôler auprès du serveur ----------------------------------------------------------------------------------
echo "[2/3] Lancer l'agent avec ses paramètres"
start_cmd="am start-activity -W -S -n ${COMPONENT}"
start_cmd+=" --es deviceName $(quote "$DEVICE_NAME")"
start_cmd+=" --es groupId $(quote "$GROUP_ID")"
start_cmd+=" --es policyId $(quote "$POLICY_ID")"
start_cmd+=" --es serial $(quote "$SERIAL")"
start_cmd+=" --ez autoEnroll ${AUTO_ENROLL}"

echo "\$ ${ADB[*]} shell \"${start_cmd}\""
if [ "$DRY_RUN" = "false" ]; then
  output=$("${ADB[@]}" shell "$start_cmd" 2>&1)
  echo "$output"
  # Comme le web : `am` répond sans code d'erreur, seule une ligne « Error: » signale l'échec.
  if printf '%s\n' "$output" | grep -q '^Error:'; then
    die "le lancement de l'agent a échoué."
  fi
fi
echo

# --- 3. Device Owner -----------------------------------------------------------------------------------------------
if [ "$DEVICE_OWNER" = "true" ]; then
  echo "[3/3] Activer le mode Device Owner"
  run "${ADB[@]}" shell dpm set-device-owner "$ADMIN_RECEIVER"
else
  echo "[3/3] Device Owner : ignoré (pas de --device-owner ; l'étape est encore fictive côté web)"
fi

echo
echo "✔ Terminé. Suivre l'agent : ${ADB[*]} logcat --pid=\$(${ADB[*]} shell pidof ${PACKAGE})"
