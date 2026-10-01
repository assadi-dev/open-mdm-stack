"use server"


import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const getSessionServer = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.session) {
        return null
    }
    return session
}

export const isAdmin = async () => {
    try {
        const session = await getSessionServer()
        if (!session) return false
        const user = session.user
        return user?.isAdmin
    } catch (error) {
        console.error("Error getting user role:", error)
        return false
    }
}


export const isUserAuthticated = async () => {
    try {
        const session = await getSessionServer()
        if (!session) redirect("/login")

    } catch (error) {
        console.error("Error getting user role:", error)
        redirect("/login")
    }
}