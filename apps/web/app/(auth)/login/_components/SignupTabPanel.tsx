import Link from "next/link";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/inputs/Input";
import { InputPassword } from "@/components/inputs/InputPassword";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ACTION_LABELS } from "@/constants/actions";

export const SignupTabPanel = () => (
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="signup-name">Nom complet</FieldLabel>
      <Input id="signup-name" type="text" placeholder="Camille Laurent" />
    </Field>
    <Field>
      <FieldLabel htmlFor="signup-email">E-mail professionnel</FieldLabel>
      <Input id="signup-email" type="email" placeholder="vous@entreprise.fr" />
    </Field>
    <Field>
      <FieldLabel htmlFor="signup-password">Mot de passe</FieldLabel>
      <InputPassword id="signup-password" placeholder="••••••••" />
      <FieldDescription>8 caractères minimum, dont un chiffre et une majuscule.</FieldDescription>
    </Field>
    <Button type="button" className="w-full">
      {ACTION_LABELS.signup}
    </Button>
    <p className="text-center text-xs text-muted-foreground">
      En créant un compte, vous acceptez les{" "}
      <Link href="#" className="text-primary-text hover:underline">
        conditions d’utilisation
      </Link>
      .
    </p>
  </FieldGroup>
);
