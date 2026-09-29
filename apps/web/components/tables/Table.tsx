import type { ComponentProps } from "react";
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCaption as ShadcnTableCaption,
  TableCell as ShadcnTableCell,
  TableFooter as ShadcnTableFooter,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const TableHeader = ({ className, ...props }: ComponentProps<typeof ShadcnTableHeader>) => (
  <ShadcnTableHeader className={cn("bg-card-strong", className)} {...props} />
);

export const TableHead = ({ className, ...props }: ComponentProps<typeof ShadcnTableHead>) => (
  <ShadcnTableHead className={cn("h-10 px-4 text-xs text-muted-foreground", className)} {...props} />
);

export const TableCell = ({ className, ...props }: ComponentProps<typeof ShadcnTableCell>) => (
  <ShadcnTableCell className={cn("px-4 py-3", className)} {...props} />
);

export const Table = ShadcnTable;
export const TableBody = ShadcnTableBody;
export const TableCaption = ShadcnTableCaption;
export const TableFooter = ShadcnTableFooter;
export const TableRow = ShadcnTableRow;
