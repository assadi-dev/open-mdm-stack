"use client"

import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form"
import { loginFormSchema } from "../_schemas/loginSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginForm, UseSigninFormHookReturn } from "../_types/form"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { ERROR_MESSAGES } from "@/constants/errors"
import { handleSignInError } from "../utils"
import { SUCCESS_AUTH_MESSAGES } from "@/constants/success"


export const useSigninForm = (): UseSigninFormHookReturn => {

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    })

    const onSignIn: SubmitHandler<LoginForm> = async ({ email, password, rememberMe }) => {
        try {
            const { error, data } = await authClient.signIn.email({
                email,
                password,
                rememberMe,


            })

            if (error) {
                toast.error(handleSignInError(error))
            } else {


                console.log(data.user);

                toast.success(SUCCESS_AUTH_MESSAGES.login)
            }




        } catch (error) {
            toast.error(ERROR_MESSAGES.generic);
        }
    }

    return { form, onSignIn, isPending: form.formState.isSubmitting }

}
