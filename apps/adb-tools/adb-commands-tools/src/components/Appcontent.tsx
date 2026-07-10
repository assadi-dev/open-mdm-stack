import AdbServerStart from "./commandSection/AdbServerStart";
import AdbAdminCommands from "./commandSection/AdbAdminCommands";

export default function AppContent(): React.JSX.Element {
    return (
        <div className="flex w-full h-full flex-col gap-8 overflow-y-auto py-6">
            <AdbServerStart />
            <AdbAdminCommands />
        </div>
    )
}
