import { Check, LoaderCircle, Usb } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { ENROLLMENT } from "@/constants/enrollment";

type UsbIdleStateProps = {
  isConnecting: boolean;
  onConnect: () => void;
};

// Rien de branché : le bouton de connexion, puis ce qu'il faut préparer sur l'appareil.
export const UsbIdleState = ({ isConnecting, onConnect }: UsbIdleStateProps) => {
  const { idle, prerequisites } = ENROLLMENT.usb;

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-4 py-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-card-strong text-primary-text">
          <Usb aria-hidden="true" className="size-5.5" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{idle.title}</span>
          <span className="text-[0.8125rem] leading-4.5 text-muted-foreground">{idle.description}</span>
        </div>
        <Button onClick={onConnect} disabled={isConnecting}>
          {isConnecting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Usb aria-hidden="true" />}
          {ENROLLMENT.button.connect}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[0.8125rem] font-medium text-muted-foreground">{prerequisites.title}</span>
        <ul className="flex flex-col gap-2">
          {prerequisites.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] leading-4.5">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-text" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
