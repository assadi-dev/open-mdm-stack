# Plan — Enrôlement & Provisioning (DPC custom Device Owner)

> **Stratégie retenue** : MDM souverain, DPC custom provisionné en **Device Owner** (aucune dépendance Google, pas d'AMAPI, pas de FCM).
> **Push des commandes** : SSE + REST (acks/heartbeat) + polling lent en filet de sécurité.
> Document de planification — aucun code, référence d'architecture.

---

## 1. Flux de provisioning de bout en bout (QR, device factory-reset)

```
[Admin/Dashboard]                    [Serveur API]              [Device neuf/reset]
      │                                   │                            │
      │ 1. crée enrollment token          │                            │
      ├──────────────────────────────────▶│                            │
      │ 2. reçoit QR (payload + image)     │                            │
      │◀──────────────────────────────────┤                            │
      │                                                                 │
      │ 3. affiche le QR ───────────────────────────── scan (6 taps) ──▶│
      │                                                                 │
      │                              4. download APK DPC ◀──────────────┤
      │                              (download location)                │
      │                                                                 │
      │                                   5. vérifie checksum signature │
      │                                   6. installe + set Device Owner│
      │                                   7. onProvisioningComplete     │
      │                                      → lit ADMIN_EXTRAS_BUNDLE   │
      │                                      (token + URL serveur)       │
      │                                                                 │
      │                 8. POST /enroll (token + infos device) ◀────────┤
      │                                   │                            │
      │                 9. valide token, crée device, renvoie JWT ─────▶│
      │                                                                 │
      │                10. applique policies + ouvre SSE + foreground   │
      │◀───────────── device "enrolled & online" ──────────────────────┤
```

**Point clé** : sur un Device Owner, ce n'est pas l'app qui scanne le QR — c'est le *Setup Wizard* natif d'Android. La lib QR est donc **côté serveur/dashboard** (génération), pas côté Android.

---

## 2. Côté serveur API — plan d'enrôlement

### Distinction fondamentale : statique vs dynamique

| Partie | Nature | Source |
|---|---|---|
| Component name du DeviceAdminReceiver | **Statique** (constante app) | Config |
| URL de download de l'APK | **Statique** | Config |
| Checksum de signature de l'APK | **Statique** | Config (calculé depuis le keystore release) |
| `ADMIN_EXTRAS_BUNDLE` → token + URL serveur + tenant | **Dynamique** | Par enrôlement |
| WiFi SSID/password (optionnel) | Dynamique | Par enrôlement |

➡️ Un endpoint assemble `[config statique] + [token fraîchement généré]` → JSON QR.

### Modèle de données (Drizzle)

- **`enrollment_tokens`** : `id`, `token` (haute entropie), `tenant_id`, `created_by`, `expires_at`, `max_uses`, `used_count`, `status` (active/revoked/exhausted), optionnel `policy_id`/`group_id` à pré-assigner, optionnel `device_name_template`.
- **`devices`** : créé à l'enrôlement — `id`, `tenant_id`, `enrollment_token_id`, `serial`, `model`, `android_version`, `device_jwt_id`, `status`, `last_seen`, `enrolled_at`.

### Endpoints

| Endpoint | Auth | Rôle |
|---|---|---|
| `POST /enrollment-tokens` | user (dashboard) | crée un token + renvoie payload QR + image |
| `GET /provisioning/dpc.apk` | **publique ou cookie-header** | sert l'APK pendant le provisioning (avant enrôlement) |
| `POST /enroll` | token device | valide le token, crée le device, renvoie le JWT device |
| `POST /devices/:id/deenroll` | user | révoque le device + son JWT |

> ⚠️ **Le piège du download APK** : à l'étape 4, le device n'est pas encore enrôlé → il n'a aucun credential. L'endpoint qui sert l'APK doit donc être accessible sans auth device. Protège-le avec le `PROVISIONING_PACKAGE_DOWNLOAD_COOKIE_HEADER` (header secret dans le QR) plutôt que de l'exposer totalement.

### Lifecycle du token

Single-use (ou `max_uses` limité) + TTL court + scopé tenant. À l'étape 9, le serveur incrémente `used_count`, et refuse si expiré/révoqué/épuisé. Bloque le replay.

---

## 3. Lib de génération QR

**Côté serveur : `qrcode` (node-qrcode).** Bon défaut :
- mature, maintenu, zéro dépendance lourde
- sort en **data URL / PNG / SVG / terminal** → renvoyer un data URL au dashboard ou un SVG
- niveaux de correction d'erreur réglables

> ⚠️ **Taille du payload** : avec download URL + checksum + bundle, le QR devient dense. Utiliser un niveau de correction **L ou M** (pas H) sinon le QR devient illisible/trop gros. node-qrcode auto-dimensionne la version. À tester sur device réel.

Alternative streaming : `qr-image` (moins maintenu) — non recommandé.

**Côté Android : aucune lib QR nécessaire** pour le provisioning Device Owner (le Setup Wizard scanne). Un scanner (ML Kit Barcode / ZXing) ne serait utile que pour un *autre* mode d'enrôlement in-app — hors scope.

---

## 4. Côté Android — plan du provisioning (le récepteur)

### AndroidManifest
- `DeviceAdminReceiver` déclaré avec permission `BIND_DEVICE_ADMIN`, intent-filters : `DEVICE_ADMIN_ENABLED`, `PROFILE_PROVISIONING_COMPLETE`.
- Ressource XML `device_admin` listant les policies utilisées.

### Le receiver (DeviceAdminReceiver)
- `onProfileProvisioningComplete(intent)` → **moment clé** : récupérer l'`ADMIN_EXTRAS_BUNDLE` depuis les extras → token + URL serveur + tenant.
- `onEnabled` → admin actif.

### ⚠️ Obligation Android 10+ (sinon provisioning échoue)
Pour un DPC custom moderne, fournir **deux activités** sinon le provisioning ne se termine pas :
- **`ACTION_GET_PROVISIONING_MODE`** → activité qui renvoie le mode (fully-managed / device owner).
- **`ACTION_ADMIN_POLICY_COMPLIANCE`** → activité affichée juste après le provisioning pour finaliser la conformité (déclenche l'appel `/enroll`).

C'est le détail qui fait que « ça marche sur un émulateur ancien » mais « échoue sur un device récent ». À intégrer dès le début.

### Séquence post-provisioning dans l'app
1. Lire le bundle (token + URL).
2. Collecter les infos device (serial via `DevicePolicyManager`, model, version).
3. `POST /enroll` (Retrofit) → recevoir le JWT device.
4. Stocker le JWT de façon sécurisée (EncryptedSharedPreferences / Keystore).
5. Appliquer les policies initiales, démarrer le **foreground service** + ouvrir le **stream SSE**.
6. Marquer la conformité (fin de `ADMIN_POLICY_COMPLIANCE`).

---

## 5. Sécurité (à cadrer maintenant)

- **Token** : haute entropie, single-use, TTL court, scopé tenant → anti-replay.
- **Checksum de signature** dans le QR = protection MITM : le device refuse un APK substitué. À calculer depuis le **keystore release** (SHA-256 du certificat de signature, base64 url-safe).
- **HTTPS obligatoire** : l'URL serveur dans le bundle doit être `https`.
- **JWT device** : signé, contient `device_id` + `tenant_id`, **révocable** (table de révocation / rotation) pour le de-enroll.
- **Endpoint APK** : cookie-header secret plutôt que public.

---

## 6. Ordre de construction recommandé (jalons)

| Jalon | Livrable | Pourquoi en premier |
|---|---|---|
| **M0 — dé-risquer** | APK stub DPC + checksum + un QR hardcodé → réussir UN provisioning Device Owner sur device physique | Maillon le plus incertain. Tant que ça ne marche pas, le reste est théorique. Valide aussi les activités Android 10+. |
| **M1 — serveur** | modèle `enrollment_tokens` + endpoint génération QR (lib `qrcode`) + hosting APK | la fondation backend |
| **M2 — boucle enroll** | DPC lit le bundle → `POST /enroll` → JWT stocké | la chaîne device↔serveur réelle |
| **M3 — dashboard** | UI qui génère/affiche le QR | rend l'enrôlement utilisable |
| **M4 — cycle de vie** | de-enroll + révocation token/JWT | hygiène avant d'ajouter des commandes |

➡️ **M0 d'abord, toujours.** Ne pas construire le serveur élégant avant d'avoir prouvé qu'un Device Owner se provisionne sur le matériel cible.
