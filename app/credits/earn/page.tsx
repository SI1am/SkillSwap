"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, CheckCircle, Clock, Star, Gift, Coins, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User, DailyTask } from "@/lib/types"

interface EarnOpportunity {
  id: string
  title: string
  description: string
  credits: number
  icon: React.ReactNode
  action: string
  href?: string
  completed?: boolean
  available?: boolean
}

export default function EarnCreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completingTask, setCompletingTask] = useState<string | null>(null)

  useEffect(() => {
    fetchEarnData()
  }, [])

  const fetchEarnData = async () => {
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

      // Fetch today's tasks
      const today = new Date().toISOString().split("T")[0]
      const { data: tasksData } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("completed_date", today)

      if (tasksData) {
        setDailyTasks(tasksData)
      }
    } catch (error) {
      console.error("Error fetching earn data:", error)
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskType: string, credits: number, description: string) => {
    if (!user) return

    setCompletingTask(taskType)
    try {
      const today = new Date().toISOString().split("T")[0]

      // Check if task already completed today
      const { data: existingTask } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_type", taskType)
        .eq("completed_date", today)
        .single()

      if (existingTask) {
        alert("Task already completed today!")
        return
      }

      // Add task completion
      await supabase.from("daily_tasks").insert({
        user_id: user.id,
        task_type: taskType,
        description: description,
        credits_reward: credits,
        completed_date: today,
      })

      // Update user credits
      const { error: creditError } = await supabase
        .from("users")
        .update({ credits: user.credits + credits })
        .eq("id", user.id)

      if (creditError) {
        console.error("Error updating credits:", creditError)
        return
      }

      // Add credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: credits,
        type: "earned",
        description: description,
      })

      // Update local state
      setUser((prev) => (prev ? { ...prev, credits: prev.credits + credits } : null))
      fetchEarnData()
    } catch (error) {
      console.error("Error completing task:", error)
    } finally {
      setCompletingTask(null)
    }
  }

  const isTaskCompleted = (taskType: string) => {
    return dailyTasks.some((task) => task.task_type === taskType)
  }

  const earnOpportunities: EarnOpportunity[] = [
    {
      id: "daily-login",
      title: "Daily Login",
      description: "Log in to the platform daily",
      credits: 5,
      icon: <CheckCircle className="w-5 h-5" />,
      action: "Complete",
      completed: isTaskCompleted("daily_login"),
      available: true,
    },
    {
      id: "teach-skill",
      title: "Teach a Skill",
      description: "Complete a teaching session",
      credits: 30,
      icon: <BookOpen className="w-5 h-5" />,
      action: "Start Teaching",
      href: "/skills/manage",
      available: true,
    },
    {
      id: "help-student",
      title: "Help a Student",
      description: "Answer questions or provide guidance",
      credits: 15,
      icon: <Users className="w-5 h-5" />,
      action: "Find Students",
      href: "/community",
      available: true,
    },
    {
      id: "complete-profile",
      title: "Complete Profile",
      description: "Add bio and skills to your profile",
      credits: 10,
      icon: <Star className="w-5 h-5" />,
      action: "Update Profile",
      href: "/profile",
      completed: user?.bio && user.bio.length > 0,
      available: true,
    },
    {
      id: "refer-friend",
      title: "Refer a Friend",
      description: "Invite someone to join the platform",
      credits: 25,
      icon: <Gift className="w-5 h-5" />,
      action: "Send Invite",
      href: "/referral",
      available: true,
    },
    {
      id: "weekly-goal",
      title: "Weekly Learning Goal",
      description: "Complete 3 learning sessions this week",
      credits: 50,
      icon: <Target className="w-5 h-5" />,
      action: "View Progress",
      href: "/goals",
      available: false,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earning opportunities...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to earn credits</p>
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
            <Link href="/credits" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillSwap Campus
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">{user.credits} Credits</span>
              </div>
              <Link href="/credits">
                <Button variant="outline">Back to Wallet</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earn Credits</h1>
          <p className="text-gray-600">Complete activities and help others to earn credits for learning</p>
        </div>

        {/* Daily Progress */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Today's Progress</h3>
                <p className="text-purple-100">
                  You've earned {dailyTasks.reduce((sum, task) => sum + task.credits_reward, 0)} credits today
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{dailyTasks.length}/3</div>
                <p className="text-purple-100 text-sm">Tasks Completed</p>
              </div>
            </div>
            <Progress value={(dailyTasks.length / 3) * 100} className="mt-4 bg-purple-400" />
          </CardContent>
        </Card>

        {/* Earning Opportunities */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earnOpportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              className={`hover:shadow-lg transition-shadow ${
                opportunity.completed ? "bg-green-50 border-green-200" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        opportunity.completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {opportunity.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        +{opportunity.credits} credits
                      </Badge>
                    </div>
                  </div>
                  {opportunity.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{opportunity.description}</p>

                {opportunity.completed ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </Button>
                ) : opportunity.available ? (
                  opportunity.id === "daily-login" ? (
                    <Button
                      onClick={() => completeTask("daily_login", 5, "Daily login bonus")}
                      disabled={completingTask === "daily_login"}
                      className="w-full"
                    >
                      {completingTask === "daily_login" ? "Completing..." : opportunity.action}
                    </Button>
                  ) : opportunity.href ? (
                    <Link href={opportunity.href} className="block">
                      <Button className="w-full">{opportunity.action}</Button>
                    </Link>
                  ) : (
                    <Button className="w-full">{opportunity.action}</Button>
                  )
                ) : (
                  <Button disabled className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Earning Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Maximize Your Earnings</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Log in daily to maintain your streak</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Offer popular skills to get more teaching requests</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Be active in the community to help others</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Credit Values</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Daily tasks: 5-15 credits</li>
                  <li>Teaching sessions: 20-50 credits</li>
                  <li>Helping others: 10-25 credits</li>
                  <li>Referrals: 25 credits each</li>
                  <li>Weekly goals: 50+ credits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
