import { useMemo } from "react";
import {
  functionalUpdate,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { createSerializer, parseAsInteger, parseAsString, useQueryStates, type ParserMap } from "nuqs";
import { parseAsSorting, serializeSorting } from "@/components/data-table/data-table-search-params";
import { useDebouncedValue } from "./useDebouncedValue";

const FIRST_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const NO_SORTING: SortingState = [];
const NO_FILTERS = {};

type UseDataTableSearchParamsOptions<TFilters extends ParserMap> = {
  pageSize?: number;
  defaultSorting?: SortingState;
  // Un parser nuqs par colonne filtrable, nommé comme l'id de la colonne et le paramètre de l'API.
  // Ex. `{ security: parseAsArrayOf(parseAsStringLiteral(WIFI_SECURITY_KEYS)) }` → `security=WPA2,WPA3`.
  filters?: TFilters;
};

const isEmptyFilter = (value: unknown) => value === null || (Array.isArray(value) && value.length === 0);

// L'état du tableau vit dans l'URL, au format de l'API (`?page=2&limit=8&search=office&sort=-createdAt&security=WPA2`) :
// un lien partagé ou le bouton retour rouvrent le tableau tel quel.
export const useDataTableSearchParams = <TFilters extends ParserMap = typeof NO_FILTERS>({
  pageSize = DEFAULT_PAGE_SIZE,
  defaultSorting = NO_SORTING,
  filters = NO_FILTERS as TFilters,
}: UseDataTableSearchParamsOptions<TFilters> = {}) => {
  const tableParsers = useMemo(
    () => ({
      page: parseAsInteger.withDefault(FIRST_PAGE),
      limit: parseAsInteger.withDefault(pageSize),
      search: parseAsString.withDefault(""),
      sort: parseAsSorting.withDefault(defaultSorting),
    }),
    [pageSize, defaultSorting],
  );
  const [{ page, limit, search, sort }, setTableParams] = useQueryStates(tableParsers);
  const [filterValues, setFilterValues] = useQueryStates(filters);

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: Math.max(page, FIRST_PAGE) - 1, pageSize: limit }),
    [page, limit],
  );
  const columnFilters = useMemo<ColumnFiltersState>(
    () => Object.entries(filterValues).flatMap(([id, value]) => (isEmptyFilter(value) ? [] : [{ id, value }])),
    [filterValues],
  );

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = functionalUpdate(updater, pagination);
    setTableParams({ page: next.pageIndex + 1, limit: next.pageSize });
  };

  // Changer le tri, la recherche ou un filtre ramène à la première page : la page courante n'existe peut-être plus.
  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = functionalUpdate(updater, sort);
    setTableParams({ sort: next.length > 0 ? next : null, page: null });
  };

  const onGlobalFilterChange: OnChangeFn<string> = (updater) => {
    setTableParams({ search: functionalUpdate(updater, search) || null, page: null });
  };

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = functionalUpdate(updater, columnFilters);
    const values = Object.keys(filters).map((id) => [id, next.find((filter) => filter.id === id)?.value ?? null]);
    // nuqs regroupe les deux mises à jour en une seule écriture de l'URL.
    setFilterValues(Object.fromEntries(values));
    setTableParams({ page: null });
  };

  // La recherche part vers l'API après une pause de frappe ; la page, le tri et les filtres partent tout de suite.
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const serializeFilters = useMemo(() => createSerializer<ParserMap>(filters), [filters]);
  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pagination.pageIndex + 1),
      limit: String(pagination.pageSize),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort.length > 0) params.set("sort", serializeSorting(sort));
    new URLSearchParams(serializeFilters(filterValues)).forEach((value, key) => params.set(key, value));
    return params.toString();
  }, [pagination, debouncedSearch, sort, serializeFilters, filterValues]);

  return {
    // État contrôlé de `useDataTable({ server })`.
    table: {
      state: { pagination, sorting: sort, globalFilter: search, columnFilters },
      onPaginationChange,
      onSortingChange,
      onGlobalFilterChange,
      onColumnFiltersChange,
    },
    // Query string de l'API (`page=1&limit=8&sort=-createdAt`) : clé et paramètre de la requête TanStack Query.
    query,
  };
};

export type DataTableSearchParams = ReturnType<typeof useDataTableSearchParams>;
