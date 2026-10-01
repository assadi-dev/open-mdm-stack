---
paths:
  - "apps/web/**"
---

# Conventions de code frontend (`apps/web`)

Stack : Next.js 16 (App Router), React 19, shadcn/ui, TanStack Query, React Hook Form, Zod. Le design (tokens, variantes, ton des libellés) est décrit dans `design-system/`.

## 1. SOLID

Toujours appliquer les principes SOLID quand c'est applicable. **En cas de doute, demander avant de coder.**

- **S** : un composant affiche, un hook porte la logique métier, un service appelle l'API. Un fichier, une responsabilité.
- **O** : on étend par composition ou par un wrapper, jamais en modifiant l'existant (voir §4 pour shadcn).
- **L** : un wrapper accepte et transmet toutes les props du composant qu'il enveloppe.
- **I** : des props petites et ciblées plutôt qu'un gros objet fourre-tout.
- **D** : un composant dépend d'un hook, un hook dépend d'un service. Jamais de `fetch` dans un composant.

## 2. Structure d'une page

Chaque page correspond à un contexte métier et contient tout ce qui lui est propre. Les dossiers préfixés par `_` sont privés pour le routeur Next.js (non routés).

```
app/dashboard/
├── _hooks/        actions métier : useQuery, useMutation, formulaires
├── _components/   composants utilisés uniquement par cette page
├── _services/     un fichier par rôle : appels API, clés de requête, fonctions utilitaires
├── _types/        types TypeScript de la page
├── _dto/          schémas Zod + objet de validation/parsing
├── _mocks/        données fictives, tant que l'API n'expose pas la ressource
└── page.tsx
```

- `_services/dashboard.api.ts` : uniquement les fonctions d'appel API.
- `_services/dashboard.queries.ts` : uniquement les clés des requêtes TanStack Query (voir §5).
- `_services/dashboard.utils.ts` : uniquement les fonctions utilitaires.
- `_dto/device.dto.ts` : les schémas Zod et un objet qui expose les méthodes de validation et de parsing.
- `_mocks/dashboard.mock.ts` : données fictives typées, importées uniquement par `_services/dashboard.api.ts` (jamais par un composant ou un hook). Passer à l'API réelle ne touche que ce fichier et `dashboard.api.ts`.

```ts
// _dto/device.dto.ts
import { z } from "zod";

export const deviceSchema = z.object({
  id: z.string(),
  model: z.string(),
  serial: z.string(),
});

export const DeviceDto = {
  parse: (data: unknown) => deviceSchema.parse(data),
  safeParse: (data: unknown) => deviceSchema.safeParse(data),
  parseCollection: (data: unknown) => z.array(deviceSchema).parse(data),
};
```

```ts
// _types/device.types.ts
import type { z } from "zod";
import type { deviceSchema } from "../_dto/device.dto";

export type Device = z.infer<typeof deviceSchema>;
```

## 3. Composants réutilisables

Un composant utilisé à plusieurs endroits du projet va dans `components/<contexte>/`, pas dans le `_components` d'une page.

```
components/
├── buttons/
│   ├── ButtonWithIcon.tsx
│   ├── ButtonWithLoader.tsx
│   └── Switch.tsx          les switch vont dans buttons/
├── inputs/
│   └── InputPassword.tsx   champ mot de passe avec toggle
└── ui/                     composants shadcn (ne pas modifier)
```

Nos composants sont en PascalCase (`ButtonWithIcon.tsx`). Les fichiers shadcn gardent leur nom d'origine (`button.tsx`).

## 4. Ne jamais modifier les composants shadcn

Aucun fichier de `components/ui/` n'est modifié (pas de prop ajoutée, pas de classe changée). Pour personnaliser, on crée un wrapper dans le dossier du contexte, qui importe le composant shadcn et applique nos modifications. Dès qu'un wrapper existe, les pages et composants importent le wrapper, plus le composant shadcn.

```tsx
// components/buttons/Button.tsx
import type { ComponentProps } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof ShadcnButton>;

export const Button = ({ className, ...props }: ButtonProps) => (
  <ShadcnButton className={cn("shadow-none", className)} {...props} />
);
```

## 5. Appels API avec TanStack Query

Tout appel API passe par TanStack Query, dans un hook de `_hooks/`.

