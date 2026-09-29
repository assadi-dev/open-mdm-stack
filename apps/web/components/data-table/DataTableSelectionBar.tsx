import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { Button } from "@/components/buttons/Button";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableController } from "@/hooks/useDataTable";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type DataTableSelectionBarProps<TData extends RowData> = {
  dataTable: DataTableController<TData>;
  actions?: (selectedRows: TData[]) => ReactNode;
  className?: string;
};

export const DataTableSelectionBar = <TData extends RowData>({
  dataTable,
  actions,
  className,
}: DataTableSelectionBarProps<TData>) => {
  const { selectedRows, selectedCount, clear } = dataTable.selection;

  if (selectedCount === 0) return null;

  return (
    <div
      role="status"
      className={cn("mx-6 mb-4 flex flex-wrap items-center gap-3 rounded-md bg-primary-soft px-4 py-2", className)}
    >
      <span className="text-sm font-medium tabular-nums">
        {`${formatNumber(selectedCount)} ${selectedCount > 1 ? DATA_TABLE.selection.many : DATA_TABLE.selection.one}`}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {actions?.(selectedRows)}
        <Button variant="ghost" size="sm" onClick={clear}>
          {DATA_TABLE.selection.clear}
        </Button>
      </div>
    </div>
  );
};
