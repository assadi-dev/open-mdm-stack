# Design — instructions pour agents IA

Lis ce fichier avant toute tâche UI dans `apps/web`. Il condense `design-system/` en règles actionnables. Détails complets : [`design-system/README.md`](design-system/README.md) (charte), [`design-system/shadcn.md`](design-system/shadcn.md) (installation, `globals.css`, ajustements par composant, recettes de graphes), [`design-system/tokens.json`](design-system/tokens.json) (valeurs sources). Référence visuelle (26 composants + 5 écrans) : [artifact Open MDM — Flame & Sand](https://claude.ai/artifact/Qwu94fQ815E8WKhs7LcPpp) — lisible dans un navigateur, pas depuis Claude Code.

Stack : Next.js 16, React 19, Tailwind v4, **shadcn/ui**.

## Règles dures — ne jamais enfreindre

1. **Aucun composant inventé.** Un besoin d'UI = un composant shadcn/ui ou une composition de composants shadcn/ui listés ci-dessous. Pas de composant maison. Un besoin non couvert → dire lequel manque, ne pas improviser.
2. **Le fond est toujours le dégradé d'ambiance**, jamais un aplat : `background-color: var(--background); background-image: var(--gradient-ambient); background-attachment: fixed;` sur `html`. Aucune page, aucune Card sur un aplat.
3. **Les surfaces sont du verre** (`card` / `card-strong`), jamais opaques — sauf `popover` (menus, listes de Select), `AlertDialogContent`, et le fond du QR code.
4. **Aucune ombre.** Retirer `shadow-*` de tous les composants shadcn.
5. **Un seul `Button variant="default"` (orange) par vue.** Les autres actions : `ink`, `secondary`, `outline`, `ghost`, `destructive` (voir tableau plus bas).
6. **Jamais la couleur seule pour un statut.** Toujours icône lucide ou pastille + libellé texte.
7. **Une seule police : Inter**, poids 400/500/600 uniquement.
8. Tout le contenu UI est **en français**, verbes à l'infinitif, casse de phrase (pas de Title Case), pas d'emoji, pas de point d'exclamation.

## Tokens — les seuls noms à utiliser dans le JSX/Tailwind

Ne jamais écrire une couleur en dur ni utiliser une primitive `flame-*`/`sand-*` directement dans un écran : toujours l'alias sémantique.

| Rôle | Token (`bg-`/`text-`/`border-`) | Note |
|---|---|---|
| Texte courant | `foreground` | 12,8:1 sur `card` |
| Texte secondaire | `muted-foreground` | jamais sur un fond `*-soft` |
| Placeholder/déco | `subtle-foreground` | décoratif seulement |
| Accent / actif | `primary` | texte blanc dessus ≥ 15px semi-bold seulement |
| Lien / texte orange | `primary-text` | jamais `primary` en texte |
| Fond teinté orange | `primary-soft` | Badge `default` |
| Bouton sombre, onglet actif, tooltip | `ink` / `ink-foreground` | `Button variant="ink"` |
| Verre standard | `card` / `card-border` | Card, Sidebar, en-tête de page |
| Verre dense | `card-strong` | champs, en-tête de Table, pills |
| Séparateurs | `border` · `border-strong` | encre 8 % / 14 % |
| Erreur, action destructive | `destructive` (= `danger-text`) | blanc dessus 7,2:1 |
| Statuts | `success` / `warning` / `danger` / `info` (+ `-soft`, `-text`) | toujours avec icône : `circle-check` / `hourglass` / `circle-alert` / `info` |
| Graphiques catégoriels | `chart-1` → `chart-4`, reste → `chart-5` | ordre fixe, jamais cyclé, jamais de vert |
| Graphiques séquentiels | `seq-1` → `seq-4` | une seule teinte, clair → foncé |

`popover` (menus) est la seule surface de texte opaque en dehors de l'AlertDialog et du QR code.

## Les 4 dégradés — rien d'autre

| Nom | CSS | Usage exclusif |
|---|---|---|
| `--gradient-ambient` | `linear-gradient(180deg, #D3D3D3 0%, #E6DFD2 50%, #FEEED2 100%)` | fond `html` uniquement |
| `--gradient-flow` | `linear-gradient(90deg, flow-orange → flow-sage → flow-sky)` | `ChartAreaFlow` seulement, cœur 100 %, halos 45 %/20 % |
| `--gradient-flame` | `linear-gradient(90deg, flame-500 → flame-400 → flame-200)` | indicateur `Progress` et jauges seulement |
| verre | `card` + `card-border` | pas un `gradient`, juste la paire de tokens |

## Typographie (classes Tailwind arbitraires, toutes en Inter)

| Style | Taille/interligne | Poids | Usage |
|---|---|---|---|
| `page-title` | `text-[26px] leading-[32px]` | 600 | h1 de l'en-tête de page |
| `metric` | `text-[32px] leading-[38px] tracking-[-0.8px] tabular-nums` | 600 | valeur de KPI |
| `metric-sm` | `text-[24px] leading-[30px] tabular-nums` | 600 | centre d'un donut/jauge |
| `section-title` | `text-[22px] leading-[28px] tracking-[-0.4px]` | 600 | titre de grande Card |
| `card-title` | `text-lg tracking-[-0.3px]` | 600 | `CardTitle` ordinaire |
| `nav` | `text-[15px]` | 500 (600 si actif) | `SidebarMenuButton` |
| `button` | `text-[15px]` | 600 | libellé de `Button` |
| `body` / `body-medium` | `text-sm` | 400 / 500 | table, champs / nom d'appareil, onglet |
| `label` | `text-[13px]` | 500 | libellé de KPI, `FieldLabel` |
| `caption` | `text-[13px]` | 400 | description, aide |
| `table-head` | `text-xs` | 500, `text-muted-foreground` | `TableHead` |
| `badge` | `text-xs` | 600 | `Badge` |
| `eyebrow` | `text-xs tracking-[1.4px] uppercase` | 600, `text-primary-text` | surtitre |

## Espacement & rayons

Base 4px (`--spacing` Tailwind). Contrôles : Button 44px, Input/Select/recherche 46px, lien de nav 44px. Card : `p-6 gap-6` (KPI : `py-5 gap-4`), grille de cartes `gap-5`.

| Rayon | Valeur | Usage |
|---|---|---|
| `rounded-md` | 14 | Button, Input, Select, SidebarMenuButton, TabsTrigger |
| `rounded-lg` | 16 | Table, Alert, TabsList |
| `rounded-xl` | 20 | Card |
| `rounded-2xl` | 22 | Sidebar, en-tête de page, AlertDialog |
| `rounded-3xl` | 28 | grandes sections |
| `rounded-full` | — | Badge, Switch, pills, boutons icône ronds |
| `rounded-sm` | 10 | items de menu/Select, `ItemMedia` |

## App shell (obligatoire sur tout écran)

`SidebarProvider` › `Sidebar variant="floating"` (280px) › `SidebarInset` (`p-6 gap-5`). En-tête de page = barre de verre `rounded-2xl` : `Breadcrumb` optionnel, h1 `page-title` + sous-titre, puis à droite `InputGroup` de recherche (320px), bouton cloche (`secondary`, pastille `danger`), compte (`Avatar` + nom + rôle dans un `Button secondary rounded-full`).

## Composants shadcn/ui disponibles (aucun autre)

Button, Badge, Card, Input, InputGroup, Field, Label, Select, Checkbox, Switch, Tabs, Table, Sidebar, Breadcrumb, Pagination, Item, Avatar, Progress, Separator, Tooltip, Alert, DropdownMenu, AlertDialog, Chart (Recharts).

**3 variantes ajoutées, rien d'autre :** `Button variant="ink"` · `Badge variant="success|warning|danger|info"` · `Alert variant="success|warning|info"`.

**3 graphes = compositions de `Chart`**, code exact dans `design-system/shadcn.md` §4 : `ChartPieDonutText` (donut, trou 70 %), `ChartAreaFlow` (aires en plage, dégradé flux), `ChartPieGauge` (demi-cercle 18 segments, dégradé flamme).

Ajustements de classes par composant (bordures, tailles, variantes de couleur) : `design-system/shadcn.md` §3 — à appliquer avant d'utiliser un composant, pas après.

## Icônes

`lucide-react` uniquement, trait 2px, `currentColor`. Tailles : 20 nav/recherche, 18 boutons, 16 menus/onglets/items, 14 badges/en-têtes de table. Statuts fixes : `circle-check` `hourglass` `circle-alert` `info`. Pas de logo (texte « Open MDM » en `section-title`), pas d'emoji.

## Contenu

- Appareil : `Modèle · #4 derniers caractères` (ex. `Pixel 8 · #A12F`), n° de série en dessous en `caption`.
- Nombres au format français, espace fine insécable : `1 248`, `3,2 %`. `tabular-nums` en table/KPI.
- Temps relatifs en liste (« il y a 3 min »), date longue ailleurs (« 25 sept. 2026 à 14:32 »).
- Statuts, vocabulaire fixe : **Conforme / En ligne** (success) · **En attente / Enrôlement** (warning) · **Non conforme / Hors ligne / Échec** (danger) · **Commande en cours / En cours** (info).
- Confirmation destructive (`AlertDialog`) : nomme l'objet, dit la conséquence, contient le mot « irréversible ».

## Accessibilité — vérifier avant de livrer

Toujours mesurer sur le **pire cas** : une `card` posée en haut du dégradé (≈ `#DFDFDF`), pas sur un fond neutre.

- `foreground` 12,8:1 · `muted-foreground` 4,6:1 · les `-text` de statut sur leur `-soft` : 4,4–4,8:1.
- Blanc sur `primary` : 3,2:1, acté — seulement en texte ≥ 15px semi-bold. Ne jamais mettre du texte blanc plus petit sur `primary` (d'où `Badge default` en `primary-soft`/`primary-text`, pas blanc-sur-orange).
- Contour Checkbox et piste Switch éteinte : `muted-foreground`, jamais `input` (invisible en verre).
- Connu et non résolu, ne pas « corriger » sans le demander : anneau de focus `ring` à 1,85:1 (sous 3:1), compteur blanc sur `danger` de la Sidebar à 3,9:1.

## Avant de construire un écran

1. Relire la correspondance Écran → composants dans `design-system/shadcn.md` §5 (Tableau de bord, Appareils, Détail appareil, Enrôlement, Politiques) — c'est l'inventaire, ne pas en sortir.
2. Vérifier que `apps/web/app/globals.css` contient bien les tokens de `design-system/shadcn.md` §2 avant d'écrire le JSX.
3. Composer uniquement avec les composants shadcn listés plus haut, thémés par les tokens ci-dessus.
4. Repasser la checklist accessibilité avant de considérer l'écran fini.
