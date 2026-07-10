import { logError } from "@lib/log"
import { toastError, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"

export default function AdbServerStart(): React.JSX.Element {
    return (
        <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Start ADB Server</p>
            <AdbKillServerButton />
        </div>
    )
}


export const AdbKillServerButton = (): React.JSX.Element => {

    const killServer = async () => {
        try {
            await invoke("adb_command", { command: "kill-server" })
            toastSuccess("ADB Server killed successfully")
        } catch (error) {
            if (error instanceof Error) {
                logError("AdbKillServerButton", error.message)
                toastError(error.message)
            }
        }
    }
    return (
        <button onClick={killServer} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">Kill Server</button>
    )
}