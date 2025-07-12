"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, MapPin, Video, Coins } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import type { Skill, User } from "@/lib/types"

export default function ScheduleMeetupPage() {
  return (
    <AuthGuard>
      <ScheduleMeetupContent />
    </AuthGuard>
  )
}

function ScheduleMeetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [skills, setSkills] = useState<Skill[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    skillId: searchParams.get("skill") || "",
    teacherId: searchParams.get("teacher") || "",
    title: "",
    description: "",
    scheduledDate: undefined as Date | undefined,
    scheduledTime: "",
    mode: "",
    location: "",
    meetingLink: "",
    creditsCost: 15,
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.skillId) {
      fetchTeachersForSkill(formData.skillId)
    }
  }, [formData.skillId])

  const fetchInitialData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch current user
      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()
      if (userData) {
        setCurrentUser(userData)
      }

      // Fetch all skills
      const { data: skillsData } = await supabase.from("skills").select("*").order("name")
      if (skillsData) {
        setSkills(skillsData)
      }

      // If skill is pre-selected, set the title
      if (searchParams.get("skill")) {
        const selectedSkill = skillsData?.find((s) => s.id === searchParams.get("skill"))
        if (selectedSkill) {
          setFormData((prev) => ({
            ...prev,
            title: `Learn ${selectedSkill.name}`,
          }))
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchTeachersForSkill = async (skillId: string) => {
    try {
      const { data } = await supabase
        .from("user_skills")
        .select(`
          user:users(*)
        `)
        .eq("skill_id", skillId)
        .eq("type", "offered")

      if (data) {
        const teachersList = data.map((item) => item.user).filter(Boolean) as User[]
        setTeachers(teachersList)
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      // Validation
      if (!formData.skillId || !formData.teacherId || !formData.scheduledDate || !formData.scheduledTime) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      if (currentUser && currentUser.credits < formData.creditsCost) {
        setError("Insufficient credits for this session")
        setLoading(false)
        return
      }

      // Create meetup
      const { data: meetupData, error: meetupError } = await supabase
        .from("meetups")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            teacher_id: formData.teacherId,
            learner_id: authUser.id,
            skill_id: formData.skillId,
            scheduled_date: formData.scheduledDate.toISOString().split("T")[0],
            scheduled_time: formData.scheduledTime,
            mode: formData.mode,
            location: formData.location,
            meeting_link: formData.meetingLink,
            credits_cost: formData.creditsCost,
            status: "scheduled",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (meetupError) {
        setError("Failed to schedule meetup: " + meetupError.message)
        setLoading(false)
        return
      }

      // Deduct credits from learner
      const { error: creditError } = await supabase
        .from("users")
        .update({ credits: (currentUser?.credits || 0) - formData.creditsCost })
        .eq("id", authUser.id)

      if (creditError) {
        setError("Failed to process payment")
        setLoading(false)
        return
      }

      // Add credit transaction for learner
      const { error: transactionError } = await supabase.from("credit_transactions").insert([
        {
          user_id: authUser.id,
          amount: formData.creditsCost,
          type: "spent",
          description: `Learning session: ${formData.title}`,
          meetup_id: meetupData.id,
          created_at: new Date().toISOString(),
        },
      ])

      if (transactionError) {
        console.error("Error adding transaction:", transactionError)
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      setError("An unexpected error occurred")
      console.error("Error scheduling meetup:", error)
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Learning Session</h1>
            <p className="text-gray-600">Book a session with an instructor to learn a new skill</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Skill Selection */}
                <div className="space-y-2">
                  <Label htmlFor="skill">Skill to Learn *</Label>
                  <Select value={formData.skillId} onValueChange={(value) => handleInputChange("skillId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name} - {skill.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Teacher Selection */}
                {formData.skillId && (
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Instructor *</Label>
                    <Select value={formData.teacherId} onValueChange={(value) => handleInputChange("teacherId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} - {teacher.college}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Session Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Learn React Basics"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="What would you like to learn in this session?"
                    rows={3}
                  />
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledDate}
                        onSelect={(date) => handleInputChange("scheduledDate", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Select
                    value={formData.scheduledTime}
                    onValueChange={(value) => handleInputChange("scheduledTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode Selection */}
                <div className="space-y-2">
                  <Label htmlFor="mode">Meeting Mode *</Label>
                  <Select value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>Virtual</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in-person">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>In-Person</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location/Meeting Link */}
                {formData.mode === "in-person" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="e.g., Library Study Room 3"
                    />
                  </div>
                )}

                {formData.mode === "virtual" && (
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      value={formData.meetingLink}
                      onChange={(e) => handleInputChange("meetingLink", e.target.value)}
                      placeholder="e.g., Zoom/Google Meet link"
                    />
                  </div>
                )}

                {/* Credits Cost */}
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits Cost</Label>
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-green-600" />
                    <Input
                      id="credits"
                      type="number"
                      value={formData.creditsCost}
                      onChange={(e) => handleInputChange("creditsCost", Number.parseInt(e.target.value))}
                      min="1"
                      max="50"
                    />
                    <span className="text-sm text-gray-600">credits per hour</span>
                  </div>
                  {currentUser && <p className="text-sm text-gray-600">Your balance: {currentUser.credits} credits</p>}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || (currentUser && currentUser.credits < formData.creditsCost)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? "Scheduling..." : `Schedule Session (${formData.creditsCost} credits)`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
