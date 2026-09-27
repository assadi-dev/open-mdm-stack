import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ERROR_MESSAGES } from "@/constants/errors";

/**
 * Triggers the Google OAuth flow via better-auth. On success the browser is
 * redirected to Google's consent screen (then back to `callbackURL`), so
 * there is no "success" state to report here — only initiation failures.
 */
export const useGoogleSignIn = () => {
  const [isPending, setIsPending] = useState(false);

  const signInWithGoogle = async () => {
    setIsPending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (error) {
        toast.error(ERROR_MESSAGES.generic);
      }
    } catch {
      toast.error(ERROR_MESSAGES.generic);
    } finally {
      setIsPending(false);
    }
  };

  return { signInWithGoogle, isPending };
};
