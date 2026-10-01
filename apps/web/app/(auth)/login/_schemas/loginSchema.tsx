
import { ERROR_FORM_MESSAGES } from "@/constants/errors";
import z from "zod";

export const loginFormSchema = z.object({
    email: z.string().email(ERROR_FORM_MESSAGES.email),
    password: z.string().min(8, ERROR_FORM_MESSAGES.password),
    rememberMe: z.boolean(),
})

