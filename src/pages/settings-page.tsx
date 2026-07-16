import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { cn } from "@/lib/utils"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const

export function SettingsPage() {
  useDocumentTitle("Settings")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.success("Settings saved", {
      description: "Your profile preferences have been updated.",
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance, and workspace preferences."
      />

      <div className="mx-auto grid max-w-3xl gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Switch between light and dark theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const active = mounted && theme === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "border-border/70 hover:bg-accent/50 flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                      active && "border-[#b571eb] hover:bg-transparent"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update how you appear across NexPath Admin.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    defaultValue="NexPath Admin"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="admin@nexpath.io"
                    className="h-10"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace name</Label>
                <Input
                  id="workspace"
                  defaultValue="NexPath"
                  className="h-10"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button type="submit">Save changes</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
