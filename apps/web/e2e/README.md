# Tests end-to-end (Playwright)

Les tests pilotent l'application dans Chromium (viewport 1440×900, locale `fr-FR`).

## Prérequis

- Postgres et l'API démarrés (`npm run docker:up` à la racine, puis l'API sur `http://localhost:5573`).
- Le serveur web : Playwright lance `npm run dev` s'il n'écoute pas déjà sur `http://localhost:3000` (`reuseExistingServer`). En CI, il lance `npm run build && npm run start`.
- Un compte de test dans la base de développement, déclaré dans `apps/web/.env.e2e` (ignoré par git) :

```
E2E_USER_EMAIL=e2e@example.com
E2E_USER_PASSWORD=...
```

`PLAYWRIGHT_BASE_URL` pointe les tests vers un environnement déjà déployé (aucun serveur n'est alors lancé).

## Commandes (depuis `apps/web`)

| Commande | Effet |
|---|---|
| `npm run test:e2e` | Tous les projets, en headless |
| `npm run test:e2e -- --project=public` | Uniquement les tests sans compte |
| `npm run test:e2e:ui` | Mode interactif (UI Mode) |
| `npm run test:e2e:report` | Ouvre le dernier rapport HTML |

## Organisation

| Dossier | Projet | Rôle |
|---|---|---|
| `e2e/auth.setup.ts` | `setup` | Se connecte une fois et enregistre la session dans `e2e/.auth/user.json` |
| `e2e/public/` | `public` | Pages accessibles sans session |
| `e2e/authenticated/` | `authenticated` | Pages derrière la connexion, avec la session enregistrée par `setup` |
| `e2e/support/` | — | Helpers partagés (connexion, identifiants) |

Les libellés attendus viennent de `constants/` : un test n'écrit pas un texte d'interface en dur quand une constante existe.
