import type { ButtonHTMLAttributes } from "react"

type Variant = "ghost" | "primary" | "danger"

const variantClasses: Record<Variant, string> = {
    ghost: "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
    primary: "bg-accent/15 text-accent hover:bg-accent hover:text-slate-950",
    danger: "bg-danger/15 text-danger hover:bg-danger hover:text-slate-950",
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    label: string
}

export default function IconButton({ variant = "ghost", label, className = "", children, ...props }: IconButtonProps): React.JSX.Element {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`inline-flex size-9 items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
