export default function AppTitle(): React.JSX.Element {
    return (
        <div className="flex flex-col gap-1 border-b border-border-subtle pb-4">
            <h1 className="flex items-center gap-2 font-mono text-xl font-semibold text-slate-100">
                <span aria-hidden="true" className="text-accent">❯</span>
                ADB Commands Tools
                <span aria-hidden="true" className="animate-caret-blink text-accent">_</span>
            </h1>
            <p className="text-sm text-text-muted">Run and manage ADB device commands for Open MDM Stack</p>
        </div>
    )
}
