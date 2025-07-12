import { supabase } from "./supabase"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      return null
    }

    // Get user profile from our users table
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", authUser.id).single()

    if (userError || !userData) {
      return null
    }

    return userData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export async function checkAuthState() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Error checking auth state:", error)
    return null
  }

  return session
}
