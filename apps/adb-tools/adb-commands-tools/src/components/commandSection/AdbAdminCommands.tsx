import { CopyIcon, TerminalIcon } from "@components/Icons/comons"
import { ADB_COMMANDS } from "@lib/commands"
import { logError } from "@lib/log"
import { toastError, toastPromise, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"
import { useTransition } from "react"


export default function AdbAdminCommands(): React.JSX.Element {
    return (
        <div className="flex flex-col gap-4 py-3">
            <div>
                <p className="mb-3">Activate Device Owner</p>
                <AdbAdminCommandCard command={ADB_COMMANDS.dpmSetDeviceOwner} />
            </div>
            <div>
                <p className="mb-3">Remove Device Owner</p>
                <AdbAdminCommandCard command={ADB_COMMANDS.dpmRemoveDeviceOwner} />
            </div>
        </div>
    )
}


const AdbAdminCommandCard = ({ command }: { command: string }): React.JSX.Element => {
    const textToCopy = `adb shell ${command}`

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-[#1e1e1e] flex items-center justify-between">
            <p className="text-xs"><span className="font-bold text-yellow-400">adb</span> shell {command}</p>
            <div className="flex gap-2">
                <CopyPastButton textToCopy={textToCopy} />
                <RunCommandButton command={command} />
            </div>
        </div>
    )
}


export const CopyPastButton = ({ textToCopy }: { textToCopy: string }): React.JSX.Element => {
    const copyToClipboard = async () => {
        try {
            await invoke("clipboard_write", { text: textToCopy })
            toastSuccess("Text copied to clipboard")
        } catch (error) {
            logError("CopyPastButton", error as string)
        }
    }
    return (
        <button onClick={copyToClipboard} className="text-xs bg-black hover:bg-gray-800 text-white p-2 rounded-lg">
            <CopyIcon className="size-4" />
        </button>
    )
}





export const RunCommandButton = ({ command }: { command: string }): React.JSX.Element => {
    const [isPending, startTransition] = useTransition()

    const runCommand = async () => {

        startTransition(async () => {
            try {
                await invoke("adb_command", { command: `shell ${command}` })
                toastSuccess("Command executed successfully")
            } catch (error: any) {
                logError("RunCommandButton", error.message)
                toastError(error.message)
            }
        })

    }

    const runCommandPromise = async () => {
        toastPromise(
            runCommand(),
            "Running command...",
            () => "Command executed successfully",
            (error: any) => error.message
        )
    }
    return (
        <button disabled={isPending} onClick={runCommandPromise} className="bg-green-600 hover:bg-green-800 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ">
            <TerminalIcon className="size-4" />
        </button>
    )
}