# `mdm-server-api` — Serveur backend

API HTTP du stack **Open MDM** (MVP de Mobile Device Management). Construit avec
**Express 5 + TypeScript**, injection de dépendances **tsyringe**, validation
**Zod** et organisation par features. Fait partie du monorepo Turborepo.

> ⚠️ Des dépendances **LiveKit / Socket.IO** héritées du boilerplate d'origine
> sont encore présentes dans le `package.json` mais ne sont pas câblées. La
> migration vers la stack cible (Drizzle + PostgreSQL + PassportJS) est listée
> dans la [Roadmap](#roadmap).

## Stack technique

| Domaine            | Choix actuel                                  |
| ------------------ | --------------------------------------------- |
| Runtime            | Node.js `>= 24`                               |
| Langage            | TypeScript 5 (`commonjs`, décorateurs activés)|
| Framework HTTP     | Express 5                                     |
| Injection (DI)     | tsyringe + reflect-metadata                   |
| Validation         | Zod (env + payloads)                          |
| Logs HTTP          | morgan                                        |
| CORS               | cors (allowlist par origine)                  |
| Dev runner         | nodemon + ts-node + tsconfig-paths            |
| Build              | tsc + tsc-alias (résolution des alias)        |
| Temps réel (deps)  | Socket.IO, LiveKit Server SDK *(non câblés)*  |

## Prérequis

- Node.js **>= 24**
- npm (le monorepo utilise un lockfile npm à la racine)
- Une base **PostgreSQL** (à venir, pour Drizzle)

## Démarrage

Depuis la racine du monorepo (recommandé, via Turborepo) :

```bash
npm install            # installe tout le monorepo
npm run dev            # lance les apps en parallèle (dont l'API)
```

Ou directement dans `apps/api` :

```bash
npm run dev            # nodemon -> ts-node src/main.ts (hot reload)
npm run build          # tsc + tsc-alias -> ./build
npm run start          # node ./build/main.js (production)
```

Au lancement : `Server is running on http://localhost:<PORT>`.

## Variables d'environnement

Définies dans `apps/api/.env`. Celles **validées par Zod** ([`src/core/config/env.ts`](src/core/config/env.ts)) :

| Variable      | Requis | Défaut                                              | Description                                  |
| ------------- | ------ | --------------------------------------------------- | -------------------------------------------- |
| `PORT`        | non    | `5550`                                              | Port d'écoute HTTP                           |
| `CORS_ORIGIN` | non    | `http://localhost:3000,https://localhost:3000`      | Origines autorisées, séparées par une virgule|

Variables présentes dans le `.env` mais **non encore validées/utilisées** par le
schéma (héritage WebRTC) : `WS_PORT`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
`LIVEKIT_API_SECRET`. À nettoyer ou intégrer selon les besoins MDM.

> 🔒 Ne committez jamais de secrets réels. Le `.env` versionné ne doit contenir
> que des valeurs de dev/placeholder.

## Structure du projet

```
apps/api/
├── nodemon.json            # exec ts-node + watch src/
├── tsconfig.json           # alias de chemins + options strictes partielles
└── src/
    ├── main.ts             # point d'entrée : dotenv, reflect-metadata, env, DI, app
    ├── app.ts              # construit l'app Express + serveur HTTP + middlewares
    ├── core/
    │   ├── config/
    │   │   ├── env.ts      # validation Zod des variables d'env
    │   │   └── cors.ts     # options CORS (allowlist)
    │   ├── constants.ts
    │   ├── exception.ts    # exceptions HTTP typées (400/401/404/500)
    │   ├── dictionnaries/messages/errors.ts
    │   └── interfaces/global.ts
    ├── injection/
    │   ├── di.ts           # registerDependencies(server) — conteneur tsyringe
    │   └── tokens.ts       # tokens d'injection
    └── lib/
        └── global.ts       # errorHandler Express + mapping HttpError
```

### Alias de chemins

Configurés dans `tsconfig.json` (résolus en dev par `tsconfig-paths`, au build par `tsc-alias`) :

| Alias           | Cible                  |
| --------------- | ---------------------- |
| `@config/*`     | `src/core/config/*`    |
| `@core/*`       | `src/core/*`           |
| `@features/*`   | `src/features/*`       |
| `@middleware/*` | `src/middleware/*`     |
| `@bin/*`        | `bin/*`                |

## Conventions

- **Injection de dépendances** : enregistrer les services dans
  [`src/injection/di.ts`](src/injection/di.ts) via `container`, en référençant les
  identifiants de [`src/injection/tokens.ts`](src/injection/tokens.ts).
- **Gestion d'erreurs** : lever les exceptions typées de
  [`src/core/exception.ts`](src/core/exception.ts) (`HTTPBadRequestException`,
  `HTTPUnauthorizedException`, `HTTPNotFoundException`,
  `HTTPInternalServerErrorException`). Le middleware `errorHandler`
  ([`src/lib/global.ts`](src/lib/global.ts)) les normalise, et les `ZodError`
  renvoient automatiquement un `400` avec le détail de validation.
- **Validation** : valider tout payload entrant avec un schéma Zod.
- **Organisation** : regrouper le code métier par feature sous `src/features/<feature>`.

## Roadmap

Alignement sur la stack cible du projet Open MDM :

- [x] Renommer le package en `mdm-server-api`.
- [ ] Retirer les dépendances LiveKit/WebRTC non utilisées (`livekit-server-sdk`, `socket.io` si non requis).
- [ ] Intégrer **Drizzle ORM + PostgreSQL** (schéma, `drizzle-kit`, migrations) : tables `devices`, `enrollments`, `policies`, `commands`, `users`.
- [ ] Authentification **PassportJS** (stratégie Local et/ou JWT) + hash des mots de passe.
- [ ] Endpoints MDM : enrôlement de device, remontée de statut, push de policies, commandes distantes (lock / wipe / localisation).
- [ ] Couche temps réel (Socket.IO) pour les commandes en push vers les devices, si nécessaire.

---

Voir le [README racine](../../readme.md) pour la vue d'ensemble du monorepo et
l'app Android cliente.
