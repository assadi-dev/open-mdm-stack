import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { ERROR_MESSAGES } from "@/constants/errors";
import { SUCCESS_AUTH_MESSAGES } from "@/constants/success";

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      try {
        const { error } = await authClient.signOut();

        if (error) {
          toast.error(ERROR_MESSAGES.generic);
          return;
        }

        queryClient.clear();
        toast.success(SUCCESS_AUTH_MESSAGES.logout);
        router.push("/login");
      } catch {
        toast.error(ERROR_MESSAGES.generic);
      }
    });
  };

  return { signOut, isPending };
};
