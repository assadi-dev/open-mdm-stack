# Open MDM Stack

> MDM (Mobile Device Management) **open-source et souverain** pour parc Android — **sans aucune dépendance Google** (pas d'AMAPI, pas de FCM).

Le contrôle des appareils repose sur un **DPC custom** (Device Policy Controller) provisionné en **Device Owner** : l'application Android maison parle directement à l'API Node, qui gère l'enrôlement, la distribution des policies, la file de commandes et le heartbeat. Le push des commandes se fait via **SSE + REST** (avec polling lent en filet de sécurité), jamais via FCM.

> 📌 Décision d'architecture : DPC custom Device Owner choisi plutôt qu'AMAPI (le 2026-06-24), pour rester cohérent avec l'ambition « MDM open-source sans dépendance Google ». Voir [`plan/enrollment-provisioning.md`](plan/enrollment-provisioning.md).

---

## Architecture du monorepo

Monorepo géré avec [Turborepo](https://turborepo.com) + npm workspaces.

```
open-mdm-stack/
├── apps/
│   ├── api/        # Backend MDM — Express 5 + TypeScript (tsyringe, zod, S3, socket.io)
│   └── web/        # Dashboard d'administration — Next.js 16 + React 19
├── packages/
│   ├── ui/                 # Composants React partagés (@repo/ui)
│   ├── eslint-config/      # Config ESLint partagée (@repo/eslint-config)
│   └── typescript-config/  # Configs tsconfig partagées (@repo/typescript-config)
└── plan/           # Documents de planification (architecture, provisioning)
```

### Composants

| Composant | Rôle | Stack |
|---|---|---|
| **`apps/api`** (`mdm-server-api`) | API serveur : enrôlement, génération QR, stockage S3, policies, commandes | Express 5, TypeScript, tsyringe (DI), Zod, AWS S3 SDK, socket.io, LiveKit, node-qrcode |
| **`apps/web`** (`web`) | Dashboard d'administration du parc | Next.js 16, React 19 |
| **App Android** (à venir) | DPC custom Device Owner sur le device | Kotlin, DevicePolicyManager |

---

## Prérequis

- **Node.js** `>= 24` (requis par `apps/api` ; le monorepo exige `>= 18`)
- **npm** `11.x` (packageManager : `npm@11.10.1`)
- Un **stockage compatible S3** (AWS S3, MinIO, etc.) pour les artefacts de provisioning

## Installation

```bash
git clone <repo-url>
cd open-mdm-stack
npm install
```

## Configuration

Le backend valide ses variables d'environnement au démarrage via Zod ([`apps/api/src/core/config/env.ts`](apps/api/src/core/config/env.ts)) — il **refuse de démarrer** si une variable obligatoire manque.

Créez un fichier `apps/api/.env` :

```dotenv
# Serveur
PORT=5550
CORS_ORIGIN=http://localhost:3000,https://localhost:3000

# Stockage S3 (obligatoire)
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=...
S3_ENDPOINT=...
S3_BUCKET=...
```

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `PORT` | non | `5550` | Port d'écoute de l'API |
| `CORS_ORIGIN` | non | `http://localhost:3000,https://localhost:3000` | Origines autorisées (séparées par des virgules) |
| `S3_ACCESS_KEY` | **oui** | — | Clé d'accès S3 |
| `S3_SECRET_KEY` | **oui** | — | Clé secrète S3 |
| `S3_REGION` | **oui** | — | Région S3 |
| `S3_ENDPOINT` | **oui** | — | Endpoint S3 (utile pour MinIO) |
| `S3_BUCKET` | **oui** | — | Nom du bucket |

---

## Développement

Depuis la racine, Turborepo orchestre toutes les apps :

```bash
npm run dev          # Démarre toutes les apps (api + web) en parallèle
npm run build        # Build l'ensemble du monorepo
npm run lint         # Lint l'ensemble du monorepo
npm run check-types  # Vérification de types
npm run format       # Formate le code (Prettier)
```

Pour une app précise :

```bash
# API (nodemon, http://localhost:5550)
npm run dev --workspace=mdm-server-api

# Dashboard (Next.js, http://localhost:3000)
npm run dev --workspace=web
```

---

## API

Base URL : `http://localhost:5550/api/v1`

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/qrcode/generate` | Génère un QR code (PNG) à partir d'un texte. Body : `{ "text": "..." }` |

> L'API est en cours de construction. L'enrôlement, la distribution des policies et la file de commandes sont décrits dans le plan ci-dessous.

### Roadmap d'enrôlement (jalons)

Issue de [`plan/enrollment-provisioning.md`](plan/enrollment-provisioning.md) :

| Jalon | Livrable |
|---|---|
| **M0** | APK stub DPC + QR hardcodé → réussir UN provisioning Device Owner sur device physique |
| **M1** | Modèle `enrollment_tokens` + endpoint de génération QR + hosting de l'APK |
| **M2** | Boucle d'enrôlement : DPC lit le bundle → `POST /enroll` → JWT device stocké |
| **M3** | Dashboard qui génère/affiche le QR |
| **M4** | Cycle de vie : de-enroll + révocation token/JWT |

---

## Sécurité

- **Token d'enrôlement** : haute entropie, single-use, TTL court, scopé tenant (anti-replay).
- **Checksum de signature** de l'APK dans le QR : protection MITM contre un APK substitué.
- **HTTPS obligatoire** pour l'URL serveur transmise au device.
- **JWT device** : signé, révocable (pour le de-enroll).

---

## Stack technique

- **Monorepo** : Turborepo, npm workspaces, TypeScript 5.9
- **Backend** : Node 24, Express 5, tsyringe (injection de dépendances), Zod (validation), AWS S3 SDK, socket.io, LiveKit, node-qrcode, Morgan, CORS
- **Frontend** : Next.js 16, React 19
- **Outillage** : ESLint 9, Prettier 3, nodemon, tsc-alias

## Licence

ISC
