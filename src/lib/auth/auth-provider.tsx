import * as React from "react"
import type { Session, User } from "@supabase/supabase-js"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
}

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
