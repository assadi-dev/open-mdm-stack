import packageJson from '../../package.json'

export default function AppFooter(): React.JSX.Element {
    return (
        <div className="flex w-full items-center justify-center gap-3 border-t border-border-subtle px-5 py-3 text-xs text-text-muted">
            <p>© 2026 Open MDM Stack</p>
            <span aria-hidden="true">·</span>
            <p className="font-mono">v{packageJson.version}</p>
        </div>
    )
}
