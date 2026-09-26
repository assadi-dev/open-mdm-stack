# Intégration shadcn/ui

`apps/web` (Next.js 16, React 19, Tailwind v4) s'appuie sur shadcn/ui, sur les primitives **Base UI**. On installe les composants officiels, puis on applique le thème (§2) et les ajustements, dans des wrappers (§3). Pas de composant maison : chaque élément des écrans est un composant shadcn, un wrapper d'un composant shadcn ou une composition des deux.

## 1. Installation

Depuis `apps/web` :

```bash
npx shadcn@latest init --base base --preset nova
npx shadcn@latest add button badge card input input-group field label select checkbox switch tabs table sidebar breadcrumb pagination item avatar progress separator tooltip alert dropdown-menu alert-dialog chart
```

- Primitives : **Base UI** (`@base-ui/react`), style `base-nova` dans `components.json`. Pas de Radix. Les classes du §3 sont calées sur les fichiers générés par ce style.
- `iconLibrary` : `lucide`.
- Police : `Inter` chargée par `next/font/google` avec `variable: "--font-inter"` et `weight: ["400", "500", "600"]`, appliquée sur `<html>`. Le preset nova amène Geist : le remplacer par Inter partout, y compris dans les variables de police que l'init ajoute.
- `globals.css` : remplacer le thème généré par celui du §2, en gardant les `@import` que l'init place en tête du fichier.
- Les fichiers de `components/ui/` restent tels que la CLI les génère (`.claude/rules/frontend-conventions.md` §4).

## 2. `app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 16px;

  /* Primitives Flame & Sand */
  --flame-50: #FFF6EC; --flame-100: #FDE8D0; --flame-200: #F7D3A8; --flame-300: #F2B474; --flame-400: #EA903A;
  --flame-500: #E27100; --flame-600: #C15F00; --flame-700: #9E4A00; --flame-800: #743806; --flame-900: #4F2805;
  --sand-0: #FFFFFF; --sand-50: #FEF7EC; --sand-100: #FBF0DD; --sand-200: #F2EDE5; --sand-300: #E6DFD2; --sand-400: #D3CEC5;
  --sand-500: #A8A29A; --sand-600: #87837E; --sand-700: #66615A; --sand-800: #3D3A36; --sand-900: #2D2C2A; --sand-950: #1F1C18;
  --ambient-top: #D3D3D3; --ambient-mid: #E6DFD2; --ambient-bottom: #FEEED2;
  --flow-orange: #EB9629; --flow-sage: #C0A771; --flow-sky: #7DC1DE;

  /* Variables shadcn */
  --background: var(--ambient-mid);
  --foreground: var(--sand-950);
  --card: #FFFFFF47;
  --card-foreground: var(--sand-950);
  --popover: var(--sand-50);
  --popover-foreground: var(--sand-950);
  --primary: var(--flame-500);
  --primary-foreground: var(--sand-0);
  --secondary: #FFFFFF8C;
  --secondary-foreground: var(--sand-950);
  --muted: #FFFFFF8C;
  --muted-foreground: var(--sand-700);
  --accent: #FFFFFF8C;
  --accent-foreground: var(--sand-950);
  --destructive: #A91F2F;
  --border: #1F1C1814;
  --input: #FFFFFF99;
  --ring: var(--flame-400);
  --chart-1: var(--flame-500); --chart-2: #3B8FEF; --chart-3: #12A091; --chart-4: #8C3F8F; --chart-5: #A8A29A;
  --sidebar: #FFFFFF47;
  --sidebar-foreground: var(--sand-950);
  --sidebar-primary: var(--flame-500);
  --sidebar-primary-foreground: var(--sand-0);
  --sidebar-accent: #FFFFFF8C;
  --sidebar-accent-foreground: var(--sand-950);
  --sidebar-border: #FFFFFF99;
  --sidebar-ring: var(--flame-400);

  /* Ajouts Open MDM */
  --card-strong: #FFFFFF8C;
  --card-border: #FFFFFF99;
  --subtle-foreground: #8C877F;
  --border-strong: #1F1C1824;
  --primary-soft: var(--flame-100);
  --primary-text: var(--flame-700);
  --ink: var(--sand-900);
  --ink-foreground: var(--sand-0);
  --success: #1FBF5E; --success-soft: #1FBF5E1F; --success-text: #0B6E34;
  --warning: #E8A317; --warning-soft: #E8A31724; --warning-text: #7F5300;
  --danger: #E5484D;  --danger-soft: #E5484D1A;  --danger-text: #A91F2F;
  --info: #3B8FEF;    --info-soft: #3B8FEF1A;    --info-text: #155CB2;
  --chart-track: #F4E2CB;
  --seq-1: #EA903A; --seq-2: #D96C00; --seq-3: #AA5400; --seq-4: #743806;
  --gradient-ambient: linear-gradient(180deg, var(--ambient-top) 0%, var(--ambient-mid) 50%, var(--ambient-bottom) 100%);
  --gradient-flow: linear-gradient(90deg, var(--flow-orange) 0%, var(--flow-sage) 50%, var(--flow-sky) 100%);
  --gradient-flame: linear-gradient(90deg, var(--flame-500) 0%, var(--flame-400) 55%, var(--flame-200) 100%);
}