- **Lecture** : un hook dédié par requête, préfixé `useFetch`. Ex. `useFetchDeviceCollection` récupère la collection d'appareils.
- **Écriture** (ajout, modification, suppression…) : toutes les actions d'une ressource sont regroupées dans un seul hook, suffixé `Mutation`. Ex. `useDeviceMutation` retourne `{ create, update, remove }`.
- Les actions retournées portent un **verbe d'action seul** : `create`, `update`, `remove`, pas `createDevice`. `delete` étant un mot réservé en JavaScript, l'action s'appelle `remove` (et `removeMany`), mais ses textes restent sous la clé `delete` (et `deleteMany`) dans les constantes.
- **Jamais de `fetch` écrit dans `queryFn` ou `mutationFn`.** On passe la fonction importée depuis `_services/<page>.api.ts`, nommée `<verbe><Ressource>Api`.

```ts
// _services/dashboard.api.ts
import { DeviceDto } from "../_dto/device.dto";

export const fetchDeviceCollectionApi = async () => {
  const response = await fetch("/api/devices");
  return DeviceDto.parseCollection(await response.json());
};
```

### Clés de requête

Les clés (`queryKey`) ne sont jamais écrites en dur dans un hook. Elles sont définies dans `_services/<page>.queries.ts`.

- Un objet par entité ou par contexte, nommé en UPPER_SNAKE_CASE : `DEVICES`, `POLICIES`.
- Chaque propriété correspond à une requête de lecture (GET) et porte la raison ou l'endpoint concerné. Ex. `DEVICES.collection` pour le tableau des appareils, `DEVICES.enrolledDevices` pour les appareils enrôlés.
- Une clé qui dépend d'un paramètre est une fonction : `DEVICES.detail(id)`.
- Les mutations n'ont pas de clé.
- **Exception au caractère privé des dossiers `_` :** si une autre page doit lire ou invalider une de ces clés, elle l'importe directement depuis le `_services` de la page propriétaire (ex. `app/devices/_services/devices.queries.ts`). On ne crée pas de dossier partagé pour les clés : les appels API identiques entre pages sont très rares.

```ts
// _services/dashboard.queries.ts
export const DEVICES = {
  collection: ["devices", "collection"],
  enrolledDevices: ["devices", "enrolled"],
  detail: (id: string) => ["devices", "detail", id] as const,
} as const;
```

```ts
// _hooks/useFetchDeviceCollection.ts
import { useQuery } from "@tanstack/react-query";
import { fetchDeviceCollectionApi } from "../_services/dashboard.api";
import { DEVICES } from "../_services/dashboard.queries";

export const useFetchDeviceCollection = () =>
  useQuery({ queryKey: DEVICES.collection, queryFn: fetchDeviceCollectionApi });
```

### Invalidation après une mutation

Chaque mutation réussie invalide **toutes les requêtes dont elle change les données**, et seulement celles-là. Avant d'écrire une mutation, lister les clés touchées : enrôler un appareil change `DEVICES.collection` et `DEVICES.enrolledDevices`, mais pas `POLICIES.collection`.

```ts
// _hooks/useDeviceMutation.ts
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEVICE } from "@/constants/device";
import { createDeviceApi, updateDeviceApi, removeDeviceApi } from "../_services/dashboard.api";
import { DEVICES } from "../_services/dashboard.queries";

export const useDeviceMutation = () => {
  const queryClient = useQueryClient();

  const afterMutation = (action: keyof typeof DEVICE.success, queryKeys: QueryKey[]) => ({
    onSuccess: () => {
      queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(DEVICE.success[action]);
    },
    onError: () => toast.error(DEVICE.error[action]),
  });

  const create = useMutation({
    mutationFn: createDeviceApi,
    ...afterMutation("create", [DEVICES.collection, DEVICES.enrolledDevices]),
  });
  const update = useMutation({
    mutationFn: updateDeviceApi,
    ...afterMutation("update", [DEVICES.collection]),
  });
  const remove = useMutation({
    mutationFn: removeDeviceApi,
    ...afterMutation("delete", [DEVICES.collection, DEVICES.enrolledDevices]),
  });

  return { create, update, remove };
};
```

## 6. Constantes : textes de l'interface

**Toute constante est nommée en UPPER_SNAKE_CASE** (`DEVICE`, `DEVICES`), où qu'elle se trouve. Ses propriétés sont en camelCase (`DEVICE.button.deleteMany`, `DEVICES.collection`).

