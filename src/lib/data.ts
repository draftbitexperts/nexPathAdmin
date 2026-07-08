export type Resource = {
  id: string
  name: string
  category: string
  downloads: number
  status: "Published" | "Draft" | "Archived"
  updatedAt: string
}

export type ActivityItem = {
  id: string
  user: string
  action: string
  target: string
  time: string
  avatar: string
}

export const stats = [
  {
    title: "Total Resources",
    value: "2,847",
    change: "+12.5%",
    trend: "up" as const,
    description: "from last month",
  },
  {
    title: "Total Categories",
    value: "48",
    change: "+3",
    trend: "up" as const,
    description: "new this quarter",
  },
  {
    title: "Total Downloads",
    value: "184.2K",
    change: "+8.2%",
    trend: "up" as const,
    description: "from last month",
  },
  {
    title: "Active Users",
    value: "3,621",
    change: "-2.1%",
    trend: "down" as const,
    description: "from last week",
  },
]

export const latestResources: Resource[] = [
  {
    id: "1",
    name: "Brand Guidelines 2026",
    category: "Design",
    downloads: 1240,
    status: "Published",
    updatedAt: "Jul 7, 2026",
  },
  {
    id: "2",
    name: "API Reference Pack",
    category: "Engineering",
    downloads: 986,
    status: "Published",
    updatedAt: "Jul 6, 2026",
  },
  {
    id: "3",
    name: "Onboarding Checklist",
    category: "People",
    downloads: 712,
    status: "Draft",
    updatedAt: "Jul 5, 2026",
  },
  {
    id: "4",
    name: "Sales Playbook Q3",
    category: "Sales",
    downloads: 1543,
    status: "Published",
    updatedAt: "Jul 4, 2026",
  },
  {
    id: "5",
    name: "Security Whitepaper",
    category: "Compliance",
    downloads: 428,
    status: "Archived",
    updatedAt: "Jul 2, 2026",
  },
  {
    id: "6",
    name: "Product Roadmap Deck",
    category: "Product",
    downloads: 2104,
    status: "Published",
    updatedAt: "Jul 1, 2026",
  },
]

export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    user: "Sarah Chen",
    action: "uploaded",
    target: "Brand Guidelines 2026",
    time: "12 min ago",
    avatar: "SC",
  },
  {
    id: "2",
    user: "Marcus Lee",
    action: "created category",
    target: "Compliance",
    time: "48 min ago",
    avatar: "ML",
  },
  {
    id: "3",
    user: "Amelia Torres",
    action: "downloaded",
    target: "Sales Playbook Q3",
    time: "2 hours ago",
    avatar: "AT",
  },
  {
    id: "4",
    user: "James Park",
    action: "updated",
    target: "API Reference Pack",
    time: "4 hours ago",
    avatar: "JP",
  },
  {
    id: "5",
    user: "Priya Nair",
    action: "archived",
    target: "Security Whitepaper",
    time: "Yesterday",
    avatar: "PN",
  },
]

export const downloadsChartData = [
  { month: "Jan", downloads: 12400 },
  { month: "Feb", downloads: 14800 },
  { month: "Mar", downloads: 16200 },
  { month: "Apr", downloads: 18900 },
  { month: "May", downloads: 21400 },
  { month: "Jun", downloads: 24100 },
  { month: "Jul", downloads: 26800 },
]

export const categoryChartData = [
  { name: "Design", value: 32, fill: "oklch(0.55 0.14 255)" },
  { name: "Engineering", value: 28, fill: "oklch(0.62 0.12 200)" },
  { name: "Product", value: 18, fill: "oklch(0.7 0.1 160)" },
  { name: "Sales", value: 14, fill: "oklch(0.72 0.12 80)" },
  { name: "Other", value: 8, fill: "oklch(0.65 0.14 25)" },
]

export type Category = {
  id: string
  name: string
  description: string
  resources: number
  status: "Active" | "Hidden"
  updatedAt: string
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: "Admin" | "Editor" | "Viewer"
  status: "Active" | "Invited" | "Suspended"
  lastActive: string
  avatar: string
}

export type LibraryCollection = {
  id: string
  name: string
  owner: string
  items: number
  visibility: "Public" | "Internal" | "Private"
  updatedAt: string
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Design",
    description: "Brand kits, UI kits, and visual guidelines",
    resources: 412,
    status: "Active",
    updatedAt: "Jul 7, 2026",
  },
  {
    id: "2",
    name: "Engineering",
    description: "API docs, SDKs, and technical packs",
    resources: 386,
    status: "Active",
    updatedAt: "Jul 6, 2026",
  },
  {
    id: "3",
    name: "Product",
    description: "Roadmaps, specs, and release notes",
    resources: 254,
    status: "Active",
    updatedAt: "Jul 5, 2026",
  },
  {
    id: "4",
    name: "Sales",
    description: "Playbooks, decks, and proposal templates",
    resources: 198,
    status: "Active",
    updatedAt: "Jul 4, 2026",
  },
  {
    id: "5",
    name: "Compliance",
    description: "Policies, audits, and security docs",
    resources: 94,
    status: "Active",
    updatedAt: "Jul 2, 2026",
  },
  {
    id: "6",
    name: "People",
    description: "Onboarding and internal workforce material",
    resources: 67,
    status: "Hidden",
    updatedAt: "Jun 28, 2026",
  },
]

export const users: AdminUser[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@nexpath.io",
    role: "Admin",
    status: "Active",
    lastActive: "12 min ago",
    avatar: "SC",
  },
  {
    id: "2",
    name: "Marcus Lee",
    email: "marcus.lee@nexpath.io",
    role: "Editor",
    status: "Active",
    lastActive: "48 min ago",
    avatar: "ML",
  },
  {
    id: "3",
    name: "Amelia Torres",
    email: "amelia.torres@nexpath.io",
    role: "Viewer",
    status: "Active",
    lastActive: "2 hours ago",
    avatar: "AT",
  },
  {
    id: "4",
    name: "James Park",
    email: "james.park@nexpath.io",
    role: "Editor",
    status: "Active",
    lastActive: "Yesterday",
    avatar: "JP",
  },
  {
    id: "5",
    name: "Priya Nair",
    email: "priya.nair@nexpath.io",
    role: "Viewer",
    status: "Invited",
    lastActive: "—",
    avatar: "PN",
  },
  {
    id: "6",
    name: "Owen Blake",
    email: "owen.blake@nexpath.io",
    role: "Viewer",
    status: "Suspended",
    lastActive: "3 weeks ago",
    avatar: "OB",
  },
]

export const libraryCollections: LibraryCollection[] = [
  {
    id: "1",
    name: "Go-to-Market Kit",
    owner: "Sarah Chen",
    items: 84,
    visibility: "Internal",
    updatedAt: "Jul 7, 2026",
  },
  {
    id: "2",
    name: "Engineering Docs",
    owner: "Marcus Lee",
    items: 162,
    visibility: "Internal",
    updatedAt: "Jul 6, 2026",
  },
  {
    id: "3",
    name: "Customer Assets",
    owner: "Amelia Torres",
    items: 57,
    visibility: "Public",
    updatedAt: "Jul 4, 2026",
  },
  {
    id: "4",
    name: "Executive Briefings",
    owner: "James Park",
    items: 23,
    visibility: "Private",
    updatedAt: "Jul 1, 2026",
  },
]
