"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Users, Calendar, TrendingUp, Star, Clock, Coins, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  totalCredits: number
  skillsOffered: number
  skillsWanted: number
  upcomingMeetups: number
  completedSessions: number
  rating: number
}

interface RecentActivity {
  id: string
  type: "meetup" | "skill_added" | "credits_earned"
  description: string
  timestamp: string
  amount?: number
}

interface UpcomingMeetup {
  id: string
  title: string
  date: string
  time: string
  participant: string
  type: "teaching" | "learning"
  credits: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCredits: 0,
    skillsOffered: 0,
    skillsWanted: 0,
    upcomingMeetups: 0,
    completedSessions: 0,
    rating: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingMeetups, setUpcomingMeetups] = useState<UpcomingMeetup[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      // Get user profile
      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userData) {
        setUser(userData)
        setStats((prev) => ({
          ...prev,
          totalCredits: userData.credits || 0,
        }))
      }

      // Get user skills count
      const { data: userSkills } = await supabase.from("user_skills").select("type").eq("user_id", authUser.id)

      if (userSkills) {
        const offered = userSkills.filter((skill) => skill.type === "offered").length
        const wanted = userSkills.filter((skill) => skill.type === "wanted").length
        setStats((prev) => ({
          ...prev,
          skillsOffered: offered,
          skillsWanted: wanted,
        }))
      }

      // Mock data for other stats (you can implement these with real data later)
      setStats((prev) => ({
        ...prev,
        upcomingMeetups: 2,
        completedSessions: 8,
        rating: 4.8,
      }))

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "credits_earned",
          description: "Earned credits from teaching JavaScript",
          timestamp: "2 hours ago",
          amount: 25,
        },
        {
          id: "2",
          type: "meetup",
          description: "Scheduled meetup for Python tutoring",
          timestamp: "1 day ago",
        },
        {
          id: "3",
          type: "skill_added",
          description: "Added React to your skill list",
          timestamp: "3 days ago",
        },
      ])

      // Mock upcoming meetups
      setUpcomingMeetups([
        {
          id: "1",
          title: "JavaScript Fundamentals",
          date: "Tomorrow",
          time: "2:00 PM",
          participant: "Sarah Chen",
          type: "teaching",
          credits: 25,
        },
        {
          id: "2",
          title: "Advanced Python",
          date: "Friday",
          time: "4:00 PM",
          participant: "Mike Johnson",
          type: "learning",
          credits: 30,
        },
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || "Student"}! 👋</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your skill exchange journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credits</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalCredits}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skills Offered</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.skillsOffered}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Goals</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.skillsWanted}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <div className="flex items-center space-x-1">
                    <p className="text-3xl font-bold text-yellow-600">{stats.rating}</p>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Meetups */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Upcoming Meetups</span>
                    </CardTitle>
                    <CardDescription>Your scheduled learning sessions</CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/meetups/schedule">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule New
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMeetups.map((meetup) => (
                    <div key={meetup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            {meetup.participant.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{meetup.title}</h4>
                          <p className="text-sm text-gray-600">
                            {meetup.date} at {meetup.time} • {meetup.participant}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={meetup.type === "teaching" ? "default" : "secondary"}>
                          {meetup.type === "teaching" ? "Teaching" : "Learning"}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {meetup.type === "teaching" ? "+" : "-"}
                            {meetup.credits} credits
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {upcomingMeetups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming meetups scheduled</p>
                      <Button asChild className="mt-4 bg-transparent" variant="outline">
                        <Link href="/skills">Browse Skills to Learn</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        {activity.amount && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            +{activity.amount} credits
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/skills">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Skills
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/credits/earn">
                    <Coins className="w-4 h-4 mr-2" />
                    Earn Credits
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/meetups/schedule">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meetup
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
