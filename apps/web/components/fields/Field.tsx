import type { ComponentProps } from "react";
import {
  Field as ShadcnField,
  FieldContent as ShadcnFieldContent,
  FieldDescription as ShadcnFieldDescription,
  FieldError as ShadcnFieldError,
  FieldGroup as ShadcnFieldGroup,
  FieldLabel as ShadcnFieldLabel,
  FieldLegend as ShadcnFieldLegend,
  FieldSeparator as ShadcnFieldSeparator,
  FieldSet as ShadcnFieldSet,
  FieldTitle as ShadcnFieldTitle,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const FieldLabel = ({ className, ...props }: ComponentProps<typeof ShadcnFieldLabel>) => (
  <ShadcnFieldLabel className={cn("text-[0.8125rem]", className)} {...props} />
);

export const FieldError = ({ className, ...props }: ComponentProps<typeof ShadcnFieldError>) => (
  <ShadcnFieldError className={cn("text-[0.8125rem] font-medium", className)} {...props} />
);

export const Field = ShadcnField;
export const FieldContent = ShadcnFieldContent;
export const FieldDescription = ShadcnFieldDescription;
export const FieldGroup = ShadcnFieldGroup;
export const FieldLegend = ShadcnFieldLegend;
export const FieldSeparator = ShadcnFieldSeparator;
export const FieldSet = ShadcnFieldSet;
export const FieldTitle = ShadcnFieldTitle;
