"use client";

import { useState } from "react";
import { ShieldCheck, Trash2, Wifi, type LucideIcon } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/dialogs/AlertDialog";
import { ACTION_LABELS } from "@/constants/actions";
import { ENROLLMENT } from "@/constants/enrollment";
import { useEnrollmentMutation } from "../../_hooks/useEnrollmentMutation";

const { deviceOwnerDialog: TEXT } = ENROLLMENT;

const POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: ShieldCheck, text: TEXT.points.policies },
  { icon: Wifi, text: TEXT.points.wifi },
  { icon: Trash2, text: TEXT.points.wipe },
];

// Le bouton « Appliquer le mode sans restriction » et sa confirmation : la boîte explique ce que Device Owner change.
export const DeviceOwnerDialog = () => {
  const [open, setOpen] = useState(false);
  const { applyDeviceOwner } = useEnrollmentMutation();

  // La boîte se ferme à la réussite seulement : en cas d'échec, elle reste et le toast explique.
  const onApply = () => applyDeviceOwner.mutate(undefined, { onSuccess: () => setOpen(false) });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button className="w-full" />}>
        <ShieldCheck aria-hidden="true" />
        {ENROLLMENT.button.applyDeviceOwner}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
              <ShieldCheck aria-hidden="true" className="size-4.5" />
            </span>
            <AlertDialogTitle>{TEXT.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{TEXT.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="flex flex-col gap-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5 text-[0.8125rem] leading-4.5">
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {text}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onApply} disabled={applyDeviceOwner.isPending}>
            {ENROLLMENT.button.confirmDeviceOwner}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
