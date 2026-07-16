import type { LucideIcon } from "lucide-react"
import {
  Briefcase,
  Bus,
  CircleHelp,
  DollarSign,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Phone,
  Scale,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  bus: Bus,
  "dollar-sign": DollarSign,
  folder: Folder,
  "graduation-cap": GraduationCap,
  heart: Heart,
  home: Home,
  phone: Phone,
  scale: Scale,
}

export function categoryIcon(iconKey: string | null | undefined): LucideIcon {
  if (!iconKey) return CircleHelp
  return ICON_MAP[iconKey] ?? CircleHelp
}
