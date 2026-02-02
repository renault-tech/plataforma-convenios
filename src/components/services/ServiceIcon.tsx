import {
    FileText,
    Database,
    Layout,
    Users,
    Settings,
    Activity,
    AlertCircle,
    CheckCircle2,
    LayoutDashboard,
    Folder,
    Briefcase,
    Clipboard,
    Calendar
} from "lucide-react"

interface ServiceIconProps {
    name?: string
    className?: string
    style?: React.CSSProperties
}

export function ServiceIcon({ name, className, style }: ServiceIconProps) {
    // Map common icon names to components
    const icons: Record<string, any> = {
        FileText,
        Database,
        Layout,
        Users,
        Settings,
        Activity,
        AlertCircle,
        CheckCircle2,
        LayoutDashboard,
        Folder,
        Briefcase,
        Clipboard,
        Calendar
    }

    const IconComponent = icons[name || "FileText"] || FileText

    return <IconComponent className={className} style={style} />
}
