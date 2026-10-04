import type { RowData } from "@tanstack/react-table";
import { Checkbox } from "@/components/checkboxes/Checkbox";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableColumnDef } from "./data-table-features";

export const createSelectionColumn = <TData extends RowData>(): DataTableColumnDef<TData> => ({
  id: "select",
  header: ({ table }) => (
    <Checkbox
      aria-label={DATA_TABLE.selection.all}
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected()}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      aria-label={DATA_TABLE.selection.row}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(checked) => row.toggleSelected(checked)}
    />
  ),
  enableSorting: false,
  enableGlobalFilter: false,
  enableHiding: false,
});
