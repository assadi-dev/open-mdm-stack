import type { ComponentProps } from "react";
import {
  Avatar as ShadcnAvatar,
  AvatarBadge as ShadcnAvatarBadge,
  AvatarFallback as ShadcnAvatarFallback,
  AvatarGroup as ShadcnAvatarGroup,
  AvatarGroupCount as ShadcnAvatarGroupCount,
  AvatarImage as ShadcnAvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const AvatarFallback = ({ className, ...props }: ComponentProps<typeof ShadcnAvatarFallback>) => (
  <ShadcnAvatarFallback className={cn("text-[0.8125rem] font-semibold text-foreground", className)} {...props} />
);

export const Avatar = ShadcnAvatar;
export const AvatarBadge = ShadcnAvatarBadge;
export const AvatarGroup = ShadcnAvatarGroup;
export const AvatarGroupCount = ShadcnAvatarGroupCount;
export const AvatarImage = ShadcnAvatarImage;
