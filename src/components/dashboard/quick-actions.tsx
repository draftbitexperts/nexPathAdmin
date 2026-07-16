import * as React from "react"
import { Link } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { FolderPlus, Library, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const actions = [
  {
    title: "Upload Resource",
    description: "Add a new file to the library",
    icon: Upload,
    href: "/dashboard/upload",
  },
  {
    title: "Create Category",
    description: "Organize resources into groups",
    icon: FolderPlus,
    dialog: "category" as const,
  },
  {
    title: "Manage Library",
    description: "Review and organize collections",
    icon: Library,
    href: "/dashboard/library",
  },
]

const itemClassName =
  "border-border/70 bg-card hover:border-primary/30 hover:bg-accent/40 flex flex-col items-start gap-3 rounded-xl border p-4 text-left shadow-sm transition-all"

export function QuickActions() {
  const { pathname } = useLocation()
  const [open, setOpen] = React.useState(false)

  function handleConfirm() {
    toast.success("Category ready", {
      description: "This is a demo action with placeholder data.",
    })
    setOpen(false)
  }

  function isSelected(href?: string, dialogOpen?: boolean) {
    if (dialogOpen) return true
    if (!href) return false
    return pathname === href
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Common tasks to keep your library moving
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          if ("href" in action && action.href) {
            const selected = isSelected(action.href)

            return (
              <Link
                key={action.title}
                to={action.href}
                className={cn(
                  itemClassName,
                  selected && "border-[#b571eb] hover:bg-card"
                )}
              >
                <div className="bg-primary/8 text-primary flex size-9 items-center justify-center rounded-lg">
                  <action.icon className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            )
          }

          return (
            <Dialog key={action.title} open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      itemClassName,
                      isSelected(undefined, open) &&
                        "border-[#b571eb] hover:bg-card"
                    )}
                  />
                }
              >
                <div className="bg-primary/8 text-primary flex size-9 items-center justify-center rounded-lg">
                  <action.icon className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{action.title}</DialogTitle>
                  <DialogDescription>
                    Demo dialog — wire this up to your API when ready.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category name</Label>
                    <Input id="category-name" placeholder="Marketing" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm}>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        })}
      </CardContent>
    </Card>
  )
}
