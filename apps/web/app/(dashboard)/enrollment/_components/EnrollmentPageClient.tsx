"use client";

import { useEnrollmentConfigForm } from "../_hooks/useEnrollmentConfigForm";
import { useEnrollmentMethod } from "../_hooks/useEnrollmentMethod";
import { useFetchEnrollmentOptions } from "../_hooks/useFetchEnrollmentOptions";
import { useManualInstall } from "../_hooks/useManualInstall";
import { EnrollmentHeader } from "./EnrollmentHeader";
import { EnrollmentMethodTabs } from "./EnrollmentMethodTabs";
import { EnrollmentQrCard } from "./EnrollmentQrCard";
import { NoUsbEnrollmentCard } from "./NoUsbEnrollmentCard";
import { UsbEnrollmentCard } from "./UsbEnrollmentCard";
import { EnrollmentConfigForm } from "./forms/EnrollmentConfigForm";

export const EnrollmentPageClient = () => {
  const { method, setMethod } = useEnrollmentMethod();
  const { data: options, isPending, isError, refetch } = useFetchEnrollmentOptions();
  // Le formulaire est partagé : le QR code s'y génère, l'enrôlement par USB en lit les réglages.
  const { form, qr, onGenerateQr, onReset, isGeneratingQr } = useEnrollmentConfigForm(options);
  const { withoutUsb, showWithoutUsb, showUsb } = useManualInstall();

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
          hasQr={!!qr}
          onGenerateQr={onGenerateQr}
          onReset={onReset}
          isGeneratingQr={isGeneratingQr}
        />
        {method === "qr" ? (
          <EnrollmentQrCard qr={qr} isGenerating={isGeneratingQr} canGenerate={!!options} onGenerate={onGenerateQr} />
        ) : withoutUsb ? (
          <NoUsbEnrollmentCard agentApkUrl={options?.agent.apkUrl} onUseUsb={showUsb} />
        ) : (
          <UsbEnrollmentCard form={form} agentVersion={options?.agent.version} onInstallWithCode={showWithoutUsb} />
        )}
      </div>
    </>
  );
};
