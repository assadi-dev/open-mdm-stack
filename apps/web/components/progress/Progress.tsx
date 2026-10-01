import type { ComponentProps } from "react";
import {
  Progress as ShadcnProgress,
  ProgressIndicator as ShadcnProgressIndicator,
  ProgressLabel as ShadcnProgressLabel,
  ProgressTrack as ShadcnProgressTrack,
  ProgressValue as ShadcnProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Progress = ({ className, ...props }: ComponentProps<typeof ShadcnProgress>) => (
  <ShadcnProgress
    locale="fr-FR"
    className={cn(
      "**:data-[slot=progress-track]:h-2! **:data-[slot=progress-track]:bg-chart-track! **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-(image:--gradient-flame)",
      className,
    )}
    {...props}
  />
);

export const ProgressIndicator = ShadcnProgressIndicator;
export const ProgressLabel = ShadcnProgressLabel;
export const ProgressTrack = ShadcnProgressTrack;
export const ProgressValue = ShadcnProgressValue;
