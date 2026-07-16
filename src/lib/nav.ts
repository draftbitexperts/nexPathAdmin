import {
  BookOpen,
  Building2,
  FolderTree,
  LayoutDashboard,
  Map,
  MapPinned,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Resources", href: "/dashboard/resources", icon: BookOpen },
  { title: "Providers", href: "/dashboard/providers", icon: Building2 },
  { title: "Directories", href: "/dashboard/directories", icon: MapPinned },
  { title: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { title: "Locations", href: "/dashboard/locations", icon: Map },
]

export const secondaryNav: NavItem[] = [
  { title: "Upload", href: "/dashboard/upload", icon: Upload },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
