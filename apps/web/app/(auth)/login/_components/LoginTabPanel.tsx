import Link from "next/link";
import { Button } from "@/components/buttons/Button";
import { Checkbox } from "@/components/checkboxes/Checkbox";
import { Input } from "@/components/inputs/Input";
import { InputPassword } from "@/components/inputs/InputPassword";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ACTION_LABELS } from "@/constants/actions";
import { useSigninForm } from "../_hooks/useSigninForm";

export const LoginTabPanel = () => {
  const { form, onSignIn, isPending } = useSigninForm()

  return (
    <form onSubmit={form.handleSubmit(onSignIn)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="login-email">Adresse e-mail</FieldLabel>
          <Input id="login-email" type="email" placeholder="vous@entreprise.fr" {...form.register("email")} />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
            <Link href="#" className="text-xs font-medium text-primary-text hover:underline">
              {ACTION_LABELS.forgotPassword}
            </Link>
          </div>
          <InputPassword id="login-password" placeholder="••••••••" {...form.register("password")} />
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="login-remember" onCheckedChange={(checked) => form.setValue("rememberMe", checked)} />
          <FieldLabel htmlFor="login-remember" className="font-normal">
            Rester connecté
          </FieldLabel>
        </Field>
        <Button className="w-full" type="submit" disabled={isPending}>
          {ACTION_LABELS.login}
        </Button>
      </FieldGroup>
    </form>
  );
}
