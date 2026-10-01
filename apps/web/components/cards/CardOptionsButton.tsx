import { Ellipsis } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { ACTION_LABELS } from "@/constants/actions";

export const CardOptionsButton = () => (
  <Button variant="ghost" size="icon-sm" aria-label={ACTION_LABELS.options}>
    <Ellipsis />
  </Button>
);
