import { logError } from "@lib/log"
import { toastError, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"
import { useTransition } from "react"
import SectionHeading from "@components/ui/SectionHeading"



export default function AdbServerStart(): React.JSX.Element {

    return (
        <section>
            <SectionHeading>Server</SectionHeading>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface px-4 py-3">
                <div>
                    <p className="font-medium text-slate-100">ADB server</p>
                    <p className="text-sm text-text-muted">Stop the local ADB daemon</p>
                </div>
                <AdbKillServerButton />
            </div>
        </section>
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
        <button
            disabled={isPending}
            onClick={process}
            className="cursor-pointer rounded-md bg-danger/15 px-4 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-danger/15 disabled:hover:text-danger"
        >
            {Message}
        </button>
    )
}