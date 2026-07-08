import {
  BookOpen,
  FolderTree,
  LayoutDashboard,
  Library,
  Settings,
  Upload,
  Users,
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
  { title: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { title: "Library", href: "/dashboard/library", icon: Library },
  { title: "Users", href: "/dashboard/users", icon: Users },
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
