"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, TrendingUp, TrendingDown, Calendar, Award, BookOpen } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import type { User, CreditTransaction } from "@/lib/types"

function CreditsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

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

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })

      if (transactionsData) {
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error("Error fetching credits data:", error)
    } finally {
      setLoading(false)
    }
  }

  const earnedTransactions = transactions.filter((t) => t.type === "earned")
  const spentTransactions = transactions.filter((t) => t.type === "spent")

  const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalSpent = spentTransactions.reduce((sum, t) => sum + t.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credits Wallet</h1>
          <p className="text-gray-600">Manage your campus credits and view transaction history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Current Balance</CardTitle>
              <Coins className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{user?.credits || 0}</div>
              <p className="text-xs text-green-600 mt-1">Available credits</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Earned</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{totalEarned}</div>
              <p className="text-xs text-blue-600 mt-1">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Spent</CardTitle>
              <TrendingDown className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{totalSpent}</div>
              <p className="text-xs text-purple-600 mt-1">On learning</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="earned">Earned</TabsTrigger>
                    <TabsTrigger value="spent">Spent</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.type === "earned" ? "bg-green-100" : "bg-red-100"
                              }`}
                            >
                              <Coins
                                className={`w-5 h-5 ${
                                  transaction.type === "earned" ? "text-green-600" : "text-red-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${
                                transaction.type === "earned" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.type === "earned" ? "+" : "-"}
                              {transaction.amount}
                            </span>
                            <Badge variant={transaction.type === "earned" ? "default" : "secondary"} className="ml-2">
                              {transaction.type}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No transactions yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="earned" className="space-y-4 mt-4">
                    {earnedTransactions.length > 0 ? (
                      earnedTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Coins className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-green-600">+{transaction.amount}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No earnings yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="spent" className="space-y-4 mt-4">
                    {spentTransactions.length > 0 ? (
                      spentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <Coins className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-red-600">-{transaction.amount}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No spending yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earn More Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/credits/earn" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Award className="w-4 h-4 mr-2" />
                      Daily Tasks
                    </Button>
                  </Link>
                  <Link href="/skills/manage" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Teach Skills
                    </Button>
                  </Link>
                  <Link href="/skills" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Coins className="w-4 h-4 mr-2" />
                      Help Others
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credit Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p>Complete daily login to earn 5 credits</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p>Teaching sessions earn 15-30 credits per hour</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p>Help community members for bonus credits</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <p>Learning sessions cost 10-25 credits per hour</p>
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

export default function CreditsPage() {
  return (
    <AuthGuard>
      <CreditsContent />
    </AuthGuard>
  )
}
