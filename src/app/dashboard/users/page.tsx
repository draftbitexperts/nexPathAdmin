import type { Metadata } from "next"
import { UserPlus } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { users } from "@/lib/data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Users",
}

function statusStyles(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "Invited":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400"
    default:
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400"
  }
}

export default function UsersPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Users"
        description="People with access to the NexPath admin workspace."
        actions={
          <Button>
            <UserPlus />
            Invite user
          </Button>
        }
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
          <CardDescription>
            {users.length} members · manage roles and access
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("font-medium", statusStyles(user.status))}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {user.lastActive}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
