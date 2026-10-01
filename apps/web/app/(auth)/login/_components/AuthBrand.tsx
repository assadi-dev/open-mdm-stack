import { ShieldCheck } from "lucide-react";

export const AuthBrand = () => (
  <div className="flex items-center gap-2.5">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <ShieldCheck className="size-[18px]" aria-hidden />
    </span>
    <span className="text-[1.0625rem] leading-6 font-semibold">Open MDM</span>
  </div>
);
