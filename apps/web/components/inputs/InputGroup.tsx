import type { ComponentProps } from "react";
import {
  InputGroup as ShadcnInputGroup,
  InputGroupAddon as ShadcnInputGroupAddon,
  InputGroupButton as ShadcnInputGroupButton,
  InputGroupInput as ShadcnInputGroupInput,
  InputGroupText as ShadcnInputGroupText,
  InputGroupTextarea as ShadcnInputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export const InputGroup = ({ className, ...props }: ComponentProps<typeof ShadcnInputGroup>) => (
  <ShadcnInputGroup className={cn("h-11.5 rounded-md bg-card-strong", className)} {...props} />
);

export const InputGroupAddon = ShadcnInputGroupAddon;
export const InputGroupButton = ShadcnInputGroupButton;
export const InputGroupInput = ShadcnInputGroupInput;
export const InputGroupText = ShadcnInputGroupText;
export const InputGroupTextarea = ShadcnInputGroupTextarea;
