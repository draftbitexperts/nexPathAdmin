import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { recentActivity } from "@/lib/data"

export function RecentActivity() {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your workspace</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px] px-6 pb-4">
          <ul className="space-y-4">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {item.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
