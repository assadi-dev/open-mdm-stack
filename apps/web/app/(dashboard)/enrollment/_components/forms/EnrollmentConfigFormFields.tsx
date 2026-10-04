"use client";

import { useId } from "react";
import { Download } from "lucide-react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/buttons/Button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/fields/Field";
import { Input } from "@/components/inputs/Input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/inputs/InputGroup";
import { ENROLLMENT } from "@/constants/enrollment";
import {
  toAgentApkUrl,
  toApkUrlDescription,
  toGroupOptions,
  toPolicyOptions,
  toWifiOptions,
} from "../../_services/enrollment.utils";
import type { EnrollmentConfigFormValues, EnrollmentMethod, EnrollmentOptions } from "../../_types/enrollment.types";
import { EnrollmentOptionSelect } from "./inputs/EnrollmentOptionSelect";

const OptionalMark = () => <span className="ml-1.5 text-xs font-normal text-muted-foreground">{ENROLLMENT.config.optional}</span>;

type EnrollmentConfigFormFieldsProps = {
  form: UseFormReturn<EnrollmentConfigFormValues>;
  method: EnrollmentMethod;
  options: EnrollmentOptions;
};

export const EnrollmentConfigFormFields = ({ form, method, options }: EnrollmentConfigFormFieldsProps) => {
  const { control, register, formState } = form;
  const { errors } = formState;
  const apkUrl = useWatch({ control, name: "apkUrl" }) ?? "";
  const fieldId = useId();
  const { name: nameText, group, policy, wifi, apkUrl: apkUrlText } = ENROLLMENT.config;

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor={`${fieldId}-name`}>{nameText.label}</FieldLabel>
        <Input
          id={`${fieldId}-name`}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={`${fieldId}-name-description`}
          {...register("name")}
        />
        <FieldDescription id={`${fieldId}-name-description`}>{nameText.description}</FieldDescription>
        <FieldError errors={[errors.name]} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={!!errors.groupId}>
          <FieldLabel htmlFor={`${fieldId}-group`}>{group.label}</FieldLabel>
          <Controller
            control={control}
            name="groupId"
            render={({ field }) => (
              <EnrollmentOptionSelect
                id={`${fieldId}-group`}
                value={field.value}
                options={toGroupOptions(options)}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.groupId}
              />
            )}
          />
          <FieldError errors={[errors.groupId]} />
        </Field>
        <Field data-invalid={!!errors.policyId}>
          <FieldLabel htmlFor={`${fieldId}-policy`}>{policy.label}</FieldLabel>
          <Controller
            control={control}
            name="policyId"
            render={({ field }) => (
              <EnrollmentOptionSelect
                id={`${fieldId}-policy`}
                value={field.value}
                options={toPolicyOptions(options)}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.policyId}
              />
            )}
          />
          <FieldError errors={[errors.policyId]} />
        </Field>
      </div>

      <FieldSeparator />

      {/* Le Wi-Fi est inscrit dans le QR code ; un appareil branché en USB est déjà sur un réseau. */}
      {method === "qr" && (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-wifi`}>
            {wifi.label}
            <OptionalMark />
          </FieldLabel>
          <Controller
            control={control}
            name="wifiId"
            render={({ field }) => (
              <EnrollmentOptionSelect
                id={`${fieldId}-wifi`}
                value={field.value}
                options={toWifiOptions(options)}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldDescription>{wifi.description}</FieldDescription>
        </Field>
      )}

      <Field data-invalid={!!errors.apkUrl}>
        <FieldLabel htmlFor={`${fieldId}-apk-url`}>
          {apkUrlText.label}
          <OptionalMark />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id={`${fieldId}-apk-url`}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder={apkUrlText.placeholder}
            className="placeholder:text-subtle-foreground"
            aria-invalid={!!errors.apkUrl}
            aria-describedby={`${fieldId}-apk-url-description`}
            {...register("apkUrl")}
          />
          <InputGroupAddon align="inline-end">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<a href={toAgentApkUrl(apkUrl, options)} download />}
              aria-label={ENROLLMENT.button.downloadApk}
            >
              <Download aria-hidden="true" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription id={`${fieldId}-apk-url-description`}>{toApkUrlDescription(options.agent.version)}</FieldDescription>
        <FieldError errors={[errors.apkUrl]} />
      </Field>
    </FieldGroup>
  );
};
