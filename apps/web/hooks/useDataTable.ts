import { useMemo, useState } from "react";
import {
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { dataTableFeatures, type DataTableColumnDef } from "@/components/data-table/data-table-features";
import { createSelectionColumn } from "@/components/data-table/selection-column";

// Mode serveur : l'état vient de l'URL (`useDataTableSearchParams().table`) et `data` n'est que la page courante,
// déjà triée, filtrée et paginée par l'API. `rowCount` est le total de lignes côté API.
export type DataTableServerOptions = {
  rowCount: number;
  state: {
    pagination: PaginationState;
    sorting: SortingState;
    globalFilter: string;
    columnFilters: ColumnFiltersState;
  };
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  onGlobalFilterChange: OnChangeFn<string>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
};

type UseDataTableOptions<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  // `pageSize` et `initialSorting` ne servent qu'en mode client : en mode serveur, ils viennent de `server.state`.
  pageSize?: number;
  enableSelection?: boolean;
  initialSorting?: SortingState;
  getRowId?: (row: TData, index: number) => string;
  server?: DataTableServerOptions;
};

const NO_FILTERS: ColumnFiltersState = [];

// Un filtre à choix multiple compte une unité par valeur cochée (WPA2 + WPA3 = 2).
const countFilterValues = (value: unknown) => (Array.isArray(value) ? value.length : 1);

export const useDataTable = <TData extends RowData>({
  data,
  columns,
  pageSize = 10,
  enableSelection = false,
  initialSorting = [],
  getRowId,
  server,
}: UseDataTableOptions<TData>) => {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});

  const tableColumns = useMemo(
    () => (enableSelection ? [createSelectionColumn<TData>(), ...columns] : columns),
    [enableSelection, columns],
  );

  // En mode serveur, chaque changement charge d'autres lignes : la sélection précédente ne désigne plus rien d'affiché.
  const clearingSelection =
    <TState>(onChange: OnChangeFn<TState>): OnChangeFn<TState> =>
    (updater) => {
      setRowSelection({});
      onChange(updater);
    };

  const stateOptions = server
    ? {
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        rowCount: server.rowCount,
        state: { ...server.state, rowSelection, columnVisibility },
        onPaginationChange: clearingSelection(server.onPaginationChange),
        onSortingChange: clearingSelection(server.onSortingChange),
        onGlobalFilterChange: clearingSelection(server.onGlobalFilterChange),
        onColumnFiltersChange: clearingSelection(server.onColumnFiltersChange),
      }
    : {
        state: { sorting, pagination, globalFilter: search, rowSelection, columnVisibility },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setSearch,
      };

  const table = useTable({
    features: dataTableFeatures,
    columns: tableColumns,
    data,
    getRowId,
    enableRowSelection: enableSelection,
    globalFilterFn: "includesString",
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    ...stateOptions,
  });

  const { state } = stateOptions;
  // Les filtres de colonne n'existent qu'en mode serveur : leur état vient de l'URL.
  const columnFilters = server?.state.columnFilters ?? NO_FILTERS;
  // Seules les lignes visibles comptent : une action groupée ne doit jamais toucher une ligne masquée par la recherche.
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return {
    table,
    search: state.globalFilter,
    setSearch: (value: string) => table.setGlobalFilter(value),
    sorting: state.sorting,
    pagination: {
      pageIndex: state.pagination.pageIndex,
      pageSize: state.pagination.pageSize,
      pageCount: table.getPageCount(),
      // Côté client, les lignes après recherche ; côté serveur, le total renvoyé par l'API.
      totalRows: table.getRowCount(),
      canPrevious: table.getCanPreviousPage(),
      canNext: table.getCanNextPage(),
      previous: () => table.previousPage(),
      next: () => table.nextPage(),
      goTo: (pageIndex: number) => table.setPageIndex(pageIndex),
      setPageSize: (size: number) => table.setPageSize(size),
    },
    filters: {
      activeCount: columnFilters.reduce((count, filter) => count + countFilterValues(filter.value), 0),
      // Le type de la valeur est celui du parser nuqs déclaré par la page pour cette colonne.
      getValue: <TValue>(columnId: string) =>
        columnFilters.find((filter) => filter.id === columnId)?.value as TValue | undefined,
      // Une valeur vide retire le filtre : l'URL ne garde pas de paramètre vide.
      setValue: (columnId: string, value: unknown[]) =>
        table.getColumn(columnId)?.setFilterValue(value.length > 0 ? value : undefined),
      reset: () => table.resetColumnFilters(true),
    },
    columnVisibility: {
      // Les colonnes que l'utilisateur peut masquer : celles de données, pas la sélection ni les actions (`enableHiding: false`).
      columns: table
        .getAllLeafColumns()
        .filter((column) => column.getCanHide())
        .map((column) => ({
          id: column.id,
          label: typeof column.columnDef.header === "string" ? column.columnDef.header : column.id,
          isVisible: column.getIsVisible(),
          toggle: (visible: boolean) => column.toggleVisibility(visible),
        })),
    },
    selection: {
      enabled: enableSelection,
      selectedRows,
      selectedCount: selectedRows.length,
      clear: () => table.resetRowSelection(),
    },
  };
};

export type DataTableController<TData extends RowData> = ReturnType<typeof useDataTable<TData>>;
