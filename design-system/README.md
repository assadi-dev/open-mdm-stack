# Open MDM — charte « Flame & Sand »

> Exporté le 26 sept. 2026 depuis le Design System [Open MDM — Flame & Sand](https://claude.ai/artifact/Qwu94fQ815E8WKhs7LcPpp) (source : `maquette.pen`, frame « Palette — Open MDM »). Ce dossier est la source de vérité côté dépôt ; l'artifact reste la référence visuelle (26 composants avec aperçu vivant, 3 graphes, 5 écrans) mais n'est accessible que depuis les outils Artifact/pencil de la session desktop, pas depuis Claude Code. `shadcn.md` détaille l'installation, `tokens.json` porte les valeurs.

Open MDM administre une flotte Android souveraine, sans services Google. L'interface est un dashboard lumineux, chaud et calme : l'orange ne signale que l'action ou l'élément actif, tout le reste est du verre posé sur une brume sable. Le code est bâti sur **shadcn/ui** : chaque composant de ce système porte le nom et l'API du composant shadcn correspondant, et aucun composant n'est inventé. La section *Intégration shadcn/ui* donne le `globals.css` et les ajustements, composant par composant.

## Principes

- **Le fond est toujours l'ambiance.** Peignez `html` avec `gradient-ambient` (brume grise → sable → crème), fixé au viewport. Aucune page, aucune carte n'est posée sur un aplat.
- **Les surfaces sont du verre.** Une Card, la Sidebar ou l'en-tête de page : `card` (blanc 28 %) avec un contour `card-border` de 1px. Pour les champs, l'en-tête de Table, les pills et le bouton `secondary` : `card-strong` (blanc 55 %). Trois exceptions opaques seulement : `popover` (menus et listes de Select), `background` dans `AlertDialogContent`, et le fond blanc `sand-0` du QR code (les lecteurs en ont besoin).
- **Un seul accent.** `primary` (Golden Flame #E27100) marque le lien de navigation actif, le CTA principal et les contrôles cochés. Un seul `Button variant="default"` par vue.
- **Aucune ombre.** La profondeur vient de la translucidité et des contours. On retire `shadow-xs`, `shadow-sm` et `shadow-md` des composants shadcn.
- **Jamais la couleur seule pour un statut.** Toujours une icône lucide ou une pastille, plus un libellé.

## Contenu et ton

- Tout est en français. Les actions sont à l'infinitif : « Enrôler un appareil », « Verrouiller », « Publier la v8 ». Casse de phrase partout (pas de Majuscules De Titre), pas d'emoji, pas de point d'exclamation.
- Un appareil se nomme `Modèle · #4 derniers caractères` : **Pixel 8 · #A12F**. Le numéro de série va dessous, en `meta` : « N° 3A1B-7K2P ».
- Les nombres suivent le format français, avec une espace fine insécable (U+202F) : `1 248`, `3,2 %`, `52 / 128 Go`. Dans les tables et les KPI, chiffres tabulaires (`tabular-nums`).
- Les temps sont relatifs dans les listes (« il y a 3 min », « hier à 18:04 »). Ailleurs, date longue : « 25 sept. 2026 à 14:32 ».
- Le vocabulaire des statuts est fixe : **Conforme**, **En ligne** (success) · **En attente**, **Enrôlement** (warning) · **Non conforme**, **Hors ligne**, **Échec** (danger) · **Commande en cours**, **En cours** (info).
- Une confirmation destructive nomme l'objet, dit la conséquence et le mot « irréversible » : « Effacer Pixel 8 · #A12F ? L'appareil revient aux paramètres d'usine au prochain check-in… Cette action est irréversible. »

## Couleur

| Rôle | Token | Règle |
|---|---|---|
| Texte courant, titres, valeurs | `foreground` | 12,8:1 sur `card` au pire cas |
| Texte secondaire, libellés | `muted-foreground` | Jamais sur un fond `*-soft` : passer à `foreground` |
| Placeholder, graduations d'axe | `subtle-foreground` | Décoratif seulement (2,7:1) |
| Accent, élément actif | `primary` | Texte blanc dessus seulement en ≥ 15px semi-bold |
| Texte ou lien orange | `primary-text` | Jamais `primary` en texte (2,4:1) |
| Fond teinté orange | `primary-soft` | Badge `default`, survol des items de menu |
| Bouton sombre, onglet actif, tooltip, pill de valeur | `ink` / `ink-foreground` | `Button variant="ink"` |
| Séparateurs | `border` · `border-strong` | Encre 8 % et 14 % |
| Erreur, action destructive | `destructive` (= `danger-text`) | Blanc dessus 7,2:1 |

**Statuts.** Chacun vient en trois tons : la base (`success`, `warning`, `danger`, `info`) pour la pastille, `-soft` pour le fond, `-text` pour le libellé et l'icône. Les icônes sont fixes : `circle-check` · `hourglass` · `circle-alert` · `info`. Le vert est réservé à « Conforme » et « En ligne ».

**Les primitives** Flame 50→900 et Sand 0→950 ne s'utilisent pas directement dans les écrans. On passe par les alias sémantiques. Une couleur qui manque se dérive de ces deux échelles, jamais d'ailleurs.

## Les quatre dégradés, et rien d'autre

1. **Ambiance** (`gradient-ambient`, 180°) : fond de l'app shell uniquement, jamais dans une carte.
2. **Flux** (`gradient-flow`, 90°, `flow-orange` → `flow-sage` → `flow-sky`) : graphes temporels seulement. Le cœur est opaque, les deux halos sont à 45 % et 20 % d'opacité.
3. **Flamme** (`gradient-flame`, 90°, `flame-500` → `flame-400` → `flame-200`) : indicateurs de Progress et segments actifs des jauges (batterie, stockage, conformité, déploiement). Les segments inactifs sont en `chart-track`.
4. **Verre** : la paire `card` + `card-border` posée sur l'ambiance. Ce n'est pas un dégradé CSS.

## Data viz

- L'ordre catégoriel est fixe : `chart-1` orange, `chart-2` bleu, `chart-3` sarcelle, `chart-4` prune. Au-delà de quatre séries, le reste est agrégé dans « Autres » en `chart-5` (= `chart-other`). On ne fait jamais tourner les couleurs, et le vert n'entre jamais dans un graphe.
- Pour une magnitude (une seule teinte) : `seq-1` → `seq-4`, du plus clair au plus foncé.
- La valeur s'écrit toujours en clair : au centre du donut (`metric-sm` plus une légende), sous la jauge, en pill sur le graphe de flux, et chaque légende porte son pourcentage.
- Trois recettes, toutes des compositions du composant shadcn `Chart` (Recharts) : **ChartPieDonutText**, **ChartAreaFlow** et **ChartPieGauge**. Le code est dans la section *Intégration shadcn/ui*.

## Typographie

Une seule famille : **Inter**, en 400, 500 et 600 uniquement (600 pour les titres, les valeurs et les CTA). À partir de 22px, l'interlettrage se resserre : de −0,3 px à −1,2 px.

- Titre de page (h1 de l'en-tête) : `page-title` 26/32.
- Valeur de KPI : `metric` 32/38, −0,8 px. Centre d'un donut : `metric-sm` 24/30.
- Titre de grande Card : `section-title` 22/28. CardTitle ordinaire : `card-title` 18/24.
- Nav : `nav` 15/20, 500 (600 quand actif). Bouton : `button` 15/20, 600.
- Texte de table et de champ : `body` 14/20. Nom d'appareil, onglet, ItemTitle : `body-medium`.
- Libellé de KPI et FieldLabel : `label` 13/18, 500. Description : `caption` 13/18.
- TableHead : `table-head` 12/16, 500, en `muted-foreground`. Badge : `badge` 12/16, 600. Aide : `meta` 12/18.
- Compteur du SidebarMenuBadge : `micro` 11/14, 600. Surtitre : `eyebrow` 12/16, 600, +1,4 px, en capitales, en `primary-text`.

## Espacement, rayons, mise en page

- Base de 4px, celle de Tailwind (`--spacing`). Hauteurs des contrôles : Button 44px (`px-4.5`, icône 18), Input, Select et recherche 46px (`py-3.25 px-4`), lien de nav 44px (`px-3.5`, icône 20, `gap-3`).
- Card : `p-6` et `gap-6` (carte KPI : `py-5 gap-4`). Grille de cartes : `gap-5`. Marge de page : `p-6`.
- Rayons : `rounded-md` 14 pour les contrôles, `rounded-lg` 16 pour tables, alertes et TabsList, `rounded-xl` 20 pour les Card, `rounded-2xl` 22 pour la Sidebar, l'en-tête de page et l'AlertDialog, `rounded-3xl` 28 pour les grandes sections, `rounded-full` pour pills, Badge, Switch et boutons icône ronds. `rounded-sm` vaut 10 (valeur proposée) pour les items de menu et l'ItemMedia. La Checkbox garde les 4px de shadcn.
- **App shell** : `SidebarProvider` › `Sidebar variant="floating"` de 280px › `SidebarInset` en `p-6 gap-5`. L'en-tête de page est une barre de verre `rounded-2xl`. Elle contient un Breadcrumb éventuel, le h1 en `page-title` et un sous-titre, puis à droite l'InputGroup de recherche (320px), un bouton icône cloche (`secondary`, pastille `danger`) et le compte (Avatar dans un bouton `secondary` arrondi).

## États

- Survol : `default` et `ink` passent à /90, `secondary` à /80, `ghost` et `outline` prennent `accent`. Un item de menu prend `primary-soft`. Une ligne de Table prend `muted/50`, une ligne sélectionnée `muted`.
- Focus : l'anneau shadcn, 3px en `ring/50`. Désactivé : opacité 0,5.
- Champ invalide : bordure `destructive`, et `FieldError` avec l'icône `circle-alert`. Le libellé passe en `destructive`.

## Accessibilité

Tout est mesuré sur le **pire cas** : une `card` posée en haut de l'ambiance (≈ #DFDFDF).

- Textes : `foreground` 12,8:1 · `muted-foreground` 4,6:1 · `primary-text` 4,6:1 · `danger-text` 5,4:1 · `info-text` 4,9:1 · `warning-text` 5,0:1.
- Badges : `-text` sur `-soft` entre 4,5 et 4,8:1, **sauf `success` à 4,4:1** tout en haut de l'ambiance (4,8:1 dès que la carte descend). À surveiller.
- **Blanc sur `primary` : 3,2:1**, décision actée (≥ 15px semi-bold). C'est pour ça que le Badge `default` passe en `primary-soft` / `primary-text` (5,1:1) : du 12px blanc sur orange ne passerait pas.
- **Compteur blanc sur `danger`** (SidebarMenuBadge, 11px) : 3,9:1. On garde le rouge de la référence et le nombre est aussi annoncé par `aria-label`.
- **Anneau de focus `ring` (flame-400)** : 1,85:1, sous le minimum WCAG de 3:1. Voir *Propositions*.
- Contrôles : le contour des Checkbox et la piste éteinte des Switch utilisent `muted-foreground` (4,6:1), parce que `input` (verre, 1,1:1) serait invisible.
- `chart-2` et `chart-3` font 2,4 à 2,5:1 contre la carte. C'est compensé par la légende chiffrée et les espaces entre segments.

## Iconographie

- **lucide** (`lucide-react`, l'`iconLibrary` par défaut de shadcn), trait de 2px, toujours en `currentColor`.
- Tailles : 20 pour la nav et la recherche, 18 pour les boutons, 16 pour les menus, onglets et items, 14 pour les badges et les en-têtes de table.
- Icônes métier : `layout-dashboard` tableau de bord · `smartphone` appareils · `shield-check` politiques · `qr-code` enrôlement · `package` applications · `send` commandes · `layers` groupes · `scroll-text` journal · `lock`, `rotate-ccw`, `map-pin`, `trash-2` pour les commandes à distance.
- Aucun emoji. **Pas de logo fourni** : la marque s'écrit « Open MDM » en texte, style `section-title`. Aucun symbole n'a été dessiné à sa place.

## Propositions dérivées

Tout ce qui s'écarte du brief est dérivé des échelles Flame et Sand, et justifié :

- `popover` = `sand-50` (opaque) : un menu posé au-dessus des données doit rester lisible.
- `destructive` = `danger-text` : shadcn l'utilise en fond de bouton avec du texte blanc, et en texte d'erreur. `danger` tomberait à 3,9:1 et 2,9:1.
- `radius-sm` = 10px : rayon concentrique des items dans un popover (14 − 4 de padding).
- Trois ajouts de variantes, pas de composants : `Button variant="ink"`, `Badge variant="success | warning | danger | info"` et `Alert variant="success | warning | info"`.
- **Non appliqué, à décider** : un anneau de focus plein en `flame-600` (3,2:1 au pire cas) à la place de `ring/50`.
- **Hors périmètre** : le mode sombre (V2).
