import AdbServerStart from "./commandSection/AdbServerStart";
import AdbAdminCommands from "./commandSection/AdbAdminCommands";

export default function AppContent(): React.JSX.Element {
    return (
        <div className="w-full h-full py-5 overflow-y-auto">
            <AdbServerStart />
            <AdbAdminCommands />
        </div>
    )
}