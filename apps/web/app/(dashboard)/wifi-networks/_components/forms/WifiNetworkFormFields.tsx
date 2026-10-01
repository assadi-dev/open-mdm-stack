"use client";

import { useId } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/fields/Field";
import { Input } from "@/components/inputs/Input";
import { InputPassword } from "@/components/inputs/InputPassword";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/selects/Select";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { isWifiSecurity, SECURITY_OPTIONS } from "../_services/wifi-networks.utils";
import type { WifiNetworkFormValues, WifiSecurity } from "../_types/wifi-network.types";

type WifiNetworkFormFieldsProps = {
  form: UseFormReturn<WifiNetworkFormValues>;
  isEditing: boolean;
};

export const WifiNetworkFormFields = ({ form, isEditing }: WifiNetworkFormFieldsProps) => {
  const { control, register, setValue, clearErrors, trigger, formState } = form;
  const { errors, isSubmitted } = formState;
  const security = useWatch({ control, name: "security" });
  const fieldId = useId();
  const isOpenNetwork = security === "NONE";
  const { ssid, security: securityText, password } = WIFI_NETWORK.form;

  // Un réseau ouvert n'a pas de mot de passe. Après une première soumission, la règle du mot de passe dépend de la sécurité : on la rejoue.
  const onSecurityChange = (next: WifiSecurity) => {
    if (next === "NONE") {
      setValue("password", "");
      clearErrors("password");
    } else if (isSubmitted) {
      void trigger("password");
    }
  };

  return (
    <FieldGroup className="mt-2">
      <Field data-invalid={!!errors.ssid}>
        <FieldLabel htmlFor={`${fieldId}-ssid`}>{ssid.label}</FieldLabel>
        <Input
          id={`${fieldId}-ssid`}
          placeholder={ssid.placeholder}
          autoComplete="off"
          aria-invalid={!!errors.ssid}
          {...register("ssid")}
        />
        <FieldError errors={[errors.ssid]} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-security`}>{securityText.label}</FieldLabel>
        <Controller
          control={control}
          name="security"
          render={({ field }) => (
            <Select
              value={field.value}
              items={SECURITY_OPTIONS}
              onValueChange={(next) => {
                if (!isWifiSecurity(next)) return;
                field.onChange(next);
                onSecurityChange(next);
              }}
            >
              <SelectTrigger id={`${fieldId}-security`} className="w-full" onBlur={field.onBlur}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECURITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field data-invalid={!!errors.password} data-disabled={isOpenNetwork}>
        <FieldLabel htmlFor={`${fieldId}-password`}>{password.label}</FieldLabel>
        <InputPassword
          id={`${fieldId}-password`}
          placeholder={isEditing ? password.keepPlaceholder : password.placeholder}
          autoComplete="new-password"
          disabled={isOpenNetwork}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError errors={[errors.password]} />
      </Field>
    </FieldGroup>
  );
};
