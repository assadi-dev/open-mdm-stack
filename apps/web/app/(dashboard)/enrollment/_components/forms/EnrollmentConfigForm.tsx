"use client";

import type { FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/buttons/Button";
import { CardContent, CardFooter } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { ENROLLMENT } from "@/constants/enrollment";
import type { EnrollmentConfigFormValues, EnrollmentMethod, EnrollmentOptions } from "../../_types/enrollment.types";
import { EnrollmentConfigFormFields } from "./EnrollmentConfigFormFields";

type EnrollmentConfigFormProps = {
  form: UseFormReturn<EnrollmentConfigFormValues>;
  method: EnrollmentMethod;
  options?: EnrollmentOptions;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onRegenerateQr: (event?: FormEvent) => void;
  onReset: () => void;
  isRegeneratingQr: boolean;
};

export const EnrollmentConfigForm = ({
  form,
  method,
  options,
  isPending,
  isError,
  onRetry,
  onRegenerateQr,
  onReset,
  isRegeneratingQr,
}: EnrollmentConfigFormProps) => {
  const isQr = method === "qr";

  // En mode manuel, le formulaire n'a pas de bouton d'envoi : « Entrée » dans un champ ne déclenche rien.
  const onSubmit = (event: FormEvent) => {
    if (isQr) onRegenerateQr(event);
    else event.preventDefault();
  };

  return (
    <SectionCard title={ENROLLMENT.config.title} description={ENROLLMENT.config.description[method]} className="min-w-0">
      <CardQueryState isPending={isPending} isError={isError} onRetry={onRetry} skeletonClassName="h-96">
        {options && (
          // `contents` : le contenu et le pied restent des enfants directs de la carte, qui les espace.
          <form className="contents" noValidate onSubmit={onSubmit}>
            <CardContent>
              <EnrollmentConfigFormFields form={form} method={method} options={options} />
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" variant="secondary" onClick={onReset}>
                {ENROLLMENT.button.reset}
              </Button>
              {isQr && (
                <Button type="submit" disabled={isRegeneratingQr}>
                  <RefreshCw aria-hidden="true" className={isRegeneratingQr ? "animate-spin" : undefined} />
                  {ENROLLMENT.button.regenerateQr}
                </Button>
              )}
            </CardFooter>
          </form>
        )}
      </CardQueryState>
    </SectionCard>
  );
};
