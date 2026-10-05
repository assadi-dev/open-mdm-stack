// L'APK de l'agent : celui demandé, sinon celui du serveur (`NEXT_PUBLIC_AGENT_APK_URL`). Le téléchargement par USB
// (`agent/route.ts`) et le QR code (`qr-code/route.ts`) passent tous deux par ici : ils partent de la même adresse.
export const resolveAgentApkUrl = (apkUrl?: string) => apkUrl ?? process.env.NEXT_PUBLIC_AGENT_APK_URL;
