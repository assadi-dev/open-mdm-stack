import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { loginFormSchema } from "../_schemas/loginSchema";
import z from "zod";

export type LoginForm = z.infer<typeof loginFormSchema>;


export type UseSigninFormHookReturn = {
    form: UseFormReturn<LoginForm>;
    onSignIn: SubmitHandler<LoginForm>;
    isPending: boolean;

} 