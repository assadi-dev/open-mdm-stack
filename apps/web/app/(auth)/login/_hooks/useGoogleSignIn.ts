import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { ERROR_MESSAGES } from "@/constants/errors";

/**
 * Triggers the Google OAuth flow via better-auth. On success the browser is
 * redirected to Google's consent screen (then back to `callbackURL`), so
 * there is no "success" state to report here — only initiation failures.
 */
export const useGoogleSignIn = () => {
  const [isPending, startTransition] = useTransition();

  const signInWithGoogle = async () => {
    startTransition(async () => {

      try {
        const { error } = await authClient.signIn.social({
          provider: "google",
          callbackURL: process.env.NEXT_PUBLIC_HOME_URL,
        });

        if (error) {
          console.log(error);
          toast.error(ERROR_MESSAGES.generic);
        }
      } catch (error) {
        console.log(error);
        toast.error(ERROR_MESSAGES.generic);
      }
    });
  };

  return { signInWithGoogle, isPending };
};
