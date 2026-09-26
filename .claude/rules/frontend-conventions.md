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
├── _services/     un fichier pour les appels API, un fichier pour les fonctions utilitaires
├── _types/        types TypeScript de la page
├── _dto/          schémas Zod + objet de validation/parsing
└── page.tsx
```

- `_services/dashboard.api.ts` : uniquement les fonctions d'appel API.
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

Aucun fichier de `components/ui/` n'est modifié (pas de prop ajoutée, pas de classe changée). Pour personnaliser, on crée un wrapper dans le dossier du contexte, qui importe le composant shadcn et applique nos modifications. Les pages et composants importent le wrapper, jamais `components/ui/` directement.

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
- Les actions retournées portent un **verbe d'action seul** : `create`, `update`, `remove`, pas `createDevice`.
- **Jamais de `fetch` écrit dans `queryFn` ou `mutationFn`.** On passe la fonction importée depuis `_services/<page>.api.ts`, nommée `<verbe><Ressource>Api`.

```ts
// _services/dashboard.api.ts
import { DeviceDto } from "../_dto/device.dto";

export const fetchDeviceCollectionApi = async () => {
  const response = await fetch("/api/devices");
  return DeviceDto.parseCollection(await response.json());
};
```

```ts
// _hooks/useFetchDeviceCollection.ts
import { useQuery } from "@tanstack/react-query";
import { fetchDeviceCollectionApi } from "../_services/dashboard.api";

export const useFetchDeviceCollection = () =>
  useQuery({ queryKey: ["devices"], queryFn: fetchDeviceCollectionApi });
```

```ts
// _hooks/useDeviceMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDeviceApi, updateDeviceApi, removeDeviceApi } from "../_services/dashboard.api";

export const useDeviceMutation = () => {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["devices"] });

  const create = useMutation({ mutationFn: createDeviceApi, onSuccess });
  const update = useMutation({ mutationFn: updateDeviceApi, onSuccess });
  const remove = useMutation({ mutationFn: removeDeviceApi, onSuccess });

  return { create, update, remove };
};
```

## 6. Constantes : messages d'erreur et libellés

Aucun texte d'erreur ni libellé d'action ou de bouton n'est écrit en dur dans un composant. Ils vivent dans `constants/`. Si le fichier adéquat n'existe pas, le créer.

- `constants/errors.ts` : messages d'erreur **génériques** (pas de détail technique affiché).
- `constants/actions.ts` : noms des actions et libellés des boutons, à l'infinitif (« Enrôler un appareil », « Verrouiller »), voir `design-system/README.md` › Contenu et ton.

```ts
// constants/errors.ts
export const ERROR_MESSAGES = {
  GENERIC: "Une erreur est survenue. Réessayez.",
  NETWORK: "Connexion impossible. Vérifiez votre réseau.",
  NOT_FOUND: "Élément introuvable.",
} as const;

// constants/actions.ts
export const ACTION_LABELS = {
  ENROLL_DEVICE: "Enrôler un appareil",
  LOCK: "Verrouiller",
  SAVE: "Enregistrer",
} as const;
```

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
