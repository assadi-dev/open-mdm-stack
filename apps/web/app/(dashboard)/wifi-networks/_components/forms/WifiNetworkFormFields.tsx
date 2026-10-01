"use client";

import { useId } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/fields/Field";
import { Input } from "@/components/inputs/Input";
import { InputPassword } from "@/components/inputs/InputPassword";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import type { WifiNetworkFormValues, WifiSecurity } from "../../_types/wifi-network.types";
import { WifiSecuritySelect } from "./inputs/WifiSecuritySelect";

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
  const { name, ssid, security: securityText, password } = WIFI_NETWORK.form;

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
      <Field>
        <FieldLabel htmlFor={`${fieldId}-name`}>
          {name.label}
          <span className="font-normal text-muted-foreground">{name.optional}</span>
        </FieldLabel>
        <Input
          id={`${fieldId}-name`}
          autoComplete="off"
          aria-describedby={`${fieldId}-name-description`}
          {...register("name")}
        />
        <FieldDescription id={`${fieldId}-name-description`}>{name.description}</FieldDescription>
      </Field>
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
            <WifiSecuritySelect
              id={`${fieldId}-security`}
              value={field.value}
              onBlur={field.onBlur}
              onValueChange={(next) => {
                field.onChange(next);
                onSecurityChange(next);
              }}
            />
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
