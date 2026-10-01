import type { RowData } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/inputs/InputGroup";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableController } from "@/hooks/useDataTable";

type DataTableSearchProps<TData extends RowData> = {
  dataTable: DataTableController<TData>;
  placeholder?: string;
  label?: string;
  className?: string;
};

export const DataTableSearch = <TData extends RowData>({
  dataTable,
  placeholder = DATA_TABLE.search.placeholder,
  label = DATA_TABLE.search.label,
  className,
}: DataTableSearchProps<TData>) => (
  <InputGroup className={className}>
    <InputGroupInput
      type="search"
      value={dataTable.search}
      onChange={(event) => dataTable.setSearch(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
    <InputGroupAddon align="inline-end">
      <Search className="size-5" />
    </InputGroupAddon>
  </InputGroup>
);
