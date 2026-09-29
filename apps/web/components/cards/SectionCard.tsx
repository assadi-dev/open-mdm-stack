import type { ComponentProps, ReactNode } from "react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "./Card";
import { cn } from "@/lib/utils";

const TITLE_CLASSES = {
  default: "",
  lg: "text-[22px] leading-7 tracking-[-0.4px]",
};

type SectionCardProps = Omit<ComponentProps<typeof Card>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleSize?: keyof typeof TITLE_CLASSES;
};

export const SectionCard = ({ title, description, action, titleSize = "default", children, ...props }: SectionCardProps) => (
  <Card {...props}>
    <CardHeader>
      <CardTitle className={cn(TITLE_CLASSES[titleSize])}>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      {action && <CardAction className="flex items-center gap-2">{action}</CardAction>}
    </CardHeader>
    {children}
  </Card>
);
