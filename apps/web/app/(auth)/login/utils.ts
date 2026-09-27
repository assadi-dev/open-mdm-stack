import { BetterAuthError } from "@/app/types/betterAuth";
import { ERROR_AUTH_MESSAGES, ERROR_MESSAGES } from "@/constants/errors";

export const handleSignInError = (error: BetterAuthError) => {
    switch (error.message) {
        case 'Invalid email or password':
            return ERROR_AUTH_MESSAGES.invalidCredentials;
        default:
            return ERROR_MESSAGES.generic;
    }
}