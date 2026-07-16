import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function getSafeNextPath(next?: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next
  }
  return "/dashboard"
}

type LoginFormProps = {
  nextPath?: string | null
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    const supabase = getSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      toast.error("Sign in failed", {
        description: signInError.message,
      })
      setLoading(false)
      return
    }

    toast.success("Welcome back", {
      description: "Redirecting to your dashboard…",
    })

    navigate(getSafeNextPath(nextPath), { replace: true })
  }

  return (
    <Card className="border-border/60 w-full max-w-md shadow-xl shadow-black/5 dark:shadow-black/40">
      <CardHeader className="space-y-4 text-center sm:text-left">
        <div className="flex justify-center sm:justify-start">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Welcome back
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
