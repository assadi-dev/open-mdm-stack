import AdbServerStart from "./commandSection/AdbServerStart";
import AdbAdminCommands from "./commandSection/AdbAdminCommands";
import NetworkSection from "./commandSection/NetworkSection";

export default function AppContent(): React.JSX.Element {
    return (
        <div className="themed-scrollbar flex w-full h-full flex-col gap-8 overflow-y-auto py-6 px-6">
            <AdbServerStart />
            <AdbAdminCommands />
            <NetworkSection />
        </div>
    )
}
