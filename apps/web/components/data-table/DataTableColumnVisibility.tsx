"use client";

import type { RowData } from "@tanstack/react-table";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/menus/DropdownMenu";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableController } from "@/hooks/useDataTable";

type DataTableColumnVisibilityProps<TData extends RowData> = {
  dataTable: DataTableController<TData>;
  label?: string;
};

// Un seul bouton pour masquer ou afficher les colonnes du tableau : un menu de cases, qui reste ouvert pendant qu'on coche.
export const DataTableColumnVisibility = <TData extends RowData>({
  dataTable,
  label = DATA_TABLE.columns.button,
}: DataTableColumnVisibilityProps<TData>) => {
  const { columns } = dataTable.columnVisibility;

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        <Columns3 />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{DATA_TABLE.columns.title}</DropdownMenuLabel>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem key={column.id} checked={column.isVisible} onCheckedChange={column.toggle}>
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
