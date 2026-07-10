import { logError } from "@lib/log"
import { toastError, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"
import { useTransition } from "react"

export default function AdbServerStart(): React.JSX.Element {
    return (
        <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Start ADB Server</p>
            <AdbKillServerButton />
        </div>
    )
}


export const AdbKillServerButton = (): React.JSX.Element => {
    const [isPending, startTransition] = useTransition()

    const killServer = async () => {


        try {
            await invoke("adb_command", { command: "kill-server" })
            toastSuccess("ADB Server killed successfully")
        } catch (error: any) {
            logError("AdbKillServerButton", error.message)
            toastError(error.message)
        }

    }


    const process = async () => {
        startTransition(killServer)
    }

    const Message = isPending ? "Killing Server..." : "Kill Server"

    return (
        <button disabled={isPending} onClick={process} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">{Message}</button>
    )
}