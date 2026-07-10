export default function SectionHeading({ children }: { children: React.ReactNode }): React.JSX.Element {
    return (
        <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-xs font-semibold tracking-widest text-text-muted uppercase">{children}</p>
            <div className="h-px w-full bg-border-subtle" />
        </div>
    )
}
