import packageJson from '../../package.json'

export default function AppFooter(): React.JSX.Element {
    return (
        <div className="text-center p-3 gap-3 text-xs text-gray-500">
            <p>Copyright © 2026 Open MDM Stack</p>
            <p>Version: {packageJson.version}</p>
        </div>
    )
}