Aucun texte (message de toast, libellé de bouton, titre de page) n'est écrit en dur dans un composant ou un hook. Chaque entité ou contexte a son fichier dans `constants/`, qui exporte un objet à son nom au singulier, toujours avec la même structure. Si le fichier n'existe pas, le créer.

- `success` : message du toast de réussite, une clé par action.
- `error` : message du toast d'échec, une clé par action. Il reste **générique** : aucun détail technique affiché.
- `button` : libellé du bouton de chaque action, à l'infinitif (voir `design-system/README.md` › Contenu et ton).
- `page` : textes de la page, dont `title`.

Les clés d'action sont `create`, `update`, `delete`, `deleteMany`. Une action propre à l'entité (ex. `lock` pour un appareil) ajoute sa clé dans `success`, `error` et `button`.

Ne pas confondre : `DEVICE` (singulier, `constants/device.ts`) porte les textes, `DEVICES` (pluriel, `_services/*.queries.ts`) porte les clés de requête.

```ts
// constants/device.ts
export const DEVICE = {
  success: {
    create: "Appareil enrôlé.",
    update: "Appareil mis à jour.",
    delete: "Appareil supprimé.",
    deleteMany: "Appareils supprimés.",
  },
  error: {
    create: "Impossible d'enrôler l'appareil. Réessayez.",
    update: "Impossible de mettre à jour l'appareil. Réessayez.",
    delete: "Impossible de supprimer l'appareil. Réessayez.",
    deleteMany: "Impossible de supprimer les appareils. Réessayez.",
  },
  button: {
    create: "Enrôler un appareil",
    update: "Enregistrer",
    delete: "Supprimer",
    deleteMany: "Supprimer la sélection",
  },
  page: {
    title: "Appareils",
  },
} as const;
```

Les erreurs qui ne dépendent d'aucune entité (réseau, erreur inconnue) vont dans `constants/errors.ts`, sous `ERROR_MESSAGES`.

## 7. Formulaires avec React Hook Form

Tout formulaire utilise React Hook Form. L'objet `form` est créé dans un hook dédié de `_hooks/`, qui retourne le `form`. Le schéma de validation vient de `_dto/`.

```ts
// _hooks/useDeviceForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deviceSchema } from "../_dto/device.dto";
import type { Device } from "../_types/device.types";

export const useDeviceForm = (defaultValues?: Partial<Device>) => {
  const form = useForm<Device>({
    resolver: zodResolver(deviceSchema),
    defaultValues,
  });

  return form;
};
```

## 8. Toast après chaque soumission ou action faillible

Après une soumission de formulaire, ou toute action qui peut échouer (mutation, copie, téléchargement…), **toujours afficher un toast** : `toast.success` en cas de réussite, `toast.error` en cas d'échec.

- On utilise Sonner (composant shadcn `sonner`). Le `<Toaster />` est monté une seule fois, dans `app/layout.tsx`.
- Le toast part du hook, pas du composant. Pour une mutation, il est déclenché dans `onSuccess` et `onError` du hook (voir `useDeviceMutation` au §5). Un formulaire soumis via une mutation hérite donc du toast.
- Une action qui ne passe pas par TanStack Query est entourée d'un `try/catch` dans son hook, avec un toast dans chaque branche.
- Les textes viennent de `success` et `error` dans le fichier de l'entité (`DEVICE.success.create`, `DEVICE.error.create`), jamais écrits en dur.
- Les erreurs de validation d'un champ restent affichées sous le champ (`FieldError`). Le toast porte le résultat de la soumission.

## 9. Icônes

Toute icône vient de `lucide-react`, jamais d'une autre librairie ni d'un SVG dessiné à la main.

```tsx
import { LayoutDashboard } from "lucide-react";
```

Tailles, épaisseur de trait et usage par contexte (nav, bouton, badge, statut…) : voir `design.md` § Icônes.

## 10. Tableaux avec TanStack Table

Tout tableau de données utilise `@tanstack/react-table` en v9 (version `latest` publiée, ex. `9.2.4`), via deux briques partagées : le hook `hooks/useDataTable.ts` (état et actions) et le composant `components/data-table/DataTable.tsx` (affichage). Aucune page n'appelle `useTable` ni ne déclare ses propres `tableFeatures`.

