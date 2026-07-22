import {
  Activity,
  BookOpen,
  Building2,
  FolderTree,
  LayoutDashboard,
  Map,
  MapPinned,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", href: "/dashboard/analytics", icon: Activity },
  { title: "Resources", href: "/dashboard/resources", icon: BookOpen },
  { title: "Providers", href: "/dashboard/providers", icon: Building2 },
  { title: "Directories", href: "/dashboard/directories", icon: MapPinned },
  { title: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { title: "Locations", href: "/dashboard/locations", icon: Map },
]

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
