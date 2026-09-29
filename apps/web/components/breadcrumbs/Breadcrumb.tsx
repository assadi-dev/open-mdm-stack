"use client"
import { Fragment, type ComponentProps } from "react";
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
import { BreadcrumbEntry } from "@/app/(dashboard)/_types/page-header.types";
import Link from "next/link";

export const BreadcrumbList = ({ className, ...props }: ComponentProps<typeof ShadcnBreadcrumbList>) => (
  <ShadcnBreadcrumbList className={cn("text-[13px]", className)} {...props} />
);

export const Breadcrumb = ShadcnBreadcrumb;
export const BreadcrumbEllipsis = ShadcnBreadcrumbEllipsis;
export const BreadcrumbItem = ShadcnBreadcrumbItem;
export const BreadcrumbLink = ShadcnBreadcrumbLink;
export const BreadcrumbPage = ShadcnBreadcrumbPage;
export const BreadcrumbSeparator = ShadcnBreadcrumbSeparator;


export const BreadcrumbDisplay = ({ breadcrumbs = [] }: { breadcrumbs: BreadcrumbEntry[] }) => {

  if (breadcrumbs.length === 0 || !breadcrumbs) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((entry, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <Fragment key={entry.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={entry.href} />}>{entry.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )

}