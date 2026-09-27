import Link from "next/link";

export const AuthFooter = () => (
  <p className="text-xs text-muted-foreground">
    © 2026 Open MDM ·{" "}
    <Link href="#" className="text-muted-foreground hover:underline">
      Confidentialité
    </Link>{" "}
    ·{" "}
    <Link href="#" className="text-muted-foreground hover:underline">
      Conditions
    </Link>
  </p>
);