- **La v9 change l'API par rapport à la v8** (encore la version la plus répandue dans les exemples et tutoriels existants) : le hook s'appelle `useTable` (pas `useReactTable`), un objet `features` construit via `tableFeatures(...)` est obligatoire, et le rendu passe par la méthode `table.FlexRender` (pas d'import `flexRender` séparé). Le filtre global exige `columnFilteringFeature` avant `globalFilteringFeature`.
- `components/data-table/data-table-features.ts` enregistre **une seule fois** les fonctionnalités : tri, pagination, filtre global (recherche) et sélection de lignes. Il exporte `dataTableFeatures`, le type `DataTableColumnDef<TData>` et `createDataTableColumnHelper<TData>()`.
- Le hook porte tout l'état : `search` / `setSearch`, `sorting`, `pagination` (`pageIndex`, `pageCount`, `totalRows`, `previous`, `next`, `goTo`, `setPageSize`…) et `selection` (`selectedRows`, `selectedCount`, `clear`). Avec `enableSelection: true`, il ajoute la colonne de cases à cocher. `selectedRows` ne contient que les lignes **visibles** (filtrées) : une action groupée ne touche jamais une ligne masquée par la recherche.
- **Deux modes.** Sans option `server` (mode client), `data` contient toutes les lignes et le hook trie, cherche et pagine en mémoire : réservé aux petites listes déjà chargées (ex. les cartes du tableau de bord). Avec `server` (mode serveur), l'API trie, cherche, filtre et pagine, `data` n'est que la page courante : c'est le cas de toute collection venant de l'API (voir §14).
- Le composant reçoit le résultat du hook : `<DataTable dataTable={dataTable} />`. La recherche, la pagination et la barre d'actions (`toolbarActions`, `selectionActions`) sont optionnelles. `DataTableSearch` et `DataTablePagination` s'utilisent aussi seuls (ex. recherche dans l'en-tête d'une Card).
- Chaque page ne définit que ses colonnes, dans `_components/<entite>-columns.tsx`, avec `createDataTableColumnHelper<Entite>()`. Le tri est **actif par défaut** sur les colonnes à accesseur : mettre `enableSorting: false` sur celles où il n'a pas de sens (statut, actions). Les colonnes numériques et les dates démarrent en tri décroissant.
- La recherche et le tri portent sur la **valeur d'accesseur**. Pour chercher sur ce que l'utilisateur lit (ex. le libellé d'un statut), l'accesseur retourne le libellé et `cell` affiche le badge. Pour trier une date sur la date et non sur le texte, l'accesseur retourne le timestamp et `cell` le formate (`formatRelativeTime`). `enableGlobalFilter: false` exclut une colonne de la recherche.
- Les libellés d'en-tête suivent la règle des constantes (§6) : pas de texte en dur dans un fichier de colonnes. Les textes du tableau lui-même (recherche, pagination, sélection) sont dans `constants/data-table.ts`.
- Le composant rend le balisage avec le wrapper `components/tables/Table.tsx`, jamais avec `components/ui/table.tsx` (voir §4).

```tsx
// app/devices/_components/device-columns.tsx
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { DEVICE } from "@/constants/device";
import type { Device } from "../_types/device.types";

const helper = createDataTableColumnHelper<Device>();

export const deviceColumns = [
  helper.accessor("model", { header: DEVICE.table.model }),
  helper.accessor("serial", { header: DEVICE.table.serial, enableSorting: false }),
];
```

```tsx
// app/devices/_components/DevicesPageClient.tsx
"use client";

import { DataTable } from "@/components/data-table/DataTable";
import { useDataTable } from "@/hooks/useDataTable";
import { deviceColumns } from "./device-columns";
import { useFetchDeviceCollection } from "../_hooks/useFetchDeviceCollection";

export const DevicesPageClient = () => {
  const { data } = useFetchDeviceCollection();
  const dataTable = useDataTable({
    data: data ?? [],
    columns: deviceColumns,
    enableSelection: true,
    getRowId: (device) => device.id,
  });

  return (
    <DataTable
      dataTable={dataTable}
      selectionActions={(devices) => <RemoveDevicesButton devices={devices} />}
    />
  );
};
```

## 11. Déclaration des pages : Server Component + délégation client

`page.tsx` (et `layout.tsx`) exporte **toujours** un composant en fonction fléchée asynchrone, jamais en `function`, jamais en flèche exportée inline (`export default () => ...`). La déclaration et l'`export default` sont deux instructions séparées.

```tsx
// app/(auth)/login/page.tsx
const LoginPage = async () => {
  return (
    <>
      <h1>Welcome to MDM</h1>
      <p>login to access</p>
    </>
  );
};

export default LoginPage;
```

`page.tsx` reste donc **toujours** un Server Component, sans exception : jamais de `"use client"` dessus. Dès qu'une page a besoin d'un hook client (TanStack Query, React Hook Form, `useState`...), on délègue à un unique composant enfant qui porte `"use client"` et enveloppe tout ce qui en dépend, nommé `<NomPage>Client`, dans `_components/`.

```tsx
// app/(auth)/login/page.tsx
import { LoginPageClient } from "./_components/LoginPageClient";

const LoginPage = async () => {
  return (
    <>
      <h1>Welcome to MDM</h1>
      <LoginPageClient />
    </>
  );
};

export default LoginPage;
```

```tsx
// app/(auth)/login/_components/LoginPageClient.tsx
"use client";

import { useLoginForm } from "../_hooks/useLoginForm";

export const LoginPageClient = () => {
  const form = useLoginForm();

  // ...

  return <form>{/* ... */}</form>;
};
```

## 12. Route handlers (API routes) : fonction fléchée async

Même règle pour les route handlers (`app/**/route.ts`) : chaque méthode HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) est une **constante exportée en fonction fléchée asynchrone**, jamais `export async function GET(...)`.

```ts
// app/api/devices/route.ts
export const GET = async (request: Request) => {
  const devices = await fetchDevices();
  return Response.json(devices);
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const device = await createDevice(body);
  return Response.json(device, { status: 201 });
};
```

## 13. Métadonnées de page : `generateMetadata`

Chaque `page.tsx` qui a besoin d'un titre passe **toujours** par `generateTitleMetadata` (`@/lib/page-metadata`) : `title` est obligatoire, `description` ne l'est pas.

`generateMetadata` suit la même règle que les route handlers (§12) : une constante exportée en fonction fléchée asynchrone, jamais `export async function generateMetadata`. Next.js exige ce nom d'export précis, donc pas d'`export default` ici.

`props` ne s'écrit jamais en `any`. Depuis Next.js 15, `params` et `searchParams` sont des `Promise` : on les type avec `PageProps` (`@/lib/page-metadata`), qui prend en générique la forme des `params` dynamiques de la route (vide par défaut pour une route statique). Le même type `PageProps` sert aussi pour le composant de page lui-même.

```tsx
// app/(auth)/login/page.tsx
import { generateTitleMetadata, PageProps } from "@/lib/page-metadata";
import { ResolvingMetadata } from "next";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
  const prevMetadata = await parent;
  const metadata = generateTitleMetadata({ title: "Login" });

  return {
    ...prevMetadata,
    ...metadata,
  };
};

const LoginPage = async (props: PageProps) => {
  return (
    <>
      <h1>Welcome to MDM</h1>
      <p>login to access</p>
    </>
  );
};

export default LoginPage;
```

Route avec un segment dynamique (`app/devices/[id]/page.tsx`) : on précise le générique `Params` de `PageProps`.

```tsx
export const generateMetadata = async (props: PageProps<{ id: string }>, parent: ResolvingMetadata) => {
  const { id } = await props.params;
  const prevMetadata = await parent;
  const metadata = generateTitleMetadata({ title: `Appareil ${id}` });

  return { ...prevMetadata, ...metadata };
};
```

```tsx
// app/devices/page.tsx
import { DevicesPageClient } from "./_components/DevicesPageClient";

const DevicesPage = async () => {
  return <DevicesPageClient />;
};

export default DevicesPage;
```

```tsx
// app/devices/_components/DevicesPageClient.tsx
"use client";

import { DataTable } from "@/components/data-table/DataTable";
import { useDataTable } from "@/hooks/useDataTable";
import { deviceColumns } from "./device-columns";
import { useFetchDeviceCollection } from "../_hooks/useFetchDeviceCollection";

export const DevicesPageClient = () => {
  const { data } = useFetchDeviceCollection();
  const dataTable = useDataTable({ data: data ?? [], columns: deviceColumns });

  return <DataTable dataTable={dataTable} />;
};
```

Le découpage `page.tsx` / `DevicesPageClient` suit la règle du §11.

## 14. Collections paginées côté serveur

Un tableau dont les données viennent d'une collection de l'API ne charge jamais toute la liste : l'API pagine, trie, cherche et filtre (contrat dans `.claude/rules/backend-conventions.md` §1). L'état du tableau vit dans l'**URL**, au format même de l'API : un lien partagé, un rechargement ou le bouton retour rouvrent le tableau tel quel.

```
URL de la page  /wifi-networks?page=2&sort=name&search=bureau&security=WPA2,WPA3
      │  nuqs
use<Ressources>Table ─┬─ useDataTableSearchParams  →  server (état contrôlé + rowCount)  →  useDataTable({ server })
                      │        │  query (recherche retardée)
                      └─ useFetch<Ressource>Collection(query)  →  _services/<page>.api.ts  →  GET /api/v1/<ressource>?<query>
                               │  proxy Next (route handler)
API  GET /<ressource>?page=2&limit=8&search=bureau&sort=name&security=WPA2,WPA3
```

### Les briques

| Brique | Rôle |
|---|---|
| `hooks/useDataTableSearchParams.ts` | Garde `page`, `limit`, `search`, `sort` et les filtres dans l'URL (nuqs). Renvoie `table` (état + handlers pour `useDataTable`) et `query` (la query string de l'API). |
| `hooks/useDataTable.ts`, option `server` | Mode manuel : `data` est la page courante, `rowCount` le total de l'API. |
| `hooks/useDebouncedValue.ts` | Retarde la recherche dans `query` (300 ms) : une requête par pause de frappe, pas une par touche. |
| `components/data-table/data-table-search-params.ts` | Parser nuqs du tri (`-createdAt,ssid` ↔ `[{ id, desc }]`). |
| `lib/api/dto/pagination.dto.ts` | `toPaginatedSchema(item)` : valide la réponse `{ data, metadata: { page, limit, total, totalPages } }`. |
| `lib/api/api-handlers.ts`, `withSearchParams` | Le proxy relaie la query string telle quelle : c'est l'API qui la valide. |

