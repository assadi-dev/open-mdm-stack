"use client";

import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { SelectionActionBar } from "@/components/action-bars/SelectionActionBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tables/Table";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableController } from "@/hooks/useDataTable";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableSearch } from "./DataTableSearch";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

type DataTableProps<TData extends RowData> = {
  dataTable: DataTableController<TData>;
  emptyMessage?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  toolbarActions?: ReactNode;
  // Les actions de la barre de sélection, une par élément du tableau (des `ActionBarItem`), calculées à partir des lignes cochées.
  selectionActions?: (selectedRows: TData[]) => ReactNode[];
  className?: string;
};

export const DataTable = <TData extends RowData>({
  dataTable,
  emptyMessage = DATA_TABLE.empty,
  showSearch = true,
  showPagination = true,
  toolbarActions,
  selectionActions,
  className,
}: DataTableProps<TData>) => {
  const { table, selection } = dataTable;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex flex-col", className)}>
      {(showSearch || toolbarActions) && (
        <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
          {showSearch && <DataTableSearch dataTable={dataTable} className="w-65" />}
          {toolbarActions && <div className="ml-auto flex items-center gap-2">{toolbarActions}</div>}
        </div>
      )}
      {selection.enabled && (
        <SelectionActionBar
          selectedCount={selection.selectedCount}
          onClear={selection.clear}
          actions={selectionActions?.(selection.selectedRows)}
          labels={DATA_TABLE.selection}
        />
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const SortIcon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

                return (
                  <TableHead
                    key={header.id}
                    className="first:pl-6 last:pr-6"
                    aria-sort={sorted ? ARIA_SORT[sorted] : canSort ? "none" : undefined}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <table.FlexRender header={header} />
                        <SortIcon aria-hidden="true" className="size-3.5" />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="first:pl-6 last:pr-6">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {showPagination && <DataTablePagination dataTable={dataTable} />}
    </div>
  );
};
