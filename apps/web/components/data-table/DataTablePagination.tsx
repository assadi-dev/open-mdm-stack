import type { RowData } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/pagination/Pagination";
import { DATA_TABLE } from "@/constants/data-table";
import type { DataTableController } from "@/hooks/useDataTable";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPageItems } from "./data-table-utils";

type DataTablePaginationProps<TData extends RowData> = {
  dataTable: DataTableController<TData>;
  itemsLabel?: string;
  className?: string;
};

export const DataTablePagination = <TData extends RowData>({
  dataTable,
  itemsLabel,
  className,
}: DataTablePaginationProps<TData>) => {
  const { pageIndex, pageSize, pageCount, totalRows, canPrevious, canNext, previous, next, goTo } = dataTable.pagination;

  if (pageCount <= 1) return null;

  const from = pageIndex * pageSize + 1;
  const to = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const range = `${formatNumber(from)}–${formatNumber(to)} ${DATA_TABLE.pagination.range} ${formatNumber(totalRows)}`;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-6 py-4", className)}>
      <span className="text-[0.8125rem] leading-4.5 text-muted-foreground tabular-nums">
        {itemsLabel ? `${range} ${itemsLabel}` : range}
      </span>
      <Pagination aria-label={DATA_TABLE.pagination.label} className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <Button variant="ghost" size="sm" disabled={!canPrevious} onClick={previous}>
              <ChevronLeft />
              {DATA_TABLE.pagination.previous}
            </Button>
          </PaginationItem>
          {getPageItems(pageIndex + 1, pageCount).map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <Button
                  variant={item === pageIndex + 1 ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-label={`${DATA_TABLE.pagination.page} ${item}`}
                  aria-current={item === pageIndex + 1 ? "page" : undefined}
                  onClick={() => goTo(item - 1)}
                  className="tabular-nums"
                >
                  {item}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button variant="ghost" size="sm" disabled={!canNext} onClick={next}>
              {DATA_TABLE.pagination.next}
              <ChevronRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
