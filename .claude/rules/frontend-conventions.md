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
└── page.tsx
```

- `_services/dashboard.api.ts` : uniquement les fonctions d'appel API.
- `_services/dashboard.queries.ts` : uniquement les clés des requêtes TanStack Query (voir §5).
- `_services/dashboard.utils.ts` : uniquement les fonctions utilitaires.
- `_dto/device.dto.ts` : les schémas Zod et un objet qui expose les méthodes de validation et de parsing.

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

Tout tableau de données utilise `@tanstack/react-table` en v9 (version `latest` publiée, ex. `9.2.4`). Aucune page n'appelle `useTable` ni ne déclare ses propres `tableFeatures` : on passe systématiquement par le wrapper unique `components/data-table/DataTable.tsx`.

- **La v9 change l'API par rapport à la v8** (encore la version la plus répandue dans les exemples et tutoriels existants) : le hook s'appelle `useTable` (pas `useReactTable`), un objet `features` construit via `tableFeatures(...)` est obligatoire, et le rendu passe par la méthode `table.FlexRender` (pas d'import `flexRender` séparé). Le row model « core » est inclus par défaut ; seuls le tri et la pagination doivent être déclarés comme features.
- Le wrapper enregistre **une seule fois** les features communes (tri + pagination). Les pages n'ont jamais à répéter cette configuration.
- Chaque page ne définit que ses colonnes, dans `_components/<entite>-columns.tsx`, avec `createColumnHelper<typeof dataTableFeatures, Entite>()` (le `dataTableFeatures` exporté par le wrapper).
- Les libellés d'en-tête suivent la règle des constantes (§6) : pas de texte en dur dans un fichier de colonnes.
- Le wrapper rend le balisage avec les primitives shadcn de `components/ui/table.tsx`, jamais modifiées directement (voir §4).

```tsx
// components/data-table/DataTable.tsx
"use client";

import { useState } from "react";
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

type DataTableProps<TData> = {
  columns: ColumnDef<typeof dataTableFeatures, TData>[];
  data: TData[];
  emptyMessage?: string;
};

export const DataTable = <TData,>({ columns, data, emptyMessage = "Aucun résultat." }: DataTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
```

```tsx
// app/devices/_components/device-columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { dataTableFeatures } from "@/components/data-table/DataTable";
import type { Device } from "../_types/device.types";

const helper = createColumnHelper<typeof dataTableFeatures, Device>();

export const deviceColumns = [
  helper.accessor("model", { header: DEVICE.table.model }),
  helper.accessor("serial", { header: DEVICE.table.serial }),
];
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
import { deviceColumns } from "./device-columns";
import { useFetchDeviceCollection } from "../_hooks/useFetchDeviceCollection";

export const DevicesPageClient = () => {
  const { data } = useFetchDeviceCollection();

  return <DataTable columns={deviceColumns} data={data ?? []} />;
};
```

Le découpage `page.tsx` / `DevicesPageClient` suit la règle du §11.
