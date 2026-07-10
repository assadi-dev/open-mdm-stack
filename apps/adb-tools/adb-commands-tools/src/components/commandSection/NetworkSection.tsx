import { CopyIcon } from "@components/Icons/comons"
import IconButton from "@components/ui/IconButton"
import SectionHeading from "@components/ui/SectionHeading"
import useGetNetwork from "@hooks/useGetNetwork"
import { toastError, toastSuccess } from "@lib/toast"
import { invoke } from "@tauri-apps/api/core"

export default function NetworkSection(): React.JSX.Element {
    const networkInterfaces = useGetNetwork()

    return (
        <section>
            <SectionHeading>Network</SectionHeading>
            {networkInterfaces.length === 0 ? (
                <div className="rounded-lg border border-border-subtle bg-surface px-4 py-6 text-center text-sm text-text-muted">
                    No network interfaces detected
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {networkInterfaces.map((networkInterface) => (
                        <div key={networkInterface.name} className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
                            <p className="mb-2 font-mono text-xs font-semibold text-accent">
                                <span aria-hidden="true" className="mr-2 text-text-muted">❯</span>
                                {networkInterface.name}
                            </p>
                            <div className="flex flex-col gap-2 pl-5">
                                <AddressRow label="IPv4" addresses={networkInterface.ipv4} />
                                <AddressRow label="IPv6" addresses={networkInterface.ipv6} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

const AddressRow = ({ label, addresses }: { label: string; addresses: string[] }): React.JSX.Element | null => {
    if (addresses.length === 0) return null

    const copyToClipboard = async (address: string) => {
        try {
            await invoke("clipboard_write", { text: address })
            toastSuccess(`Text copied to clipboard`)
        } catch (error) {
            toastError("Failed to copy to clipboard")
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded border border-border-subtle bg-white/5 px-1.5 py-0.5 w-10 shrink-0 font-mono text-[11px] font-semibold tracking-wide text-text-muted uppercase">{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {addresses.map((address) => (
                    <span key={address} className="flex items-center gap-2 px-1.5 py-0.5 font-mono text-lg font-semibold text-slate-300">
                        {address}

                        <button onClick={() => copyToClipboard(address)} className="cursor-pointer rounded-md px-1 py-1.5 hover:bg-surface-hover">
                            <CopyIcon className="size-4" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    )
}
