import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs/Breadcrumb";
import { SidebarTrigger } from "@/components/sidebar/Sidebar";
import { HEADER } from "@/constants/header";
import type { BreadcrumbEntry } from "../_types/page-header.types";
import { AccountButton } from "./AccountButton";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationButton } from "./NotificationButton";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbEntry[];
};

export const PageHeader = ({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) => (
  <header className="sticky top-0 z-20 flex items-center gap-3 rounded-2xl border border-card-border bg-card py-4 pr-4 pl-4 backdrop-blur-[6px] md:gap-6 md:pl-6">
    <SidebarTrigger className="md:hidden" aria-label={HEADER.sidebar.toggle} />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {breadcrumbs.length > 0 && (
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
      )}
      <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.6px]">{title}</h1>
      {subtitle && <p className="text-[13px] leading-4.5 text-muted-foreground">{subtitle}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <GlobalSearch />
      <NotificationButton />
      <AccountButton />
    </div>
  </header>
);