@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-card-strong: var(--card-strong);
  --color-card-border: var(--card-border);
  --color-subtle-foreground: var(--subtle-foreground);
  --color-border-strong: var(--border-strong);
  --color-primary-soft: var(--primary-soft);
  --color-primary-text: var(--primary-text);
  --color-ink: var(--ink);
  --color-ink-foreground: var(--ink-foreground);
  --color-success: var(--success); --color-success-soft: var(--success-soft); --color-success-text: var(--success-text);
  --color-warning: var(--warning); --color-warning-soft: var(--warning-soft); --color-warning-text: var(--warning-text);
  --color-danger: var(--danger);   --color-danger-soft: var(--danger-soft);   --color-danger-text: var(--danger-text);
  --color-info: var(--info);       --color-info-soft: var(--info-soft);       --color-info-text: var(--info-text);
  --color-chart-track: var(--chart-track);
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 22px;
  --radius-3xl: 28px;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html {
    min-height: 100%;
    background-color: var(--background);
    background-image: var(--gradient-ambient);
    background-attachment: fixed;
  }
  body { @apply font-sans text-sm text-foreground antialiased; }
}

/* Sous-parties shadcn qu'aucun wrapper n'atteint (voir §3).
   Hors @layer : ces règles priment sur les utilitaires Tailwind. */