Le `NuqsAdapter` est monté une fois dans `app/layout.tsx`.

### Règles

- **Un id de colonne triable est un champ que l'API sait trier** (la liste `sortable` de son DTO). Sinon le clic sur l'en-tête envoie un `sort` refusé et l'API répond 400. Une colonne que l'API ne trie pas prend `enableSorting: false` ; une colonne `helper.display` n'est jamais triable.
- **Un filtre porte le nom de la colonne et du paramètre de l'API.** Il est déclaré par un parser nuqs (`parseAsArrayOf(parseAsStringLiteral(KEYS))`) et se règle via la colonne : `table.getColumn("security")?.setFilterValue(["WPA2"])`.
- **Les options de `useDataTableSearchParams` (`pageSize`, `defaultSorting`, `filters`) sont des constantes de module**, déclarées en haut du hook `use<Ressources>Table`.
- `defaultSorting` reprend le tri par défaut de l'API : l'en-tête affiche la flèche dès l'arrivée. Les valeurs par défaut ne s'écrivent pas dans l'URL, mais `query` envoie toujours `page` et `limit` (la taille de page du front n'est pas celle de l'API), et `sort` dès qu'un tri est actif, tri par défaut compris.
- Changer le tri, la recherche ou un filtre ramène en page 1. En mode serveur, changer de page, de tri ou de filtre vide aussi la sélection : `selectedRows` ne contient que des lignes de la page affichée.
- **Un hook de tableau par page**, `_hooks/use<Ressources>Table.ts` (ex. `useWifiNetworksTable`), assemble `useDataTableSearchParams` et `useFetch<Ressource>Collection(query)`. Il renvoie les lignes de la page, `server` (à passer tel quel à `useDataTable({ server })`, `rowCount` compris), `isPending`, `isError` et `refetch`. `<Page>Client` l'appelle à la place des deux hooks.
- **Lecture** : `useFetch<Ressource>Collection(query?)` ne connaît pas l'URL, il reste réutilisable hors du tableau (widget, autre page). Sans `query`, il appelle l'endpoint sans paramètre et reçoit les valeurs par défaut de l'API (page 1, 20 lignes, son tri par défaut). Il garde `placeholderData: keepPreviousData` : le tableau conserve ses lignes pendant le chargement de la page suivante au lieu de repasser en squelette.
- **Clés** : `collection` est le préfixe de toutes les pages ; c'est lui qu'une mutation invalide (§5). Chaque page a sa clé `collectionPage(query)`.
- **Total global** (ex. « 12 réseaux enregistrés » dans le sous-titre) : `metadata.total` compte les résultats **filtrés**. Un total qui ne doit pas bouger avec la recherche est une requête à part, `limit=1`, avec sa clé `count` sous le même préfixe.
- **Appel API** : `fetch` vers le proxy `/api/v1/<ressource>?${query}` ; une réponse non `ok` lève `createHttpError(response.status)` (import depuis `@/lib/api/intefaces/http-errors`, jamais `api-handlers.ts` côté client : il importe `next/server`). La réponse passe par `<Ressource>Dto.parseCollection`, construit avec `toPaginatedSchema`.
- **Proxy** : le route handler `GET` relaie `request.nextUrl.searchParams` via `withSearchParams` (dans `endpoints.ts`), sans filtrer ni renommer les paramètres.
- `useDataTableSearchParams` lit l'URL via `useSearchParams` : une page **statique** qui l'utilise doit l'envelopper dans `<Suspense>`. Les pages du dashboard sont dynamiques (session), elles n'en ont pas besoin.

