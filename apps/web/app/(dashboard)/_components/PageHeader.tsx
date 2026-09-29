import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbDisplay,
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
  children?: React.ReactNode;
};

export const PageHeader = ({ title, subtitle, breadcrumbs = [], children }: PageHeaderProps) => (
  <div className="flex items-center gap-3 justify-between py-4 pr-4 pl-4 md:gap-6 md:pl-6">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {breadcrumbs.length > 0 && (
        <BreadcrumbDisplay breadcrumbs={breadcrumbs} />
      )}
      <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.6px]">{title}</h1>
      {subtitle && <p className="text-[13px] leading-4.5 text-muted-foreground">{subtitle}</p>}
    </div>

    <div className="flex shrink-0 items-center gap-3">
      {children}
    </div>
  </div>
);


