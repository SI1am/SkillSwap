"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Coins, TrendingUp, TrendingDown, Calendar, Award, BookOpen, CheckCircle, Gift } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User, CreditTransaction } from "@/lib/types"

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    thisMonth: 0,
  })

  useEffect(() => {
    fetchCreditsData()
  }, [])

  const fetchCreditsData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch user profile
      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userData) {
        setUser(userData)
      }

      // Fetch credit transactions
      const { data: transactionsData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })

      if (transactionsData) {
        setTransactions(transactionsData)

        // Calculate stats
        const totalEarned = transactionsData.filter((t) => t.type === "earned").reduce((sum, t) => sum + t.amount, 0)

        const totalSpent = transactionsData.filter((t) => t.type === "spent").reduce((sum, t) => sum + t.amount, 0)

        const thisMonth = transactionsData
          .filter((t) => {
            const transactionDate = new Date(t.created_at)
            const now = new Date()
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, t) => sum + (t.type === "earned" ? t.amount : -t.amount), 0)

        setStats({ totalEarned, totalSpent, thisMonth })
      }
    } catch (error) {
      console.error("Error fetching credits data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credits...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your credits</p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillSwap Campus
              </span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Wallet</h1>
          <p className="text-gray-600">Manage your credits and track your earning history</p>
        </div>

        {/* Credit Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-2">Current Balance</p>
                <h2 className="text-4xl font-bold mb-4">{user.credits} Credits</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Earned: {stats.totalEarned}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>Spent: {stats.totalSpent}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Coins className="w-16 h-16 text-green-100 mb-4" />
                <Link href="/credits/earn">
                  <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                    Earn More Credits
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <CardDescription>Your recent credit earnings and spending</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "earned" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {transaction.type === "earned" ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{transaction.description}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-semibold ${
                              transaction.type === "earned" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.type === "earned" ? "+" : "-"}
                            {transaction.amount}
                          </span>
                          <p className="text-sm text-gray-500">credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No transactions yet</p>
                    <Link href="/credits/earn">
                      <Button>Start Earning Credits</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Monthly Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold mb-2 ${stats.thisMonth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.thisMonth >= 0 ? "+" : ""}
                    {stats.thisMonth}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Net Credits</p>
                  <Progress value={Math.min((Math.abs(stats.thisMonth) / 100) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/credits/earn" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Award className="w-4 h-4 mr-2" />
                      Earn Credits
                    </Button>
                  </Link>
                  <Link href="/skills" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Spend on Learning
                    </Button>
                  </Link>
                  <Link href="/meetups/schedule" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Credit Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Gift className="w-5 h-5" />
                  <span>Earning Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Complete daily login for 5 credits</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Teach skills to earn 20-50 credits per session</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Help other students for bonus credits</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Refer friends to earn 25 credits each</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
