import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { Outlet } from "react-router-dom"

export function RootLayout() {
  return (
    <div className="bg-background text-foreground min-h-full font-sans antialiased">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <TooltipProvider>
            <Outlet />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}
