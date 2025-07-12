"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Calendar, Coins, TrendingUp, Star, Award, Target, Plus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User, UserSkill, Meetup, CreditTransaction } from "@/lib/types"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [offeredSkills, setOfferedSkills] = useState<UserSkill[]>([])
  const [wantedSkills, setWantedSkills] = useState<UserSkill[]>([])
  const [upcomingMeetups, setUpcomingMeetups] = useState<Meetup[]>([])
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
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

      // Fetch user skills
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select(`
          *,
          skill:skills(*)
        `)
        .eq("user_id", authUser.id)

      if (skillsData) {
        setOfferedSkills(skillsData.filter((s) => s.type === "offered"))
        setWantedSkills(skillsData.filter((s) => s.type === "wanted"))
      }

      // Fetch upcoming meetups
      const { data: meetupsData } = await supabase
        .from("meetups")
        .select(`
          *,
          teacher:users!teacher_id(*),
          learner:users!learner_id(*),
          skill:skills(*)
        `)
        .or(`teacher_id.eq.${authUser.id},learner_id.eq.${authUser.id}`)
        .eq("status", "scheduled")
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .limit(5)

      if (meetupsData) {
        setUpcomingMeetups(meetupsData)
      }

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (transactionsData) {
        setRecentTransactions(transactionsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your dashboard</p>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SkillSwap Campus
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/skills">
                <Button variant="ghost">Browse Skills</Button>
              </Link>
              <Link href="/credits">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Coins className="w-4 h-4" />
                  <span>{user.credits} Credits</span>
                </Button>
              </Link>
              <Avatar>
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Here's what's happening with your skill exchange journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{user.credits}</div>
              <p className="text-xs text-muted-foreground">Available for learning</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Offered</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{offeredSkills.length}</div>
              <p className="text-xs text-muted-foreground">Ready to teach</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{wantedSkills.length}</div>
              <p className="text-xs text-muted-foreground">Skills to learn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{upcomingMeetups.length}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Meetups */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Sessions</span>
                  </CardTitle>
                  <Link href="/meetups">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingMeetups.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeetups.map((meetup) => (
                      <div key={meetup.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{meetup.title}</h4>
                            <p className="text-sm text-gray-600">
                              {meetup.skill?.name} • {meetup.mode}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(meetup.scheduled_date).toLocaleDateString()} at {meetup.scheduled_time}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{meetup.credits_cost} credits</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No upcoming sessions</p>
                    <Link href="/skills">
                      <Button>Browse Skills to Learn</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Recent Credit Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.type === "earned" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            <Coins
                              className={`w-4 h-4 ${transaction.type === "earned" ? "text-green-600" : "text-red-600"}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-medium ${transaction.type === "earned" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "earned" ? "+" : "-"}
                          {transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skills I Offer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Skills I Teach</CardTitle>
                  <Link href="/skills/manage">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {offeredSkills.slice(0, 5).map((userSkill) => (
                    <div key={userSkill.id} className="flex items-center justify-between">
                      <span className="text-sm">{userSkill.skill?.name}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Level {userSkill.proficiency_level}
                      </Badge>
                    </div>
                  ))}
                  {offeredSkills.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills I Want to Learn */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Want to Learn</CardTitle>
                  <Link href="/skills/manage">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wantedSkills.slice(0, 5).map((userSkill) => (
                    <div key={userSkill.id} className="flex items-center justify-between">
                      <span className="text-sm">{userSkill.skill?.name}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Interested
                      </Badge>
                    </div>
                  ))}
                  {wantedSkills.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No learning goals set</p>
                  )}
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
                  <Link href="/skills" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Skills
                    </Button>
                  </Link>
                  <Link href="/meetups/schedule" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Button>
                  </Link>
                  <Link href="/credits/earn" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Award className="w-4 h-4 mr-2" />
                      Earn Credits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
