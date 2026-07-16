import { useSearchParams } from "react-router-dom"

import { LoginForm } from "@/components/login-form"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function LoginPage() {
  useDocumentTitle("Login")
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get("next")

  return (
    <div className="bg-background relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.03_255)_0%,_transparent_55%),linear-gradient(to_bottom,_oklch(0.985_0.002_247),_oklch(0.97_0.01_255))] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.05_255)_0%,_transparent_55%),linear-gradient(to_bottom,_oklch(0.16_0.015_260),_oklch(0.2_0.025_255))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-[oklch(0.7_0.08_255_/0.16)] blur-3xl sm:-top-24 sm:-right-24 sm:size-96 dark:bg-[oklch(0.55_0.12_255_/0.28)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-[oklch(0.75_0.06_200_/0.18)] blur-3xl sm:-bottom-32 sm:-left-20 sm:size-80 dark:bg-[oklch(0.5_0.1_220_/0.25)]"
      />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  )
}
