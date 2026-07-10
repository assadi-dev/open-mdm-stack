import { ADB_COMMANDS } from "@lib/commands"
import { logError } from "@lib/log"
import { toastSuccess } from "@lib/toast"


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
            <p className="text-sm"><span className="font-bold text-yellow-400">adb</span> shell {command}</p>
            <div className="flex gap-2">
                <CopyPastButton textToCopy={textToCopy} />
                <button className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-lg border border-gray-200">Run</button>
            </div>
        </div>
    )
}


export const CopyPastButton = ({ textToCopy }: { textToCopy: string }): React.JSX.Element => {
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy)
            toastSuccess("Text copied to clipboard")
        } catch (error) {
            logError("CopyPastButton", error as string)
        }
    }
    return (
        <button onClick={copyToClipboard} className="text-sm bg-black hover:bg-gray-800 text-white px-2 py-2 rounded-lg border border-gray-200">copy</button>
    )
}