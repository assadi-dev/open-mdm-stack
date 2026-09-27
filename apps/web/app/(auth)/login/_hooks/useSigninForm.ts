"use client"

import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form"
import { loginFormSchema } from "../_schemas/loginSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginForm, UseSigninFormHookReturn } from "../_types/form"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { ERROR_AUTH_MESSAGES, ERROR_MESSAGES } from "@/constants/errors"
import { handleSignInError } from "../utils"


export const useSigninForm = (): UseSigninFormHookReturn => {

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    })

    const onSignIn: SubmitHandler<LoginForm> = async (data) => {
        try {
            const { error } = await authClient.signIn.email({
                email: data.email,
                password: data.password,
                rememberMe: data.rememberMe,
                callbackURL: process.env.NEXT_PUBLIC_HOME_URL,
            })

            if (error) {
                toast.error(handleSignInError(error))
            }
        } catch (error) {
            toast.error(ERROR_MESSAGES.generic);
        }
    }

    return { form, onSignIn, isPending: form.formState.isSubmitting }

}
