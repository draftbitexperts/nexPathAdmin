import { Waypoints } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <Waypoints className="size-4" />
      </div>
      {showText ? (
        <div className="grid flex-1 text-left leading-none group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-semibold tracking-tight">NexPath</span>
          <span className="text-muted-foreground text-[11px] font-medium">
            Admin
          </span>
        </div>
      ) : null}
    </div>
  )
}
