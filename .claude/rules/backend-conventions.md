---
paths:
  - "apps/api/**"
---

# Conventions de code backend (`apps/api`)

Stack : Express 5, Drizzle ORM (PostgreSQL), Zod 4, Vitest + supertest. Chaque ressource vit dans `src/features/<ressource>/` : `route.ts`, `controller.ts`, `validator.ts`, `service.ts`, `repository.ts`, `dto/schema.ts`, `factory/repositories.ts`, `tests/`.

## 1. Collections paginées

Toute liste destinée à un tableau du dashboard est une **collection paginée** : un seul endpoint `GET /<ressource>` qui pagine, trie, cherche et filtre en SQL. On ne renvoie jamais une table entière pour la paginer côté client.

Le code générique est dans `src/features/paginations/` : on ne le réécrit pas pour une ressource, on le configure.

### Contrat

```
GET /wifi-networks?page=2&limit=20&search=office&sort=-createdAt,ssid&security=WPA2,WPA3
```

| Paramètre | Format | Défaut | Côté SQL |
|---|---|---|---|
| `page` | entier ≥ 1 | 1 | `offset((page - 1) * limit)` |
| `limit` | entier de 1 à 100 (`MAX_LIMIT`) | 20 | `limit(limit)` |
| `search` | texte, 100 caractères max, vide = absent | — | `ILIKE '%…%'` en OR sur les colonnes cherchables, `%` et `_` échappés |
| `sort` | colonnes séparées par des virgules, `-` devant = décroissant | tri par défaut de la ressource | `orderBy`, puis la colonne de départage |
| `<filtre>` | valeurs séparées par des virgules | — | opérateur choisi par la ressource (`inArray`…) |

- **Le client n'envoie jamais d'opérateur** (`eq`, `in`, `ilike`…) : chaque ressource déclare ses colonnes triables, cherchables et filtrables, et le serveur choisit l'opérateur SQL.
- Les noms de `sort` et des filtres sont les noms de champs de l'API, identiques aux id des colonnes TanStack côté front.
- Une clé répétée (`security=WPA2&security=WPA3`) vaut la liste avec virgules. Une clé inconnue est ignorée.
- Une colonne de tri absente de la liste blanche, une valeur de filtre invalide, `limit` > 100 ou `page` < 1 répondent **400** (la `ZodError` passe par `errorHandler`).
- La virgule sépare toujours les valeurs d'un filtre : pas de filtre texte libre dont la valeur pourrait en contenir une (c'est le rôle de `search`).

Réponse, construite par `buildPaginatedData` :

```json
{ "data": [/* la page de lignes */], "metadata": { "page": 2, "limit": 20, "total": 41, "totalPages": 3 } }
```

`total` est le nombre de lignes **après** recherche et filtres.

### Mettre une ressource en collection paginée

1. **DTO** (`dto/schema.ts`) : décrire la query avec `createCollectionQuerySchema`. `sortable` liste les champs triables. Chaque filtre donne le schéma **d'une** valeur ; il doit accepter une string, puisqu'il vient de la query string (`z.enum(...)`, `z.uuid()`, `z.coerce.number<string>()`).

```ts
// GET /wifi-networks?page=1&limit=20&search=office&sort=-createdAt,ssid&security=WPA2,WPA3
export const wifiNetworkCollectionQuerySchema = createCollectionQuerySchema({
    sortable: ["name", "ssid", "security", "createdAt"],
    filters: { security: z.enum(wifiSecurityType) },
});

export type WifiNetworkCollectionQuery = z.infer<typeof wifiNetworkCollectionQuerySchema>;

export const wifiNetworkDecoder = {
    // ...
    collection: (data: unknown) => wifiNetworkCollectionQuerySchema.safeParse(data),
};
```

La query parsée a toujours la forme `{ page, limit, search?, sort: [{ id, desc }], filters: { <filtre>?: valeur[] } }`. Un filtre vide (`security=`) est absent.

2. **Validator** (`validator.ts`) : `validate<Ressource>CollectionQuery(query: unknown)`, sur le modèle des autres validateurs (lève l'erreur Zod).

3. **Controller** : la méthode `collections` lit `req.query`, jamais `req.body`.

```ts
// GET /wifi-networks?page&limit&search&sort&security  (admin)
collections = async (req: Request, res: Response) => {
    const query = validateWifiNetworkCollectionQuery(req.query);
    const result = await this.wifiNetworkService.collection(query);
    return res.json(result);
};
```

4. **Factory** (`factory/repositories.ts`) : `toCollectionConfig(table)` déclare, une seule fois, comment la table répond à la query. Le type `CollectionConfig<Query>` oblige à déclarer une colonne pour chaque champ de `sortable` et une condition pour chaque filtre : le DTO et la factory ne peuvent pas diverger.

```ts
toCollectionConfig: (table: typeof wifiNetworks): CollectionConfig<WifiNetworkCollectionQuery> => {
    return {
        sortable: { name: table.name, ssid: table.ssid, security: table.security, createdAt: table.createdAt },
        defaultSort: [{ id: "createdAt", desc: true }],
        tieBreaker: table.id,
        searchable: [table.ssid, table.name],
        filters: { security: (values) => inArray(table.security, values) },
    }
},
```

- `defaultSort` : l'ordre quand le client n'envoie pas `sort`.
- `tieBreaker` : une colonne **unique** (l'`id`), triée en dernier. Sans elle, deux lignes égales sur le tri peuvent changer de page d'une requête à l'autre.
- `searchable` : des colonnes **texte** uniquement. Postgres n'a pas d'`ILIKE` sur un enum.
- `toSelectCollection(table)` liste les colonnes renvoyées : jamais de `select()` sans argument, pour ne pas exposer un champ sensible (mot de passe chiffré…).

5. **Repository** : `toCollectionClauses` traduit la query, les lignes et le total partagent le même `where`.

```ts
async collection(collectionQuery: WifiNetworkCollectionQuery) {
    const selection = wifiNetworkRepositoryFactory.toSelectCollection(wifiNetworks);
    const config = wifiNetworkRepositoryFactory.toCollectionConfig(wifiNetworks);
    const { where, orderBy, limit, offset } = toCollectionClauses(collectionQuery, config);

    const [data, total] = await Promise.all([
        this.db.select(selection).from(wifiNetworks).where(where).orderBy(...orderBy).limit(limit).offset(offset),
        this.db.$count(wifiNetworks, where),
    ]);
    return buildPaginatedData(data, { page: collectionQuery.page, limit, total });
}
```

6. **Route** : `router.get("/", requireAuth, controller.collections)`. La méthode HTTP `QUERY` (paramètres dans un body JSON) est prévue plus tard : tant que `collections` lit `req.query`, une route `QUERY` ignore son body.

7. **Tests** : le schéma et les clauses SQL génériques sont couverts dans `features/paginations/tests/`. Chaque ressource ajoute dans `tests/route.test.ts` au moins : 401 sans jeton, 400 sur une colonne de tri non autorisée, et la query parsée transmise au repository (`toHaveBeenCalledWith({ page, limit, search, sort, filters })`).

### À savoir

- Trier sur un enum Postgres suit l'ordre de déclaration de l'enum, pas l'ordre alphabétique.
- Une colonne nullable triée en ascendant met les `NULL` en fin de liste, en descendant en tête.
- Tri des textes : collation de la base (`en_US.utf8` en local), majuscules et minuscules mêlées.