### Exemple

```ts
// _services/wifi-networks.queries.ts
const COLLECTION = ["wifi-networks", "collection"] as const;

export const WIFI_NETWORKS = {
  // Préfixe des pages du tableau et du total : l'invalider après une mutation les recharge toutes.
  collection: COLLECTION,
  collectionPage: (query: string) => [...COLLECTION, "page", query] as const,
  count: [...COLLECTION, "count"] as const,
} as const;
```

```ts
// _dto/wifi-network.dto.ts
const wifiNetworkCollectionSchema = toPaginatedSchema(wifiNetworkSchema);

export const WifiNetworkDto = {
  parse: (data: unknown) => wifiNetworkSchema.parse(data),
  parseCollection: (data: unknown) => wifiNetworkCollectionSchema.parse(data),
};
```

```ts
// _services/wifi-networks.api.ts
// Sans `query`, l'API applique ses valeurs par défaut.
export const fetchWifiNetworkCollectionApi = async (query = "") => {
  const response = await fetch(query ? `/api/v1/wifi-networks?${query}` : "/api/v1/wifi-networks");
  if (!response.ok) throw createHttpError(response.status);
  return WifiNetworkDto.parseCollection(await response.json());
};
```

```ts
// _hooks/useFetchWifiNetworkCollection.ts
export const useFetchWifiNetworkCollection = (query = "") =>
  useQuery({
    queryKey: WIFI_NETWORKS.collectionPage(query),
    queryFn: () => fetchWifiNetworkCollectionApi(query),
    placeholderData: keepPreviousData,
  });
```

