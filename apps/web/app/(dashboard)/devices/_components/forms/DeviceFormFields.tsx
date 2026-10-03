"use client";

import { useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/fields/Field";
import { Input } from "@/components/inputs/Input";
import { DEVICE } from "@/constants/device";
import type { DeviceFormValues } from "../../_types/device.types";

type DeviceFormFieldsProps = {
  form: UseFormReturn<DeviceFormValues>;
  // Ce que la liste affiche quand le nom reste vide : le modèle de l'appareil.
  namePlaceholder?: string;
};

export const DeviceFormFields = ({ form, namePlaceholder }: DeviceFormFieldsProps) => {
  const { register, formState } = form;
  const { errors } = formState;
  const fieldId = useId();
  const { name } = DEVICE.form;

  return (
    <FieldGroup className="mt-2">
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor={`${fieldId}-name`}>
          {name.label}
          <span className="font-normal text-muted-foreground">{name.optional}</span>
        </FieldLabel>
        <Input
          id={`${fieldId}-name`}
          placeholder={namePlaceholder ?? name.placeholder}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={`${fieldId}-name-description`}
          {...register("name")}
        />
        <FieldDescription id={`${fieldId}-name-description`}>{name.description}</FieldDescription>
        <FieldError errors={[errors.name]} />
      </Field>
    </FieldGroup>
  );
};
