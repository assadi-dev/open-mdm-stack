"use client";

import { Button } from "@/components/buttons/Button";
import { Card, CardContent } from "@/components/cards/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs/Tabs";
import { Separator } from "@/components/ui/separator";
import { ACTION_LABELS } from "@/constants/actions";
import { useGoogleSignIn } from "../_hooks/useGoogleSignIn";
import { LoginTabPanel } from "./LoginTabPanel";
import { SignupTabPanel } from "./SignupTabPanel";

export const AuthCard = () => {
  const { signInWithGoogle, isPending } = useGoogleSignIn();

  return (
    <Card className="w-[420px] [--card-spacing:--spacing(7)]">
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.4px]">Bienvenue</h1>
          <p className="text-sm text-muted-foreground">Connectez-vous pour accéder à votre console.</p>
        </div>

        <Button type="button" variant="outline" className="w-full gap-2.5" onClick={signInWithGoogle} disabled={isPending}>
          <span aria-hidden className="text-[15px] font-semibold">
            G
          </span>
          {ACTION_LABELS.continueWithGoogle}
        </Button>

        <div className="flex w-full items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        <Tabs defaultValue="login">
          <TabsList aria-label="Connexion ou inscription" className="grid w-full grid-cols-2 gap-1 border border-border p-1">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-3">
            <LoginTabPanel />
          </TabsContent>
          <TabsContent value="signup" className="pt-3">
            <SignupTabPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
