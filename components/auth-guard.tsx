"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      setLoading(false)

      // Redirect logic
      if (!session?.user && !isPublicRoute) {
        router.push("/auth/login")
      } else if (session?.user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
        router.push("/dashboard")
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === "SIGNED_OUT" || !session?.user) {
        if (!isPublicRoute) {
          router.push("/auth/login")
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        if (pathname === "/auth/login" || pathname === "/auth/signup") {
          router.push("/dashboard")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname, isPublicRoute])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // For public routes, always show content
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, only show if authenticated
  if (user) {
    return <>{children}</>
  }

  // This shouldn't happen due to redirects, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Please log in</h2>
        <p className="text-gray-600">You need to be logged in to access this page.</p>
      </div>
    </div>
  )
}
