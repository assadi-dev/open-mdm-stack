"use client";

import { useEnrollmentConfigForm } from "../_hooks/useEnrollmentConfigForm";
import { useEnrollmentMethod } from "../_hooks/useEnrollmentMethod";
import { useFetchEnrollmentOptions } from "../_hooks/useFetchEnrollmentOptions";
import { EnrollmentHeader } from "./EnrollmentHeader";
import { EnrollmentMethodTabs } from "./EnrollmentMethodTabs";
import { EnrollmentQrCard } from "./EnrollmentQrCard";
import { NoUsbEnrollmentCard } from "./NoUsbEnrollmentCard";
import { UsbEnrollmentCard } from "./UsbEnrollmentCard";
import { EnrollmentConfigForm } from "./forms/EnrollmentConfigForm";

export const EnrollmentPageClient = () => {
  const { method, setMethod } = useEnrollmentMethod();
  const { data: options, isPending, isError, refetch } = useFetchEnrollmentOptions();
  // Le formulaire est partagé : le QR code s'y régénère, l'enrôlement par USB en lit les réglages.
  const { form, onRegenerateQr, onReset, isRegeneratingQr } = useEnrollmentConfigForm(options);

  return (
    <>
      <EnrollmentHeader method={method} />
      <EnrollmentMethodTabs method={method} onMethodChange={setMethod} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <EnrollmentConfigForm
          form={form}
          method={method}
          options={options}
          isPending={isPending}
          isError={isError}
          onRetry={() => refetch()}
          onRegenerateQr={onRegenerateQr}
          onReset={onReset}
          isRegeneratingQr={isRegeneratingQr}
        />
        {method === "qr" ? (
          <EnrollmentQrCard />
        ) : (
          <div className="flex min-w-0 flex-col gap-5">
            <UsbEnrollmentCard form={form} agentVersion={options?.agent.version} />
            <NoUsbEnrollmentCard agentApkUrl={options?.agent.apkUrl} />
          </div>
        )}
      </div>
    </>
  );
};
