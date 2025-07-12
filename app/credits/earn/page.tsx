"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Award, BookOpen, Users, Calendar, Gift } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import type { User, DailyTask } from "@/lib/types"

interface TaskItem {
  id: string
  title: string
  description: string
  credits: number
  icon: React.ReactNode
  completed: boolean
  type: string
}

function EarnCreditsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)

  const tasks: TaskItem[] = [
    {
      id: "daily-login",
      title: "Daily Login",
      description: "Log in to the platform",
      credits: 5,
      icon: <Calendar className="w-5 h-5" />,
      completed: false,
      type: "daily_login",
    },
    {
      id: "complete-profile",
      title: "Complete Profile",
      description: "Add skills and preferences to your profile",
      credits: 20,
      icon: <Users className="w-5 h-5" />,
      completed: false,
      type: "complete_profile",
    },
    {
      id: "teach-session",
      title: "Teach a Skill",
      description: "Complete a teaching session",
      credits: 25,
      icon: <BookOpen className="w-5 h-5" />,
      completed: false,
      type: "teach_session",
    },
    {
      id: "help-community",
      title: "Help Community",
      description: "Answer questions or help other users",
      credits: 15,
      icon: <Users className="w-5 h-5" />,
      completed: false,
      type: "help_community",
    },
  ]

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

      // Fetch daily tasks
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

  const completeTask = async (taskId: string, taskType: string, credits: number) => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      const today = new Date().toISOString().split("T")[0]

      // Check if task already completed today
      const { data: existingTask } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("task_type", taskType)
        .eq("completed_date", today)
        .single()

      if (existingTask) {
        alert("Task already completed today!")
        return
      }

      // Add task completion
      const { error: taskError } = await supabase.from("daily_tasks").insert([
        {
          user_id: authUser.id,
          task_type: taskType,
          completed_date: today,
          credits_earned: credits,
        },
      ])

      if (taskError) {
        console.error("Error completing task:", taskError)
        return
      }

      // Add credit transaction
      const { error: transactionError } = await supabase.from("credit_transactions").insert([
        {
          user_id: authUser.id,
          amount: credits,
          type: "earned",
          description: `Completed: ${tasks.find((t) => t.id === taskId)?.title}`,
          created_at: new Date().toISOString(),
        },
      ])

      if (transactionError) {
        console.error("Error adding transaction:", transactionError)
        return
      }

      // Update user credits
      const { error: updateError } = await supabase
        .from("users")
        .update({ credits: (user?.credits || 0) + credits })
        .eq("id", authUser.id)

      if (updateError) {
        console.error("Error updating credits:", updateError)
        return
      }

      // Refresh data
      fetchEarnData()
      alert(`Congratulations! You earned ${credits} credits!`)
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const isTaskCompleted = (taskType: string) => {
    return dailyTasks.some((task) => task.task_type === taskType)
  }

  const completedTasksCount = tasks.filter((task) => isTaskCompleted(task.type)).length
  const progressPercentage = (completedTasksCount / tasks.length) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earn Credits</h1>
          <p className="text-gray-600">Complete tasks and activities to earn credits for learning</p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-blue-600" />
              <span>Daily Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks Completed Today</span>
                <span className="text-sm text-gray-600">
                  {completedTasksCount} of {tasks.length}
                </span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Keep going! Complete all tasks for bonus credits.</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {user?.credits || 0} credits
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {tasks.map((task) => {
            const completed = isTaskCompleted(task.type)
            return (
              <Card
                key={task.id}
                className={`transition-all ${completed ? "bg-green-50 border-green-200" : "hover:shadow-md"}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${completed ? "bg-green-100" : "bg-blue-100"}`}>
                        {completed ? <CheckCircle className="w-5 h-5 text-green-600" /> : task.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant={completed ? "default" : "secondary"}
                      className={completed ? "bg-green-100 text-green-800" : ""}
                    >
                      {task.credits} credits
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {completed ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Available</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      disabled={completed}
                      onClick={() => completeTask(task.id, task.type, task.credits)}
                      className={completed ? "bg-green-100 text-green-800" : ""}
                    >
                      {completed ? "Completed" : "Complete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bonus Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-6 h-6 text-purple-600" />
              <span>Bonus Opportunities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Weekly Teaching</h4>
                <p className="text-sm text-gray-600 mb-2">Teach 3+ sessions this week</p>
                <Badge variant="outline">+50 credits</Badge>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Community Helper</h4>
                <p className="text-sm text-gray-600 mb-2">Help 5+ community members</p>
                <Badge variant="outline">+30 credits</Badge>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Perfect Week</h4>
                <p className="text-sm text-gray-600 mb-2">Complete all daily tasks for 7 days</p>
                <Badge variant="outline">+100 credits</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EarnCreditsPage() {
  return (
    <AuthGuard>
      <EarnCreditsContent />
    </AuthGuard>
  )
}
