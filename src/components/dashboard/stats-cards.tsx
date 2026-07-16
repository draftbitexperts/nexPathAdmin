import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Download,
  FolderTree,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { stats } from "@/lib/data"
import { cn } from "@/lib/utils"

const icons = [BookOpen, FolderTree, Download, Users]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = icons[index]
        const isUp = stat.trend === "up"

        return (
          <Card
            key={stat.title}
            className="border-border/60 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </CardTitle>
              </div>
              <div className="bg-primary/8 text-primary flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-1 font-medium",
                    isUp
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {stat.change}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
