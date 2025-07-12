"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Video, BookOpen, Coins, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User as UserType, Skill } from "@/lib/types"

export default function ScheduleMeetupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<UserType | null>(null)
  const [skill, setSkill] = useState<Skill | null>(null)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    mode: "virtual",
    location: "",
    meetingLink: "",
    creditsOffered: "25",
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Fetch current user
      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userData) {
        setCurrentUser(userData)
      }

      // Fetch teacher and skill from URL params
      const teacherId = searchParams.get("teacher")
      const skillId = searchParams.get("skill")

      if (teacherId) {
        const { data: teacherData } = await supabase.from("users").select("*").eq("id", teacherId).single()

        if (teacherData) {
          setTeacher(teacherData)
        }
      }

      if (skillId) {
        const { data: skillData } = await supabase.from("skills").select("*").eq("id", skillId).single()

        if (skillData) {
          setSkill(skillData)
          setFormData((prev) => ({
            ...prev,
            title: `Learn ${skillData.name}`,
          }))
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !teacher || !skill) return

    setSubmitting(true)
    setError("")

    try {
      // Check if user has enough credits
      const creditsNeeded = Number.parseInt(formData.creditsOffered)
      if (currentUser.credits < creditsNeeded) {
        setError("Insufficient credits. Please earn more credits or reduce the offer.")
        setSubmitting(false)
        return
      }

      // Create meetup
      const { data: meetupData, error: meetupError } = await supabase
        .from("meetups")
        .insert({
          teacher_id: teacher.id,
          learner_id: currentUser.id,
          skill_id: skill.id,
          title: formData.title,
          description: formData.description,
          scheduled_date: formData.date,
          scheduled_time: formData.time,
          duration_minutes: Number.parseInt(formData.duration),
          location: formData.mode === "in-person" ? formData.location : null,
          mode: formData.mode,
          meeting_link: formData.mode === "virtual" ? formData.meetingLink : null,
          credits_cost: creditsNeeded,
          status: "scheduled",
        })
        .select()
        .single()

      if (meetupError) {
        setError(meetupError.message)
        setSubmitting(false)
        return
      }

      // Deduct credits from learner
      const { error: creditError } = await supabase
        .from("users")
        .update({ credits: currentUser.credits - creditsNeeded })
        .eq("id", currentUser.id)

      if (creditError) {
        console.error("Error updating credits:", creditError)
      }

      // Create credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: currentUser.id,
        amount: creditsNeeded,
        type: "spent",
        description: `Booked session: ${formData.title}`,
        meetup_id: meetupData.id,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Booked!</h2>
            <p className="text-gray-600 mb-4">
              Your learning session has been successfully scheduled. You'll be redirected to your dashboard shortly.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/skills" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillSwap Campus
              </span>
            </Link>
            <Link href="/skills">
              <Button variant="outline">Back to Skills</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Learning Session</h1>
            <p className="text-gray-600">Book a session to learn a new skill from an expert</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Session Details Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>Provide details about your learning session</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="title">Session Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="e.g., Learn JavaScript Basics"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="What specific topics would you like to cover?"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Preferred Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange("date", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Preferred Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => handleInputChange("time", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Meeting Mode</Label>
                      <RadioGroup value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="virtual" />
                          <Label htmlFor="virtual" className="flex items-center space-x-2 cursor-pointer">
                            <Video className="w-4 h-4" />
                            <span>Virtual Meeting</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="in-person" id="in-person" />
                          <Label htmlFor="in-person" className="flex items-center space-x-2 cursor-pointer">
                            <MapPin className="w-4 h-4" />
                            <span>In-Person Meeting</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.mode === "virtual" && (
                      <div className="space-y-2">
                        <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                        <Input
                          id="meetingLink"
                          value={formData.meetingLink}
                          onChange={(e) => handleInputChange("meetingLink", e.target.value)}
                          placeholder="Zoom, Google Meet, etc."
                        />
                        <p className="text-sm text-gray-500">
                          Leave empty if you want the instructor to provide the link
                        </p>
                      </div>
                    )}

                    {formData.mode === "in-person" && (
                      <div className="space-y-2">
                        <Label htmlFor="location">Meeting Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="Library, Coffee shop, Campus building..."
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="creditsOffered">Credits to Offer</Label>
                      <Select
                        value={formData.creditsOffered}
                        onValueChange={(value) => handleInputChange("creditsOffered", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 credits</SelectItem>
                          <SelectItem value="20">20 credits</SelectItem>
                          <SelectItem value="25">25 credits</SelectItem>
                          <SelectItem value="30">30 credits</SelectItem>
                          <SelectItem value="40">40 credits</SelectItem>
                          <SelectItem value="50">50 credits</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Higher offers may increase your chances of acceptance</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Booking Session..." : "Book Session"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructor Info */}
              {teacher && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={teacher.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">{teacher.college}</p>
                        <Badge variant="secondary" className="text-xs">
                          {teacher.role}
                        </Badge>
                      </div>
                    </div>
                    {teacher.bio && <p className="text-sm text-gray-600">{teacher.bio}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Skill Info */}
              {skill && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skill</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-medium mb-2">{skill.name}</h3>
                    <Badge variant="outline" className="mb-3">
                      {skill.category}
                    </Badge>
                    {skill.description && <p className="text-sm text-gray-600">{skill.description}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Credit Balance */}
              {currentUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Coins className="w-5 h-5" />
                      <span>Your Credits</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{currentUser.credits}</div>
                      <p className="text-sm text-gray-600 mb-4">Available Credits</p>
                      <div className="text-sm">
                        <p className="text-gray-600">
                          Session Cost: <span className="font-medium">{formData.creditsOffered} credits</span>
                        </p>
                        <p className="text-gray-600">
                          Remaining:{" "}
                          <span className="font-medium">
                            {currentUser.credits - Number.parseInt(formData.creditsOffered)} credits
                          </span>
                        </p>
                      </div>
                      {currentUser.credits < Number.parseInt(formData.creditsOffered) && (
                        <div className="mt-4">
                          <Alert>
                            <AlertDescription className="text-sm">
                              Insufficient credits. You need{" "}
                              {Number.parseInt(formData.creditsOffered) - currentUser.credits} more credits.
                            </AlertDescription>
                          </Alert>
                          <Link href="/credits/earn" className="block mt-2">
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              Earn More Credits
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
