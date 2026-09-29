"use client"


import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";

export const UserSessionComponent = () => {
    const router = useRouter()
    const { data } = authClient.useSession()



    return (
        <>
            <p>Bonjour {data?.user.name}</p>
            <p>{data?.user?.email}</p>
            <button onClick={async () => {
                await authClient.signOut();
                router.push("/login")
            }}>Déconnexion</button>

        </>
    )
}