[data-slot="alert-dialog-overlay"] {
  background-color: color-mix(in oklab, var(--foreground) 40%, transparent);
}
```

Le mode sombre (`.dark`) n'est pas défini : il est prévu pour la V2.

## 3. Ajustements par composant, dans des wrappers

`components/ui/` n'est jamais modifié (`.claude/rules/frontend-conventions.md` §4). Chaque ajustement ci-dessous vit dans un **wrapper** rangé dans `components/<contexte>/` (ex. `components/buttons/Button.tsx`) : il importe le composant shadcn, ajoute ses classes avec `cn(…, className)` et transmet toutes les autres props. Les écrans importent le wrapper, jamais `@/components/ui/*`. Un wrapper n'est pas un composant inventé : il porte le nom et l'API du composant shadcn qu'il enveloppe.

Les classes sont calées sur les fichiers générés par le style `base-nova`. Après chaque `add`, relire le fichier généré : si une classe d'origine a changé, adapter le wrapper.

**Trois façons d'atteindre une classe**

1. **Sur l'élément qui reçoit `className`** : réécrire la classe avec le *même préfixe de variante* que dans le fichier généré (`hover:`, `focus:`, `data-active:`, `data-unchecked:`, `data-[size=default]:`, `group-data-horizontal/tabs:`…). `cn` (tailwind-merge) remplace alors la classe d'origine. Avec un autre préfixe, les deux classes coexistent et le résultat dépend de l'ordre du CSS.
2. **Sur une sous-partie rendue par le composant** (piste et indicateur de Progress, intérieur de la Sidebar) : la cibler depuis le wrapper par son `data-slot`, avec `*:` ou `**:data-[slot=…]:` et le suffixe `!`. tailwind-merge ne voit pas la classe d'origine, et la spécificité peut être égale.
3. **Sur une sous-partie hors de l'arbre de `className`** : re-scoper une variable CSS sur le wrapper (flèche du Tooltip), ou écrire une règle par `data-slot` dans `globals.css`, hors `@layer` (overlay de l'AlertDialog, §2).

**Variantes ajoutées (➕)** : le wrapper élargit le type de `variant`, traduit la nouvelle valeur en classes et passe une variante shadcn existante en dessous. Les classes de statut s'écrivent en entier dans un objet (`bg-success-soft text-success-text`), jamais `bg-${statut}-soft` : Tailwind ne détecte pas les noms construits.

```tsx
// components/buttons/Button.tsx
import type { ComponentProps } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShadcnButtonProps = ComponentProps<typeof ShadcnButton>;
type ButtonVariant = NonNullable<ShadcnButtonProps["variant"]> | "ink";
type ButtonSize = NonNullable<ShadcnButtonProps["size"]>;
type ButtonProps = Omit<ShadcnButtonProps, "variant" | "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASSES: Partial<Record<ButtonVariant, string>> = {
  default: "hover:bg-primary/90",
  secondary: "border-card-border hover:bg-secondary/80",
  outline: "border-border-strong bg-transparent",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  link: "text-primary-text",
  ink: "bg-ink text-ink-foreground hover:bg-ink/90",
};

const SIZE_CLASSES: Partial<Record<ButtonSize, string>> = {
  default: "h-11 px-4.5 text-[15px] font-semibold [&_svg:not([class*='size-'])]:size-4.5",
  sm: "h-9 px-3.5 font-semibold",
  lg: "h-12 px-6",
  icon: "size-11 rounded-full",
  "icon-sm": "size-9 rounded-full",
  "icon-lg": "size-12 rounded-full",
};

export const Button = ({ variant = "default", size = "default", className, ...props }: ButtonProps) => (
  <ShadcnButton
    variant={variant === "ink" ? "default" : variant}
    size={size}
    className={cn("rounded-md", VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
    {...props}
  />
);
```

| Composant | Classes ajoutées par le wrapper | Pourquoi |
|---|---|---|
| Tous | `shadow-none` partout où le fichier généré pose une ombre, avec le même préfixe (ex. `group-data-[variant=default]/tabs-list:data-active:shadow-none`) | La DA n'a pas d'ombre |
| **Button** | Voir l'exemple : `rounded-md` · tailles `default` 44px, `sm` 36px, `lg` 48px, icônes rondes `size-11` / `size-9` / `size-12` · `secondary` : `border-card-border hover:bg-secondary/80` · `outline` : `border-border-strong bg-transparent` · `destructive` : `bg-destructive text-white hover:bg-destructive/90` · `link` : `text-primary-text` · `default` : `hover:bg-primary/90` | Contrôles de 44px. base-nova livre un `destructive` pâle (`bg-destructive/10`) : la charte le veut plein, blanc dessus à 7,2:1 |
| | ➕ `ink` : `bg-ink text-ink-foreground hover:bg-ink/90`, sur la variante `default` | Bouton sombre de la DA (« Verrouiller ») |
| **Badge** | `h-6 rounded-full px-2.5 py-1 gap-1.5 font-semibold [&>svg]:size-3.5!` · `default` : `bg-primary-soft text-primary-text` | Pill 12/600 ; le blanc sur orange en 12px échoue. `!` parce que le fichier généré force `size-3!` |
| | ➕ `success`, `warning`, `danger`, `info` : `bg-{s}-soft text-{s}-text`, sur la variante `secondary`. Pastille : `<span className="size-[7px] rounded-full bg-{s}" />` | Statuts, toujours avec pastille ou icône |
| **Card** | `ring-card-border [--card-spacing:--spacing(6)]` (KPI : `gap-4 py-5` en plus) · CardTitle `text-lg font-semibold tracking-[-0.3px]` · CardDescription `text-[13px]` | Le contour de base-nova est un `ring`, pas une `border`. `--card-spacing` pilote le padding et le gap |
| **Input** | `h-11.5 rounded-md bg-card-strong px-4 placeholder:text-subtle-foreground` | Champ de verre de 46px, placeholder décoratif |
| **InputGroup** | `h-11.5 rounded-md bg-card-strong` | Idem |
| **SelectTrigger** | `rounded-md bg-card-strong px-4 data-[size=default]:h-11.5 data-[size=sm]:h-9 data-placeholder:text-subtle-foreground` | Idem. Les hauteurs sont portées par `data-[size=…]:` dans le fichier généré |
| **SelectContent**, **DropdownMenuContent** | `shadow-none ring-border` | Surface opaque `popover` déjà en place, contour encre 8 % |
| **SelectItem**, **DropdownMenuItem** | `rounded-sm px-2.5 py-2 focus:bg-primary-soft` | Survol visible sur crème. Le fichier généré utilise `focus:`, pas `data-highlighted:` |
| **Checkbox** | `border-[1.5px] border-muted-foreground bg-card-strong` | Contour à 4,6:1 (`border-input` serait invisible) |
| **Switch** | `data-unchecked:bg-muted-foreground` | Piste éteinte visible (4,6:1) |
| **Tabs** | TabsList `group-data-horizontal/tabs:h-11` · TabsTrigger `px-4 data-active:bg-ink data-active:text-ink-foreground data-active:font-semibold group-data-[variant=default]/tabs-list:data-active:shadow-none` | Onglet actif en Obsidian, comme la pill de filtre de la référence |
| **Table** | TableHeader `bg-card-strong` · TableHead `h-10 px-4 text-xs text-muted-foreground` · TableCell `px-4 py-3` | En-tête en verre dense, lignes aérées |
| **Sidebar** | SidebarProvider : `style={{ "--sidebar-width": "17.5rem", ...style }}` · Sidebar : `p-6 pr-0 *:data-[slot=sidebar-inner]:rounded-2xl! *:data-[slot=sidebar-inner]:p-3 *:data-[slot=sidebar-inner]:shadow-none!` | Sidebar de 280px posée comme une carte. La largeur passe par la variable, que `SidebarProvider` laisse surcharger via `style` |
| | SidebarMenuButton : `h-11 px-3.5 gap-3 rounded-md text-[15px] [&_svg]:size-5 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:font-semibold` | Lien actif orange |
| | SidebarGroupLabel `px-3.5 text-[13px] text-muted-foreground` · SidebarMenuBadge `right-3.5 rounded-full bg-danger text-white text-[11px] font-semibold peer-hover/menu-button:text-white peer-data-active/menu-button:text-white` | Compteur d'alertes rouge, qui reste blanc au survol et sur le lien actif |
| **Alert** | `border-card-border` · ➕ `success`, `warning`, `info` : `border-transparent bg-{s}-soft text-foreground *:[svg]:text-{s}-text *:data-[slot=alert-description]:text-foreground`, sur la variante `default` | Statuts ; `muted-foreground` sur `-soft` tombe à 4,1:1 |
| **Progress** | `**:data-[slot=progress-track]:bg-chart-track! **:data-[slot=progress-indicator]:bg-(image:--gradient-flame)` | Base UI pose déjà la largeur de l'indicateur en `width: %`, donc la flamme démarre toujours en `flame-500` |
| **Tooltip** | TooltipContent `font-semibold [--foreground:var(--ink)] [--background:var(--ink-foreground)]` | Bulle Obsidian. Le fichier généré peint la bulle et sa flèche en `bg-foreground` : re-scoper la variable colore aussi la flèche, que le wrapper n'atteint pas |
| **AlertDialog** | AlertDialogContent `rounded-2xl bg-background ring-card-border` · overlay : règle `data-slot` dans `globals.css` (§2) | Voile chaud, pas de noir froid. L'overlay est rendu à l'intérieur d'`AlertDialogContent`, hors de portée du wrapper |
| **Avatar** | AvatarFallback `text-[13px] font-semibold` | — |
| **Item** | ItemMedia `variant="icon"` : `rounded-sm border border-card-border bg-muted` | Pastille d'icône en verre |
| **Breadcrumb** | BreadcrumbList `text-[13px]` | — |

## 4. Recettes de graphes (`components/ui/chart`)

Chaque recette est un composant partagé de `components/charts/` (`ChartPieDonutText.tsx`…). Ce sont les seuls fichiers qui importent `@/components/ui/chart` ; les écrans importent la recette.

**ChartPieDonutText** : répartition, 5 parts au maximum.

```tsx
const config = {
  a14: { label: "Android 14", color: "var(--chart-1)" },
  a13: { label: "Android 13", color: "var(--chart-2)" },
  a12: { label: "Android 12", color: "var(--chart-3)" },
  a11: { label: "Android ≤ 11", color: "var(--chart-4)" },
  other: { label: "Autres", color: "var(--chart-5)" },
} satisfies ChartConfig
// data = [{ version: "a14", devices: 524, fill: "var(--color-a14)" }, …]
<ChartContainer config={config} className="aspect-square h-[190px]">
  <PieChart>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
    <Pie data={data} dataKey="devices" nameKey="version" innerRadius="70%" outerRadius="100%"
         paddingAngle={1.5} stroke="none" startAngle={90} endAngle={-270}>
      <Label content={/* valeur 24/600 + « appareils » en muted-foreground */} />
    </Pie>
  </PieChart>
