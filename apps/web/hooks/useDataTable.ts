import { useMemo, useState } from "react";
import { useTable, type PaginationState, type RowData, type RowSelectionState, type SortingState } from "@tanstack/react-table";
import { dataTableFeatures, type DataTableColumnDef } from "@/components/data-table/data-table-features";
import { createSelectionColumn } from "@/components/data-table/selection-column";

type UseDataTableOptions<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  pageSize?: number;
  enableSelection?: boolean;
  initialSorting?: SortingState;
  getRowId?: (row: TData, index: number) => string;
};

export const useDataTable = <TData extends RowData>({
  data,
  columns,
  pageSize = 10,
  enableSelection = false,
  initialSorting = [],
  getRowId,
}: UseDataTableOptions<TData>) => {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const tableColumns = useMemo(
    () => (enableSelection ? [createSelectionColumn<TData>(), ...columns] : columns),
    [enableSelection, columns],
  );

  const table = useTable({
    features: dataTableFeatures,
    columns: tableColumns,
    data,
    getRowId,
    enableRowSelection: enableSelection,
    globalFilterFn: "includesString",
    state: { sorting, pagination, globalFilter: search, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,
    onRowSelectionChange: setRowSelection,
  });

  // Seules les lignes visibles comptent : une action groupée ne doit jamais toucher une ligne masquée par la recherche.
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const totalRows = table.getFilteredRowModel().rows.length;

  return {
    table,
    search,
    setSearch,
    sorting,
    pagination: {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      pageCount: table.getPageCount(),
      totalRows,
      canPrevious: table.getCanPreviousPage(),
      canNext: table.getCanNextPage(),
      previous: () => table.previousPage(),
      next: () => table.nextPage(),
      goTo: (pageIndex: number) => table.setPageIndex(pageIndex),
      setPageSize: (size: number) => table.setPageSize(size),
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
