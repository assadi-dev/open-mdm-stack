import type { ComponentProps } from "react";
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbEllipsis as ShadcnBreadcrumbEllipsis,
  BreadcrumbItem as ShadcnBreadcrumbItem,
  BreadcrumbLink as ShadcnBreadcrumbLink,
  BreadcrumbList as ShadcnBreadcrumbList,
  BreadcrumbPage as ShadcnBreadcrumbPage,
  BreadcrumbSeparator as ShadcnBreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export const BreadcrumbList = ({ className, ...props }: ComponentProps<typeof ShadcnBreadcrumbList>) => (
  <ShadcnBreadcrumbList className={cn("text-[13px]", className)} {...props} />
);

export const Breadcrumb = ShadcnBreadcrumb;
export const BreadcrumbEllipsis = ShadcnBreadcrumbEllipsis;
export const BreadcrumbItem = ShadcnBreadcrumbItem;
export const BreadcrumbLink = ShadcnBreadcrumbLink;
export const BreadcrumbPage = ShadcnBreadcrumbPage;
export const BreadcrumbSeparator = ShadcnBreadcrumbSeparator;
