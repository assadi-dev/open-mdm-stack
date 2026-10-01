import type { ComponentProps } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShadcnButtonProps = ComponentProps<typeof ShadcnButton>;
type CustomButtonVariant = "ink" | "tertiary";
type ButtonVariant = NonNullable<ShadcnButtonProps["variant"]> | CustomButtonVariant;
type ButtonSize = NonNullable<ShadcnButtonProps["size"]>;
type ButtonProps = Omit<ShadcnButtonProps, "variant" | "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASSES: Partial<Record<ButtonVariant, string>> = {
  default: "hover:bg-primary/90",
  secondary: "border-card-border hover:bg-secondary/80",
  outline: "border-border-strong bg-transparent",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  link: "text-primary-text",
  ink: "bg-ink text-ink-foreground hover:bg-ink/90",
  tertiary: "bg-tab-active text-tab-active-foreground hover:bg-tab-active-hover hover:text-tab-active-foreground",
};

const isCustomVariant = (variant: ButtonVariant): variant is CustomButtonVariant =>
  variant === "ink" || variant === "tertiary";

const SIZE_CLASSES: Partial<Record<ButtonSize, string>> = {
  default: "h-11 px-4.5 text-[0.9375rem] font-semibold [&_svg:not([class*='size-'])]:size-4.5",
  sm: "h-9 px-3.5 font-semibold",
  lg: "h-12 px-6",
  icon: "size-11 rounded-full [&_svg:not([class*='size-'])]:size-4.5",
  "icon-sm": "size-9 rounded-full [&_svg:not([class*='size-'])]:size-4.5",
  "icon-lg": "size-12 rounded-full [&_svg:not([class*='size-'])]:size-4.5",
};

export const Button = ({ variant = "default", size = "default", className, ...props }: ButtonProps) => (
  <ShadcnButton
    variant={isCustomVariant(variant) ? "default" : variant}
    size={size}
    className={cn("rounded-md cursor-pointer", VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
    {...props}
  />
);
