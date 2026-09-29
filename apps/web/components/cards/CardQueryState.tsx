import type { ReactNode } from "react";
import { Button } from "@/components/buttons/Button";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { ACTION_LABELS } from "@/constants/actions";
import { ERROR_MESSAGES } from "@/constants/errors";
import { cn } from "@/lib/utils";
import { CardContent } from "./Card";

type CardErrorStateProps = {
  onRetry: () => void;
};

export const CardErrorState = ({ onRetry }: CardErrorStateProps) => (
  <CardContent role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
    <p className="text-sm text-muted-foreground">{ERROR_MESSAGES.generic}</p>
    <Button variant="secondary" size="sm" onClick={onRetry}>
      {ACTION_LABELS.retry}
    </Button>
  </CardContent>
);

type CardQueryStateProps = {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  skeletonClassName?: string;
  children: ReactNode;
};

export const CardQueryState = ({ isPending, isError, onRetry, skeletonClassName, children }: CardQueryStateProps) => {
  if (isPending) {
    return (
      <CardContent>
        <Skeleton className={cn("h-40 w-full rounded-lg", skeletonClassName)} />
      </CardContent>
    );
  }

  if (isError) return <CardErrorState onRetry={onRetry} />;

  return children;
};