</ChartContainer>
```

**ChartAreaFlow** : donnée dans le temps, trois aires en plage `[min, max]` autour d'un axe central.

```tsx
const rows = data.map((d) => ({
  month: d.month,
  outer: [-d.value, d.value],
  mid: [-d.value * 0.66, d.value * 0.66],
  core: [-d.value * 0.32, d.value * 0.32],
}))
<ChartContainer config={{ value: { label: "Commandes", color: "var(--flow-orange)" } }} className="h-[240px] w-full">
  <AreaChart data={rows}>
    <defs>
      <linearGradient id="flow" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="var(--flow-orange)" />
        <stop offset="0.5" stopColor="var(--flow-sage)" />
        <stop offset="1" stopColor="var(--flow-sky)" />
      </linearGradient>
    </defs>
    <XAxis dataKey="month" tickLine={false} axisLine={false} />
    <YAxis hide domain={["dataMin", "dataMax"]} />
    <Area dataKey="outer" type="monotone" fill="url(#flow)" fillOpacity={0.2} stroke="none" />
    <Area dataKey="mid" type="monotone" fill="url(#flow)" fillOpacity={0.45} stroke="none" />
    <Area dataKey="core" type="monotone" fill="url(#flow)" fillOpacity={1} stroke="none" />
    <ReferenceLine x="Juil." stroke="var(--ink)" strokeDasharray="4 4" />
  </AreaChart>