```ts
// _hooks/useWifiNetworksTable.ts
const PAGE_SIZE = 8;
const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];
const FILTERS = { security: parseAsArrayOf(parseAsStringLiteral(WIFI_SECURITY_KEYS)) };
const NO_NETWORKS: WifiNetwork[] = [];

export const useWifiNetworksTable = () => {
  const searchParams = useDataTableSearchParams({ pageSize: PAGE_SIZE, defaultSorting: DEFAULT_SORTING, filters: FILTERS });
  const { data, isPending, isError, refetch } = useFetchWifiNetworkCollection(searchParams.query);

  return {
    networks: data?.data ?? NO_NETWORKS,
    server: { ...searchParams.table, rowCount: data?.metadata.total ?? 0 },
    isPending,
    isError,
    refetch,
  };
};
```

```tsx
// _components/WifiNetworksPageClient.tsx
"use client";

export const WifiNetworksPageClient = () => {
  const { networks, server, isPending, isError, refetch } = useWifiNetworksTable();

  return (
    <WifiNetworksTableCard
      networks={networks}
      server={server}
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
    />
  );
};
```

```tsx
// _components/WifiNetworksTableCard.tsx
export const WifiNetworksTableCard = ({ networks, server, ...queryState }: WifiNetworksTableCardProps) => {
  const dataTable = useDataTable({
    data: networks,
    columns: wifiNetworkColumns,
    enableSelection: true,
    getRowId: (network) => network.id,
    server,
  });
  // ...
};
```
