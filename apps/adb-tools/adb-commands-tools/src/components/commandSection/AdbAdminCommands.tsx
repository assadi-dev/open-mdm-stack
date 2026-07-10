import { CopyIcon, TerminalIcon } from "@components/Icons/comons"
import IconButton from "@components/ui/IconButton"
import SectionHeading from "@components/ui/SectionHeading"
import { ADB_COMMANDS } from "@lib/commands"
import { logError } from "@lib/log"
import { toastError, toastPromise, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"
import { useTransition } from "react"


export default function AdbAdminCommands(): React.JSX.Element {
    return (
        <section>
            <SectionHeading>Device admin</SectionHeading>
            <div className="flex flex-col gap-3">
                <div>
                    <p className="mb-2 text-sm text-text-muted">Activate device owner</p>
                    <AdbAdminCommandCard command={ADB_COMMANDS.dpmSetDeviceOwner} variant="primary" />
                </div>
                <div>
                    <p className="mb-2 text-sm text-text-muted">Remove device owner</p>
                    <AdbAdminCommandCard command={ADB_COMMANDS.dpmRemoveDeviceOwner} variant="danger" />
                </div>
            </div>
        </section>
    )
}


const AdbAdminCommandCard = ({ command, variant }: { command: string; variant: "primary" | "danger" }): React.JSX.Element => {
    const textToCopy = `adb shell ${command}`

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface px-4 py-3">
            <p className="min-w-0 truncate font-mono text-xs text-slate-300">
                <span aria-hidden="true" className="mr-2 text-accent">❯</span>
                <span className="font-semibold text-keyword">adb</span> shell {command}
            </p>
            <div className="flex shrink-0 gap-2">
                <CopyPastButton textToCopy={textToCopy} />
                <RunCommandButton command={command} variant={variant} />
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
        <IconButton onClick={copyToClipboard} label="Copy command">
            <CopyIcon className="size-6" />
        </IconButton>
    )
}





export const RunCommandButton = ({ command, variant = "primary" }: { command: string; variant?: "primary" | "danger" }): React.JSX.Element => {
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
        <IconButton disabled={isPending} onClick={runCommandPromise} variant={variant} label="Run command">
            <TerminalIcon className="size-6" />
        </IconButton>
    )
}