</ChartContainer>
```

Les deux pills (valeur en `ink` en haut, variation en `card-strong` en bas) sont des `Badge` positionnés sur la ligne de référence. Le mois actif de l'axe passe en `primary-text` semi-bold.

**ChartPieGauge** : jauge en demi-cercle de 18 segments.

```tsx
const segments = Array.from({ length: 18 }, (_, i) => ({ id: i, value: 1, on: i < Math.round((86 / 100) * 18) }))
<ChartContainer config={{}} className="h-[140px] w-[280px]">
  <PieChart>
    <defs>
      <linearGradient id="flame" gradientUnits="userSpaceOnUse" x1="0" x2="280" y1="0" y2="0">
        <stop offset="0" stopColor="var(--flame-500)" />
        <stop offset="0.55" stopColor="var(--flame-400)" />
        <stop offset="1" stopColor="var(--flame-200)" />
      </linearGradient>
    </defs>
    <Pie data={segments} dataKey="value" cx="50%" cy="100%" startAngle={180} endAngle={0}
         innerRadius="68%" outerRadius="100%" paddingAngle={3} cornerRadius={4} stroke="none">
      {segments.map((s) => <Cell key={s.id} fill={s.on ? "url(#flame)" : "var(--chart-track)"} />)}
    </Pie>
  </PieChart>
</ChartContainer>
```

## 5. Écrans → composants

| Écran | Composants shadcn |
|---|---|
| Tableau de bord | Sidebar, Breadcrumb, InputGroup, Button, Avatar, Card (KPI « section-cards »), Badge, Chart ×3, Item, Table, DropdownMenu, Progress |
| Appareils | Tabs, Badge, Button, InputGroup, Select, Checkbox, Table (motif data-table), DropdownMenu, Progress, Pagination |
| Détail appareil | Breadcrumb, Badge, Button, AlertDialog, Tabs, Card, Progress, Table, Item, Alert |
| Enrôlement | Item (étapes), Card, Field, Input, Select, Switch, Separator, Badge, Button, Alert, Table |
| Politiques | InputGroup, Button, Item (liste), Card, Badge, DropdownMenu, Tabs, Alert, Field, Switch, Select, Separator, Progress |

La page `design-system` de ce projet contient un aperçu en direct de chaque composant et des 5 écrans. Le bundle de ces aperçus reproduit l'API shadcn (props et `data-slot`) mais ne remplace pas `components/ui`.
