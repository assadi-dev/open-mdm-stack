# Roadmap MVP — Authentification · Enrôlement/Provisioning · Enregistrement appareils

> **Périmètre** : les 3 piliers de la boucle minimale « un admin se connecte → génère un QR → un device factory-reset se provisionne en Device Owner → s'enregistre auprès du serveur ».
> **Décisions cadrantes** : DPC custom Device Owner (pas d'AMAPI), souverain sans Google (pas de FCM → SSE+REST+polling), **mono-tenant** (pas de `tenant_id`).
> Voir aussi : [`enrollment-provisioning.md`](./enrollment-provisioning.md), [`qrcode-provisioning-generation.html`](./qrcode-provisioning-generation.html).

---

## 0. État des lieux (2026-06-26)

| Pilier | Existant | Manquant |
|---|---|---|
| **Auth (admin/dashboard)** | Better Auth scaffolé (`apps/api/src/lib/auth.ts`), plugin `jwt`, adapter Drizzle, schéma `user/session/account/verification/jwks`, route `/api/auth/*` montée | Provider email/password activé, middleware de garde des routes métier, UI login web, 1er admin (seed/CLI) |
| **Enrôlement / Provisioning** | `qrcode` feature (node-qrcode → PNG + S3) | Modèle `enrollment_tokens`, endpoint génération payload QR, endpoint hosting APK, **DPC Android (0%)**, activités Android 10+ |
| **Enregistrement appareils** | — | Modèle `devices`, `POST /enroll`, émission JWT device, stockage sécurisé côté DPC, de-enroll/révocation |

**Dette à purger avant de coder** (incohérence mono-tenant) :
- supprimer `apps/api/src/drizzle/schemas/tenants.ts` et toute référence `tenant_id`,
- nettoyer les mentions `tenant_id` dans `enrollment-provisioning.md` / `.html`.

---

## 1. Principe d'ordonnancement

**Dé-risquer d'abord le maillon incertain : le provisioning Device Owner sur device physique.** Tant qu'un DPC ne se provisionne pas sur le matériel cible, le backend élégant est théorique. → Phase 1 (M0) attaque l'Android avec un serveur volontairement « bête » (QR hardcodé).

Ensuite on remonte la chaîne : auth admin (pour produire des QR légitimes) → tokens + génération QR réelle → boucle `/enroll` complète → cycle de vie.

```
P1 (M0)  Spike DPC ────────────────┐ prouve le hardware
P2       Auth admin ───────────────┤ socle d'identité
P3       Tokens + QR serveur ──────┤ génération légitime
P4       Boucle /enroll + devices ─┤ device ↔ serveur réel
P5       Dashboard enrôlement ─────┤ rend utilisable
P6       Cycle de vie + révocation ┘ hygiène avant les commandes
```

---

## 2. Phases

### Phase 1 — Spike DPC Device Owner *(dé-risquage, priorité absolue)*
**But** : réussir UN provisioning Device Owner sur un device physique réel.
- `apps/android` : DPC Kotlin minimal — `DeviceAdminReceiver` (`BIND_DEVICE_ADMIN`, intents `DEVICE_ADMIN_ENABLED` + `PROFILE_PROVISIONING_COMPLETE`), XML `device_admin`.
- **Activités Android 10+ obligatoires** : `ACTION_GET_PROVISIONING_MODE` + `ACTION_ADMIN_POLICY_COMPLIANCE` (sinon le provisioning ne se termine pas sur device récent).
- Keystore release → calcul du **checksum SHA-256 du certificat** (base64 url-safe).
- QR de provisioning **hardcodé** (composant + URL APK + checksum + `ADMIN_EXTRAS_BUNDLE` factice).
- `onProfileProvisioningComplete` lit le bundle et **logue** token + URL (pas d'appel réseau encore).

**Definition of Done** : factory-reset → scan QR (6 taps) → DPC installé en Device Owner → bundle lu et loggé.
**Dépendances** : aucune. **Risque** : reboot/OEM, factory-reset sans compte Google.

---

### Phase 2 — Authentification admin
**But** : un admin se connecte et obtient une session/JWT exploitable pour garder les endpoints métier.
- Activer **email/password** dans `auth.ts` (Better Auth), corriger `trustedOrigins` (actuellement mis à `BETTER_AUTH_SECRET` — bug).
- Middleware de garde `requireUser` → protéger les futures routes dashboard.
- Provisionnement du **1er admin** : script de seed ou commande CLI (pas de self-signup ouvert sur un MDM).
- `apps/web` : page **login** + appel Better Auth + garde des pages dashboard.

**DoD** : login web fonctionnel, session persistée, un endpoint protégé répond 401 sans session / 200 avec.
**Dépendances** : aucune (parallélisable avec P1).

---

### Phase 3 — Tokens d'enrôlement + génération QR serveur
**But** : produire un QR de provisioning **légitime et révocable**.
- Schéma Drizzle **`enrollment_tokens`** : `id`, `token` (haute entropie), `created_by`, `expires_at`, `max_uses`, `used_count`, `status` (active/revoked/exhausted), optionnel `policy_id`/`device_name_template`. **(sans `tenant_id`)**
- `POST /enrollment-tokens` (auth user) → crée le token, assemble `[config statique: composant + URL APK + checksum] + [token]` → payload JSON → QR (réutiliser/étendre la feature `qrcode`, **niveau de correction L/M** pas H vu la densité).
- `GET /provisioning/dpc.apk` → sert l'APK **avant enrôlement** (pas de credential device), protégé par header secret (`PROVISIONING_PACKAGE_DOWNLOAD_COOKIE_HEADER`) plutôt que public.

**DoD** : un admin authentifié génère un QR ; un device de P1 se provisionne à partir de ce QR réel.
**Dépendances** : P2 (auth), profite de P1 (format du bundle validé).

---

### Phase 4 — Boucle d'enregistrement `/enroll` + modèle devices
**But** : fermer la chaîne device ↔ serveur.
- Schéma **`devices`** : `id`, `enrollment_token_id`, `serial`, `model`, `android_version`, `device_jwt_id`, `status`, `last_seen`, `enrolled_at`. **(sans `tenant_id`)**
- `POST /enroll` (auth = token device) : valide le token (non expiré/révoqué/épuisé), incrémente `used_count`, crée le `device`, émet un **JWT device** (signé, contient `device_id`, révocable).
- DPC (suite de P1) : collecte serial/model/version → `POST /enroll` via Retrofit → stocke le JWT en **EncryptedSharedPreferences/Keystore** → marque la conformité (`ADMIN_POLICY_COMPLIANCE`).

**DoD** : device factory-reset → provisioning → apparaît `enrolled` côté serveur avec son JWT, sans étape manuelle.
**Dépendances** : P1 + P3.

---

### Phase 5 — Dashboard d'enrôlement
**But** : rendre l'enrôlement utilisable sans curl.
- `apps/web` : écran « Enrôler un appareil » → génère/affiche le QR (data URL/SVG), TTL/usage du token visibles.
- Liste des appareils enrôlés (statut, `last_seen`, modèle).

**DoD** : un admin enrôle un device de bout en bout depuis l'UI.
**Dépendances** : P2, P3, P4.

---

### Phase 6 — Cycle de vie & révocation
**But** : hygiène avant d'ajouter les commandes à distance.
- `POST /devices/:id/deenroll` (auth user) → révoque le device + invalide son JWT (table de révocation / rotation).
- Révocation d'`enrollment_tokens` (status `revoked`).
- Côté DPC : gérer un JWT révoqué (relock/wipe selon politique — à cadrer).

**DoD** : de-enroll coupe l'accès du device (401 sur appels suivants).
**Dépendances** : P4.

---

## 3. Hors scope MVP (mais à ne pas se fermer)
- Distribution de policies/APK, file de commandes, **SSE** (`GET /devices/:id/stream`) + heartbeat + polling — pilier « commandes » suivant.
- Multi-tenant (réintroductible si contrat d'enrôlement gardé neutre).
- OTA système (impossible sans clés OEM/root — un DO ne fait que `setSystemUpdatePolicy`).

## 4. Sécurité transverse (à tenir dès P3/P4)
- Token : haute entropie, single-use/`max_uses`, TTL court → anti-replay.
- Checksum de signature dans le QR → anti-MITM sur l'APK.
- **HTTPS obligatoire** pour l'URL serveur du bundle.
- JWT device **révocable** ; endpoint APK derrière header secret, pas public.

## 5. Chemin critique
**P1 (spike DPC)** débloque tout le reste — à lancer en premier et en parallèle de **P2 (auth)**. P3→P4→P5 sont séquentiels. P6 ferme la boucle avant le pilier « commandes ».
